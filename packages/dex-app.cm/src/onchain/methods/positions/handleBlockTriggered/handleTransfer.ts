import {
  AuthInfo,
  Context,
  ContractIssuer,
  constructContinueTx,
  constructContractRef,
  constructStore,
  constructTake,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
  ACTIVITY_STATUS,
  HexBigInt,
  PAYMENT_STATUS,
  PUBLIC_METHODS,
  PositionFundsClaimBody,
  PositionStateClaimBody,
  createActivePositionIndexKey,
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { CallContractData, TypedClaim } from '../../../types';
import {
  createCallWithL1EventBlock,
  createClosedIndexClaim,
  createFundsClaim,
  createPositionStateClaim,
} from '../../../utils';

const constructTotalTransfer = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  amount: bigint,
  cwebAddress: string,
  callContractData: CallContractData,
) => {
  const { callFee, contractOwnerFee, l1RecipientAddress, l2Contract, transferQuoteAmount } = callContractData;
  const transactionFee = 4000n;

  const transferAmount = amount - callFee - contractOwnerFee;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, transactionFee),
        constructTake(createPositionFundsKey(positionId)),
        constructTake(createActivePositionIndexKey(positionState.createdAt, positionId)),
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
              methodName: PUBLIC_METHODS.CREATE_POSITION,
              methodArgs: [
                toHex(transferAmount),
                transferQuoteAmount,
                l1RecipientAddress,
                toHex(contractOwnerFee),
                toHex(callFee),
                cwebAddress,
              ],
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

const constructParticularTransfer = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt,
  positionState: PositionStateClaimBody,
  spendAmount: bigint,
  positionCwebAmount: bigint,
  cwebAddress: string,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
  callContractData: CallContractData,
) => {
  const { callFee, contractOwnerFee, l1RecipientAddress, l2Contract, transferQuoteAmount } = callContractData;

  const firstTransactionFee = 4000n;

  const secondTransactionFee = 2200n;

  const transferAmount = spendAmount - callFee - contractOwnerFee;

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
        {
          callInfo: {
            ref: constructContractRef({ FromSmartContract: l2Contract }, []),
            methodInfo: {
              methodName: PUBLIC_METHODS.CREATE_POSITION,
              methodArgs: [
                toHex(transferAmount),
                transferQuoteAmount,
                l1RecipientAddress,
                toHex(contractOwnerFee),
                toHex(callFee),
                cwebAddress,
              ],
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
      createCallWithL1EventBlock(
        PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
        issuer,
        availableCweb - firstTransactionFee - secondTransactionFee,
        authenticated,
        BigInt(nonce) + 1n,
        positionId,
        positionState,
      ),
    ),
  ];
};

export const handleTransfer = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt,
  positionState: PositionStateClaimBody,
  positionStoredAmount: HexBigInt,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
  paidAmount: HexBigInt,
  cwebAccount: string,
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

  if (positionState.recipient.toLowerCase() !== recipient.toLowerCase() || dueCwebAmount === 0n) {
    const transactionFee = 1100n;

    return [
      constructContinueTx(
        context,
        [],
        createCallWithL1EventBlock(
          PRIVATE_METHODS.HANDLE_BLOCK_TRIGGERED,
          issuer,
          availableCweb - transactionFee,
          authenticated,
          BigInt(nonce) + 1n,
          positionId,
          positionState,
        ),
      ),
    ];
  }

  const isParticular = dueCwebAmount < positionCwebAmount;

  if (isParticular) {
    return constructParticularTransfer(
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
      callContractData,
    );
  }

  return constructTotalTransfer(
    context,
    issuer,
    positionId,
    positionState,
    positionCwebAmount,
    cwebAccount,
    callContractData,
  );
};
