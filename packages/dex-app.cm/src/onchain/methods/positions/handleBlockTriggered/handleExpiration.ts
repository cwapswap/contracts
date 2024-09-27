import {
  ClaimKey,
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
  createBestByQuoteActiveIndexKey,
  createBtcUtxoUniquenessKey,
  createPositionFundsKey,
  toHex,
} from '../../../../offchain/shared';
import { L1Types, TypedClaim } from '../../../types';
import {
  constructSendCweb,
  createClosedIndexClaim,
  createPositionStateClaim,
  createBestByQuoteIndex,
  getInstanceParameters,
  validateBtcChainData,
  constructNonNullable,
} from '../../../utils';

export const handleExpiration = (
  context: Context,
  issuer: ContractIssuer,
  positionId: string,
  positionState: PositionStateClaimBody,
  positionFundsClaim: TypedClaim<PositionFundsClaimBody>,
  availableCweb: bigint,
) => {
  const positionStoredAmount = positionFundsClaim.fees_stored as HexBigInt;
  const positionFunds = positionFundsClaim.body;

  const fundsOwner = positionFunds.owner;

  if (!fundsOwner) {
    throw new Error('Cannot return funds');
  }

  let uniquenessKey: null | ClaimKey;

  if (getInstanceParameters().l1_type === L1Types.Btc) {
    if (!validateBtcChainData(positionState.chainData)) {
      throw new Error('Invalid input data');
    }

    uniquenessKey = createBtcUtxoUniquenessKey(positionState.chainData);
  } else {
    uniquenessKey = null;
  }

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createPositionFundsKey(positionId)),
      ...constructNonNullable(uniquenessKey, (uniquenessKey) => [constructTake(uniquenessKey)]),
      ...constructSendCweb(BigInt(positionStoredAmount), fundsOwner, null),
      constructStore(
        createPositionStateClaim({
          id: positionId,
          body: {
            ...positionState,
            activityStatus: ACTIVITY_STATUS.EXPIRED,
            paymentStatus: PAYMENT_STATUS.NOT_PAYABLE,
            funds: toHex(0),
          },
        }),
      ),
      constructTake(createActivePositionIndexKey(positionState.createdAt, positionId)),
      constructTake(
        createBestByQuoteActiveIndexKey(
          createBestByQuoteIndex(positionState.baseAmount, positionState.quoteAmount),
          positionId,
        ),
      ),
      constructStore(createClosedIndexClaim({ positionId })),
    ]),
  ];
};
