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
  createPendingOrderByOwnerIndexKey,
  createRequestByMarketMakerIndexKey,
  createRequestByOrderIndexKey,
  createRequestFundsKey,
  HexBigInt,
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
  REQUEST_EXECUTION_STATUS,
  RequestStateClaimBody,
} from '../../../../offchain/shared';
import {
  constructConditional,
  constructSendCweb,
  createClosedOrderIndexClaim,
  createOrderActiveIndexClaim,
  createOrderStateClaim,
  createMakerDepositClaim,
  createBestActiveOrderIndexClaim,
  createRequestStateClaim,
} from '../../../utils';

export const handleExecution = ({
  requestId,
  orderId,
  context,
  issuer,
  providedCweb,
  orderState,
  requestState,
  depositAmount,
  depositOwner,
}: {
  requestId: string;
  orderId: string;
  context: Context;
  issuer: ContractIssuer;
  providedCweb: bigint;
  orderState: OrderStateClaimBody;
  requestState: RequestStateClaimBody;
  depositAmount: HexBigInt;
  depositOwner: User;
}) => {
  const isOrderCompleted = !BigInt(orderState.collateral);

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, providedCweb),
      constructTake(createRequestFundsKey(requestId)),
      ...constructSendCweb(BigInt(requestState.baseAmount), orderState.baseRecipient, null),
      constructTake(createMakerDepositKey(depositOwner)),
      constructTake(createPendingOrderByOwnerIndexKey(orderState.owner, requestState.createdAt, orderId)),
      constructTake(createRequestByMarketMakerIndexKey(orderState.owner, requestState.createdAt, requestId)),
      constructTake(createRequestByOrderIndexKey(orderId, requestState.createdAt, requestId)),
      constructStore(
        createRequestStateClaim({
          id: orderId,
          body: {
            ...requestState,
            executionStatus: REQUEST_EXECUTION_STATUS.EXECUTED,
          },
        }),
      ),
      constructStore(
        createMakerDepositClaim({
          amount: BigInt(depositAmount) + BigInt(requestState.collateral),
          user: depositOwner,
        }),
      ),
      ...constructConditional(
        isOrderCompleted,
        [
          constructStore(createClosedOrderIndexClaim({ id: orderId })),
          constructStore(
            createOrderStateClaim({
              id: orderId,
              body: {
                ...orderState,
                activityStatus: ORDER_ACTIVITY_STATUS.COMPLETED,
              },
            }),
          ),
        ],
        [
          constructStore(
            createOrderStateClaim({
              id: orderId,
              body: {
                ...orderState,
                activityStatus: ORDER_ACTIVITY_STATUS.ACTIVE,
              },
            }),
          ),
          constructStore(createOrderActiveIndexClaim({ timestamp: orderState.createdAt, id: orderId })),
          constructStore(
            createBestActiveOrderIndexClaim({
              id: orderId,
              baseAmount: orderState.baseAmount,
              quoteAmount: orderState.l1Amount,
            }),
          ),
        ],
      ),
    ]),
  ];
};
