import {
  Context,
  constructContinueTx,
  constructStore,
  constructTake,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  CollateralClaimBody,
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
  MakerDepositClaimBody,
  createOrderCollateralKey,
  createMakerDepositKey,
  toHex,
} from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import {
  createClosedOrderIndexClaim,
  createOrderStateClaim,
  createMakerDepositClaim,
  getCallParameters,
  getContractIssuer,
  getMethodArguments,
  getReadClaimByIndex,
} from '../../../utils';

import { CloseOrderPrivateArguments } from './types';

export const closeOrder = selfCallWrapper((context: Context) => {
  const { availableCweb } = getCallParameters(context);

  const [id, statusReason] = getMethodArguments<CloseOrderPrivateArguments>(context);

  const stateClaim = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(0);

  if (!stateClaim) {
    throw new Error('Order is not exist');
  }

  if (stateClaim.body.activityStatus !== ORDER_ACTIVITY_STATUS.CANCELLING) {
    throw new Error("Order can't be closed");
  }

  const collateralClaim = getReadClaimByIndex<TypedClaim<CollateralClaimBody>>(context)(1);

  if (!collateralClaim) {
    throw new Error('Order is not active');
  }

  const depositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(2);

  if (!depositClaim) {
    throw new Error('Market maker is not exist');
  }

  const deposit = depositClaim.body;
  const storedDeposit = depositClaim.fees_stored;
  const storedCollateral = collateralClaim.fees_stored;

  const issuer = getContractIssuer(context);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, availableCweb),
      constructTake(createOrderCollateralKey(id)),
      constructTake(createMakerDepositKey(deposit.owner)),
      constructStore(
        createOrderStateClaim({
          id,
          body: {
            ...stateClaim.body,
            activityStatus: statusReason,
            collateral: toHex(0),
          },
        }),
      ),
      constructStore(
        createMakerDepositClaim({
          amount: BigInt(storedDeposit) + BigInt(storedCollateral),
          user: deposit.owner,
        }),
      ),
      constructStore(createClosedOrderIndexClaim({ id })),
    ]),
  ];
});
