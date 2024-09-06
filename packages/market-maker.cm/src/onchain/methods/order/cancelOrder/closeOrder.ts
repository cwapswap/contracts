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
  OrderStateClaimBody,
  MakerDepositClaimBody,
  createOrderCollateralKey,
  createMakerDepositKey,
  toHex,
  createActiveOrderIndexKey,
  createBestActiveOrderIndexKey,
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
  createRateIndex,
  getUser,
} from '../../../utils';
import { isEqualUser } from '../../../utils/user';

import { CloseOrderPrivateArguments } from './types';

export const closeOrder = selfCallWrapper((context: Context) => {
  const { availableCweb } = getCallParameters(context);
  const signer = getUser(context);

  const [id, statusReason] = getMethodArguments<CloseOrderPrivateArguments>(context);

  const stateClaim = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(0);

  const orderState = stateClaim?.body;

  if (!orderState) {
    throw new Error('Order is not exist');
  }

  if (!isEqualUser(orderState.owner, signer)) {
    throw new Error('Operation is not permitted');
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
      constructTake(createActiveOrderIndexKey(orderState.createdAt, id)),
      constructTake(createBestActiveOrderIndexKey(createRateIndex(orderState.baseAmount, orderState.l1Amount), id)),
      constructTake(createOrderCollateralKey(id)),
      constructTake(createMakerDepositKey(deposit.owner)),
      constructStore(
        createOrderStateClaim({
          id,
          body: {
            ...stateClaim.body,
            activityStatus: statusReason,
            collateral: toHex(0),
            covering: toHex(0),
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
