import {
  AuthInfo,
  constructContinueTx,
  constructRead,
  constructStore,
  constructTake,
  Context,
  passCwebFrom,
} from '@coinweb/contract-kit';

import {
  createOrderCollateralKey,
  createRequestFundsKey,
  HexBigInt,
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import {
  constructConditional,
  createClosedOrderIndexClaim,
  createOrderActiveIndexClaim,
  createOrderStateClaim,
  getContractIssuer,
  getContractRef,
} from '../../../utils';
import { ExecutionFallbackArguments } from '../executionFallback/types';

//TODO! Add automatic request
export const handleExpiration = ({
  context,
  contractId,
  methodName,
  quoteWallet,
  providedCweb,
  authInfo,
  requestId,
  orderId,
  requestFunds,
  collateral,
  quoteAmount,
  order,
}: {
  context: Context;
  contractId: string;
  methodName: string;
  quoteWallet: string;
  providedCweb: bigint;
  authInfo: AuthInfo;
  requestId: string;
  orderId: string;
  requestFunds: HexBigInt;
  collateral: HexBigInt;
  quoteAmount: HexBigInt;
  order: OrderStateClaimBody;
}) => {
  const transactionFee = 1000n;
  const availableCweb = BigInt(requestFunds) + BigInt(collateral) - transactionFee + providedCweb;

  const isOrderCompleted = !BigInt(order.collateral);

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(getContractIssuer(context), transactionFee),
        constructTake(createRequestFundsKey(requestId)),
        constructTake(createOrderCollateralKey(orderId)),
        constructStore(
          createOrderStateClaim({
            id: orderId,
            body: {
              ...order,
              activityStatus: isOrderCompleted ? ORDER_ACTIVITY_STATUS.EXPIRED : ORDER_ACTIVITY_STATUS.ACTIVE,
            },
          }),
        ),
        ...constructConditional(
          isOrderCompleted,
          constructStore(createClosedOrderIndexClaim({ id: orderId })),
          constructStore(createOrderActiveIndexClaim({ timestamp: order.createdAt, id: orderId })),
        ),
      ],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.EXECUTION_FALLBACK,
              methodArgs: [contractId, methodName, quoteAmount, quoteWallet] satisfies ExecutionFallbackArguments,
            },
            contractInfo: {
              providedCweb: availableCweb,
              authenticated: authInfo,
            },
            contractArgs: [constructRead(getContractIssuer(context), createRequestFundsKey(requestId))],
          },
        },
      ],
    ),
  ];
};
