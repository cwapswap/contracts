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
import { CallContractData, L1Types, TypedClaim } from '../../../types';
import {
  createCallWithL1EventBlock,
  createClosedIndexClaim,
  createFundsClaim,
  createPositionStateClaim,
  constructJumpCall,
  createBestByQuoteIndex,
  getInstanceParameters,
  createEvmEventClaimKey,
  constructConditional,
  constructSendCweb,
} from '../../../utils';

const constructTransfer = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  amount: bigint,
  callContractData: CallContractData,
) => {
  const { l2Contract, l2MethodName, l2Args } = callContractData;
  const transactionFee = 4000n;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, transactionFee),
        constructTake(createPositionFundsKey(positionId)),
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
      ],
      [
        {
          callInfo: {
            ref: constructContractRef({ FromSmartContract: l2Contract }, []),
            methodInfo: {
              methodName: l2MethodName,
              methodArgs: [...l2Args],
            },
            contractInfo: {
              providedCweb: amount,
              authenticated: null,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
};

const constructTransferWithNewPosition = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt | null,
  positionState: PositionStateClaimBody,
  spendAmount: bigint,
  positionCwebAmount: bigint,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
  callContractData: CallContractData,
) => {
  const { l2Contract, l2MethodName, l2Args } = callContractData;

  if (getInstanceParameters().l1_type === L1Types.Btc) {
    throw new Error("Can't recreate position for BTC-like chain");
  }

  if (nonce === null) {
    throw new Error('Invalid input data');
  }

  const eventNonce = BigInt(nonce) + 1n;
  const eventClaimKey = createEvmEventClaimKey(positionId, eventNonce);

  const jumpContractFee = 2000n;
  const firstTransactionFee = 4000n + jumpContractFee;

  const secondTransactionFee = 2200n;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, firstTransactionFee),
        constructTake(createPositionFundsKey(positionId)),
        constructStore(
          createPositionStateClaim({
            id: positionId,
            body: {
              ...positionState,
              funds: toHex(positionCwebAmount - spendAmount),
            },
          }),
        ),
        constructStore(
          createFundsClaim({
            ...fundsClaim.body,
            positionId,
            amount: positionCwebAmount - spendAmount,
          }),
        ),
      ],
      [
        ...constructJumpCall(eventClaimKey, jumpContractFee),
        {
          callInfo: {
            ref: constructContractRef({ FromSmartContract: l2Contract }, []),
            methodInfo: {
              methodName: l2MethodName,
              methodArgs: [...l2Args],
            },
            contractInfo: {
              providedCweb: spendAmount,
              authenticated: null,
            },
            contractArgs: [],
          },
        },
      ],
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

const constructTransferWithCwebReturn = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  spendAmount: bigint,
  positionCwebAmount: bigint,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  callContractData: CallContractData,
) => {
  const { l2Contract, l2MethodName, l2Args } = callContractData;

  const transactionFee = 4000n;

  const fundsToReturn = availableCweb + positionCwebAmount - spendAmount - transactionFee;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, availableCweb),
        constructTake(createPositionFundsKey(positionId)),
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
      ],
      [
        {
          callInfo: {
            ref: constructContractRef({ FromSmartContract: l2Contract }, []),
            methodInfo: {
              methodName: l2MethodName,
              methodArgs: [...l2Args],
            },
            contractInfo: {
              providedCweb: spendAmount,
              authenticated: null,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
};

export const handleTransfer = (
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
  recipient: HexBigInt,
  callContractData: CallContractData,
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
      return constructTransferWithNewPosition(
        context,
        issuer,
        positionId,
        nonce,
        positionState,
        dueCwebAmount,
        positionCwebAmount,
        fundsClaim,
        availableCweb,
        authenticated,
        callContractData,
      );
    } else {
      return constructTransferWithCwebReturn(
        context,
        issuer,
        positionId,
        positionState,
        dueCwebAmount,
        positionCwebAmount,
        fundsClaim,
        availableCweb,
        callContractData,
      );
    }
  }

  return constructTransfer(context, issuer, positionId, positionState, positionCwebAmount, callContractData);
};
