import {
  AuthInfo,
  Context,
  ContractIssuer,
  constructContinueTx,
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
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  constructSendCweb,
  createCallWithL1EventBlock,
  createClosedIndexClaim,
  createFundsClaim,
  createPositionStateClaim,
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
    ]),
  ];
};

const constructParticularAccept = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  nonce: HexBigInt,
  positionState: PositionStateClaimBody,
  sendAmount: bigint,
  positionCwebAmount: bigint,
  cwebAccount: string,
  fundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
  authenticated: AuthInfo,
) => {
  const firstTransactionFee = 3000n;

  const secondTransactionFee = 2200n;

  return [
    constructContinueTx(context, [
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
    ]),
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

export const handleAccept = (
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
    return constructParticularAccept(
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
  }

  return constructTotalAccept(context, issuer, positionId, positionState, positionCwebAmount, cwebAccount);
};
