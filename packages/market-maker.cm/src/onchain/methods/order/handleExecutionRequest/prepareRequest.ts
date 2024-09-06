import {
  constructContinueTx,
  constructContractRef,
  constructRead,
  constructStore,
  constructTake,
  Context,
  extractContractArgs,
  extractRead,
  passCwebFrom,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import {
  createActiveOrderIndexKey,
  createBestActiveOrderIndexKey,
  createOrderCollateralKey,
  createOrderStateKey,
  ORDER_ACTIVITY_STATUS,
  OrderStateClaimBody,
  RequestStateClaimBody,
  toHex,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  createOrderStateClaim,
  createPendingOrderByOwnerIndexClaim,
  createRateIndex,
  getCallParameters,
  getContractIssuer,
  getContractRef,
  getMethodArguments,
  getReadClaimByIndex,
  hashObject,
} from '../../../utils';
import { ExecutionFallbackArguments } from '../executionFallback/types';

import { CreateRequestPrivateArguments, PrepareRequestPrivateArguments } from './types';
import { constructPrepareRequest } from './utils';

export const prepareRequest = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestId, initialRequestData, requestedQuoteAmount] =
    getMethodArguments<PrepareRequestPrivateArguments>(context);
  const existingClaim = getReadClaimByIndex<TypedClaim<RequestStateClaimBody>>(context)(2);

  if (existingClaim) {
    const newId = hashObject(initialRequestData, requestId);

    return constructPrepareRequest({
      context,
      authInfo,
      availableCweb,
      id: newId,
      initialRequestData,
      quoteAmount: requestedQuoteAmount,
    });
  }

  const orderClaims = extractRead(extractContractArgs(context.tx)[1])?.map(
    ({ content }) => content as TypedClaim<OrderStateClaimBody, ReturnType<typeof createOrderStateKey>>,
  );

  const orderClaimFilter =
    orderClaims?.filter(
      (orderClaim) =>
        orderClaim.body.activityStatus === ORDER_ACTIVITY_STATUS.ACTIVE &&
        BigInt(orderClaim.body.covering) >= BigInt(initialRequestData.baseAmount),
    ) ?? [];

  const orderClaim =
    orderClaimFilter.length > 0
      ? orderClaimFilter.reduce((selectedOrderClaim, candidateOrderClaim) => {
          const selectedRange = createRateIndex(selectedOrderClaim.body.baseAmount, selectedOrderClaim.body.l1Amount);
          const candidateRange = createRateIndex(
            candidateOrderClaim.body.baseAmount,
            candidateOrderClaim.body.l1Amount,
          );

          if (selectedRange < candidateRange) {
            return candidateOrderClaim;
          } else {
            return selectedOrderClaim;
          }
        })
      : undefined;

  const quoteAmount = orderClaim
    ? (BigInt(initialRequestData.baseAmount) * BigInt(orderClaim?.body.l1Amount)) / BigInt(orderClaim?.body.baseAmount)
    : null;

  if (!orderClaim || !quoteAmount) {
    const transactionFee = 900n;

    return [
      constructContinueTx(
        context,
        [],
        [
          {
            callInfo: {
              ref: getContractRef(context),
              methodInfo: {
                methodName: PRIVATE_METHODS.EXECUTION_FALLBACK,
                methodArgs: [
                  initialRequestData.fallbackContractId,
                  initialRequestData.fallbackMethodName,
                  requestedQuoteAmount,
                  initialRequestData.quoteWallet,
                ] satisfies ExecutionFallbackArguments,
              },
              contractInfo: {
                providedCweb: availableCweb - transactionFee,
                authenticated: authInfo,
              },
              contractArgs: [],
            },
          },
        ],
      ),
    ];
  }

  const orderState = { ...orderClaim.body, activityStatus: ORDER_ACTIVITY_STATUS.PENDING };
  const [orderId] = orderClaim.key.second_part;

  const issuer = getContractIssuer(context);

  const transactionFee = 1300n;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, availableCweb),
        constructTake(createActiveOrderIndexKey(orderState.createdAt, orderId)),
        constructTake(
          createBestActiveOrderIndexKey(createRateIndex(orderState.baseAmount, orderState.l1Amount), orderId),
        ),
        constructStore(
          createOrderStateClaim({
            id: orderId,
            body: orderState,
          }),
        ),
        constructStore(
          createPendingOrderByOwnerIndexClaim({
            user: orderState.owner,
            id: orderId,
            timestamp: initialRequestData.createdAt,
          }),
        ),
      ],
      [
        {
          callInfo: {
            ref: constructContractRef(issuer, []),
            methodInfo: {
              methodName: PRIVATE_METHODS.CREATE_EXECUTION_REQUEST,
              methodArgs: [
                requestId,
                initialRequestData,
                toHex(quoteAmount),
                orderId,
                orderState,
              ] satisfies CreateRequestPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [constructRead(issuer, createOrderCollateralKey(orderId))],
          },
        },
      ],
    ),
  ];
});
