import {
  AuthInfo,
  Context,
  ContractIssuer,
  constructContinueTx,
  constructContractRef,
  constructRead,
  constructStore,
  constructTake,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  HexBigInt,
  PAYMENT_STATUS,
  PositionFundsClaimBody,
  PositionStateClaimBody,
  createActivePositionIndexKey,
  createBestByQuoteActiveIndexKey,
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { L1Types, TypedClaim } from '../../../types';
import {
  constructSendCweb,
  createCallWithL1EventBlock,
  createClosedIndexClaim,
  createFundsClaim,
  createPositionStateClaim,
  constructJumpCall,
  createBestByQuoteIndex,
  getInstanceParameters,
  createEvmEventClaimKey,
  constructConditional,
} from '../../../utils';

const constructTotalAccept = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  sendAmount: bigint,
  cwebAccount: string,
) => {
  const transactionFee = 3000n;

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, transactionFee),
      constructTake(createPositionFundsKey(positionId)),
      ...constructSendCweb(sendAmount, cwebAccount, null),
      ...constructConditional(positionState.activityStatus === ACTIVITY_STATUS.ACTIVE, [
        constructTake(createActivePositionIndexKey(positionState.createdAt, positionId)),
        constructTake(
          createBestByQuoteActiveIndexKey(
            createBestByQuoteIndex(positionState.baseAmount, positionState.quoteAmount),
            positionId,
          ),
        ),
      ]),
      constructStore(
        createPositionStateClaim({
          id: positionId,
          body: {
            ...positionState,
            paymentStatus: PAYMENT_STATUS.PAID,
            activityStatus: ACTIVITY_STATUS.COMPLETED,
            funds: toHex(0),
          },
        }),
      ),
      constructStore(createClosedIndexClaim({ positionId })),
    ]),
  ];
};

const constructAcceptWithNewPosition = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt | null,
  positionState: PositionStateClaimBody,
  sendAmount: bigint,
  positionCwebAmount: bigint,
  cwebAccount: string,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
) => {
  if (getInstanceParameters().l1_type === L1Types.Btc) {
    throw new Error("Can't recreate position for BTC-like chain");
  }

  if (nonce === null) {
    throw new Error('Invalid input data');
  }

  const eventNonce = BigInt(nonce) + 1n;
  const eventClaimKey = createEvmEventClaimKey(positionId, eventNonce);

  const jumpContractFee = 2000n;
  const firstTransactionFee = 3000n + jumpContractFee;

  const secondTransactionFee = 2200n;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, firstTransactionFee),
        constructTake(createPositionFundsKey(positionId)),
        ...constructSendCweb(sendAmount, cwebAccount, null),
        constructStore(
          createPositionStateClaim({
            id: positionId,
            body: {
              ...positionState,
              funds: toHex(positionCwebAmount - sendAmount),
            },
          }),
        ),
        constructStore(
          createFundsClaim({
            ...fundsClaim.body,
            positionId,
            amount: positionCwebAmount - sendAmount,
          }),
        ),
      ],
      constructJumpCall(eventClaimKey, jumpContractFee),
    ),
    constructContinueTx(
      context,
      [],
      createCallWithL1EventBlock({
        methodName: PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
        issuer,
        providedCweb: availableCweb - firstTransactionFee - secondTransactionFee,
        authenticated,
        eventNonce,
        withExpiration: !!fundsClaim.body.owner,
        positionId,
        positionState,
        eventClaimKey,
      }),
    ),
  ];
};

const constructAcceptWithCwebReturn = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  sendAmount: bigint,
  positionCwebAmount: bigint,
  cwebAccount: string,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
) => {
  const transactionFee = 4000n;

  const fundsToReturn = availableCweb + positionCwebAmount - sendAmount - transactionFee;

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, transactionFee),
      constructTake(createPositionFundsKey(positionId)),
      ...constructSendCweb(sendAmount, cwebAccount, null),
      ...constructSendCweb(fundsToReturn, fundsClaim.body.owner!, null),
      ...constructConditional(positionState.activityStatus === ACTIVITY_STATUS.ACTIVE, [
        constructTake(createActivePositionIndexKey(positionState.createdAt, positionId)),
        constructTake(
          createBestByQuoteActiveIndexKey(
            createBestByQuoteIndex(positionState.baseAmount, positionState.quoteAmount),
            positionId,
          ),
        ),
      ]),
      constructStore(
        createPositionStateClaim({
          id: positionId,
          body: {
            ...positionState,
            paymentStatus: PAYMENT_STATUS.PAID,
            activityStatus: ACTIVITY_STATUS.COMPLETED,
            funds: toHex(0),
          },
        }),
      ),
      constructStore(createClosedIndexClaim({ positionId })),
    ]),
  ];
};

export const handleAccept = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt | null,
  positionState: PositionStateClaimBody,
  positionStoredAmount: HexBigInt,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
  paidAmount: HexBigInt,
  cwebAccount: string,
  recipient: HexBigInt,
) => {
  const positionCwebAmount = BigInt(positionStoredAmount);
  const baseAmount = BigInt(positionState.baseAmount);
  const quoteAmount = BigInt(positionState.quoteAmount);

  let dueCwebAmount = quoteAmount === 0n ? positionCwebAmount : (baseAmount * BigInt(paidAmount)) / quoteAmount;

  if (dueCwebAmount > positionCwebAmount) {
    dueCwebAmount = positionCwebAmount;
  }

  const isEvmL1Type = getInstanceParameters().l1_type === L1Types.Evm;

  if (dueCwebAmount === 0n || positionState.recipient.toLowerCase() !== recipient.toLowerCase()) {
    if (isEvmL1Type) {
      if (nonce === null) {
        throw new Error('Internal error');
      }

      const eventNonce = BigInt(nonce) + 1n;

      const transactionFee = 1100n;

      return [
        constructContinueTx(
          context,
          [],
          createCallWithL1EventBlock({
            methodName: PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
            issuer,
            providedCweb: availableCweb - transactionFee,
            authenticated,
            eventNonce,
            withExpiration: !!fundsClaim.body.owner,
            positionId,
            positionState,
            eventClaimKey: createEvmEventClaimKey(positionId, eventNonce),
          }),
        ),
      ];
    }

    const transactionFee = 900n;

    return [
      //TODO: Clarify what exactly we need to do with wrong btc payment
      constructContinueTx(
        context,
        [],
        [
          {
            callInfo: {
              ref: constructContractRef(issuer, []),
              methodInfo: {
                methodName: PRIVATE_METHODS.CLOSE_POSITION,
                methodArgs: [positionId, positionState],
              },
              contractInfo: {
                providedCweb: availableCweb - transactionFee,
                authenticated,
              },
              contractArgs: [constructRead(issuer, createPositionFundsKey(positionId))],
            },
          },
        ],
      ),
    ];
  }

  const isParticular = dueCwebAmount < positionCwebAmount;

  if (isParticular) {
    if (isEvmL1Type) {
      return constructAcceptWithNewPosition(
        context,
        issuer,
        positionId,
        nonce,
        positionState,
        dueCwebAmount,
        positionCwebAmount,
        cwebAccount,
        fundsClaim,
        availableCweb,
        authenticated,
      );
    } else {
      return constructAcceptWithCwebReturn(
        context,
        issuer,
        positionId,
        positionState,
        dueCwebAmount,
        positionCwebAmount,
        cwebAccount,
        fundsClaim,
        availableCweb,
      );
    }
  }

  return constructTotalAccept(context, issuer, positionId, positionState, positionCwebAmount, cwebAccount);
};
