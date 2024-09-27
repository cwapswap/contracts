import {
  AuthInfo,
  constructContinueTx,
  constructStore,
  constructTake,
  Context,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
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
  createBestActiveOrderIndexClaim,
  createClosedOrderIndexClaim,
  createOrderActiveIndexClaim,
  createOrderStateClaim,
  createRequestStateClaim,
  getContractIssuer,
} from '../../../utils';
import { constructPrepareRequestCall } from '../handleExecutionRequest/utils';

export const handleExpiration = ({
  context,
  providedCweb,
  authInfo,
  requestId,
  orderId,
  requestFunds,
  order,
  request,
}: {
  context: Context;
  providedCweb: bigint;
  authInfo: AuthInfo;
  requestId: string;
  orderId: string;
  requestFunds: HexBigInt;
  order: OrderStateClaimBody;
  request: RequestStateClaimBody;
}) => {
  const transactionFee = 2000n;
  const availableCweb = BigInt(requestFunds) + providedCweb - transactionFee;

  const isOrderCompleted = !BigInt(order.collateral);

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(getContractIssuer(context), providedCweb),
        constructTake(createRequestFundsKey(requestId)),
        constructTake(createPendingOrderByOwnerIndexKey(order.owner, request.createdAt, orderId)),
        constructTake(createRequestByMarketMakerIndexKey(order.owner, request.createdAt, requestId)),
        constructTake(createRequestByOrderIndexKey(orderId, request.createdAt, requestId)),
        constructStore(
          createRequestStateClaim({
            id: orderId,
            body: {
              ...request,
              executionStatus: REQUEST_EXECUTION_STATUS.FAILED,
            },
          }),
        ),
        ...constructConditional(order.activityStatus === ORDER_ACTIVITY_STATUS.PENDING && isOrderCompleted, [
          constructStore(createClosedOrderIndexClaim({ id: orderId })),
          constructStore(
            createOrderStateClaim({
              id: orderId,
              body: {
                ...order,
                activityStatus: ORDER_ACTIVITY_STATUS.COMPLETED,
              },
            }),
          ),
        ]),
        ...constructConditional(order.activityStatus === ORDER_ACTIVITY_STATUS.PENDING && !isOrderCompleted, [
          constructStore(
            createOrderStateClaim({
              id: orderId,
              body: {
                ...order,
                activityStatus: ORDER_ACTIVITY_STATUS.ACTIVE,
              },
            }),
          ),
          constructStore(createOrderActiveIndexClaim({ timestamp: order.createdAt, id: orderId })),
          constructStore(
            createBestActiveOrderIndexClaim({
              id: orderId,
              baseAmount: order.baseAmount,
              quoteAmount: order.l1Amount,
            }),
          ),
        ]),
      ],
      [
        {
          callInfo: constructPrepareRequestCall({
            ...request,
            context,
            authInfo,
            availableCweb,
          }),
        },
      ],
    ),
  ];
};
