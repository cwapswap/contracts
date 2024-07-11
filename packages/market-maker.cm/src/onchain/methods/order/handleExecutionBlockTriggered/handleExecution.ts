import {
  constructContinueTx,
  constructStore,
  constructTake,
  Context,
  ContractIssuer,
  passCwebFrom,
  User,
} from '@coinweb/contract-kit';

import {
  createMakerDepositKey,
  createRequestFundsKey,
  HexBigInt,
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
} from '../../../../offchain/shared';
import {
  constructConditional,
  constructSendCweb,
  createClosedOrderIndexClaim,
  createOrderActiveIndexClaim,
  createOrderStateClaim,
  createMakerDepositClaim,
} from '../../../utils';

export const handleExecution = ({
  requestId,
  orderId,
  context,
  issuer,
  providedCweb,
  sendAmount,
  orderState,
  collateral,
  depositAmount,
  depositOwner,
}: {
  requestId: string;
  orderId: string;
  context: Context;
  issuer: ContractIssuer;
  providedCweb: bigint;
  sendAmount: HexBigInt;
  orderState: OrderStateClaimBody;
  collateral: HexBigInt;
  depositAmount: HexBigInt;
  depositOwner: User;
}) => {
  const isOrderCompleted = !BigInt(orderState.collateral);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, providedCweb),
      constructTake(createRequestFundsKey(requestId)),
      ...constructSendCweb(BigInt(sendAmount), orderState.baseWallet, null),
      constructTake(createMakerDepositKey(depositOwner)),
      constructStore(
        createMakerDepositClaim({ amount: BigInt(depositAmount) + BigInt(collateral), user: depositOwner }),
      ),
      constructStore(
        createOrderStateClaim({
          id: orderId,
          body: {
            ...orderState,
            activityStatus: isOrderCompleted ? ORDER_ACTIVITY_STATUS.COMPLETED : ORDER_ACTIVITY_STATUS.ACTIVE,
          },
        }),
      ),
      ...constructConditional(
        isOrderCompleted,
        constructStore(createClosedOrderIndexClaim({ id: orderId })),
        constructStore(createOrderActiveIndexClaim({ timestamp: orderState.createdAt, id: orderId })),
      ),
    ]),
  ];
};
