import {
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
import { TypedClaim } from '../../../types';
import { constructSendCweb, createClosedIndexClaim, createPositionStateClaim } from '../../../utils';

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

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createPositionFundsKey(positionId)),
      ...constructSendCweb(BigInt(positionStoredAmount), positionFunds.owner, null),
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
      constructStore(createClosedIndexClaim({ positionId })),
    ]),
  ];
};
