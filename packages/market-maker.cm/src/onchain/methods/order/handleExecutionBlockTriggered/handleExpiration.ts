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
  PUBLIC_METHODS,
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
  getContractRef,
} from '../../../utils';
import { HandleExecutionRequestArguments } from '../handleExecutionRequest/types';

//TODO! Add automatic request
export const handleExpiration = ({
  context,
  quoteWallet,
  providedCweb,
  authInfo,
  requestId,
  orderId,
  requestFunds,
  order,
  request,
}: {
  context: Context;
  quoteWallet: string;
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
        passCwebFrom(getContractIssuer(context), transactionFee),
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
        ...constructConditional(
          isOrderCompleted,
          [
            constructStore(createClosedOrderIndexClaim({ id: orderId })),
            constructStore(
              createOrderStateClaim({
                id: orderId,
                body: {
                  ...order,
                  activityStatus: ORDER_ACTIVITY_STATUS.EXPIRED,
                },
              }),
            ),
          ],
          [
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
          ],
        ),
      ],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PUBLIC_METHODS.REQUEST_EXECUTION,
              methodArgs: [
                request.quoteAmount,
                quoteWallet,
                request.fallbackContractId,
                request.fallbackMethodName,
              ] satisfies HandleExecutionRequestArguments,
            },
            contractInfo: {
              providedCweb: availableCweb,
              authenticated: authInfo,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
};
