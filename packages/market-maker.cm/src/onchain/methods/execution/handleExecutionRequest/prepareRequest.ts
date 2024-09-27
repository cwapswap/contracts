import {
  addContinuation,
  constructContinueTx,
  constructContractIssuer,
  constructContractRef,
  constructRead,
  constructStore,
  constructTake,
  Context,
  extractContractArgs,
  extractRead,
  passCwebFrom,
  prepareQueueCall,
  queueCostFee,
} from '@coinweb/contract-kit';

import {
  createActiveOrderIndexKey,
  createBestActiveOrderIndexKey,
  createOrderCollateralKey,
  createOrderStateKey,
  HexBigInt,
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
  getMethodArguments,
  getReadClaimByIndex,
} from '../../../utils';

import { CreateRequestPrivateArguments, PrepareRequestPrivateArguments } from './types';
import { constructPrepareRequestCall } from './utils';

const calculateRate = (base: HexBigInt | bigint, quote: HexBigInt | bigint) => {
  return BigInt(Number(quote) * 1e18) / BigInt(base);
};

export const prepareRequest = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestId, initialRequestData] = getMethodArguments<PrepareRequestPrivateArguments>(context);
  const existingClaim = getReadClaimByIndex<TypedClaim<RequestStateClaimBody>>(context)(2);

  if (existingClaim) {
    addContinuation(context, {
      onSuccess: constructPrepareRequestCall({
        ...initialRequestData,
        context,
        authInfo,
        availableCweb,
        nonce: requestId,
      }),
    });

    return [];
  }

  const orderClaims = extractRead(extractContractArgs(context.tx)[1])?.map(
    ({ content }) => content as TypedClaim<OrderStateClaimBody, ReturnType<typeof createOrderStateKey>>,
  );

  const requestRate = calculateRate(initialRequestData.baseAmount, initialRequestData.requestedQuoteAmount);

  const orderClaimFilter =
    orderClaims?.filter(
      (orderClaim) =>
        orderClaim.body.activityStatus === ORDER_ACTIVITY_STATUS.ACTIVE &&
        BigInt(orderClaim.body.covering) >= BigInt(initialRequestData.baseAmount) &&
        calculateRate(orderClaim.body.baseAmount, orderClaim.body.l1Amount) >= requestRate,
    ) ?? [];

  const orderClaim =
    orderClaimFilter.length > 0
      ? orderClaimFilter.reduce((selectedOrderClaim, candidateOrderClaim) => {
          const selectedRate = calculateRate(selectedOrderClaim.body.baseAmount, selectedOrderClaim.body.l1Amount);
          const candidateRate = calculateRate(candidateOrderClaim.body.baseAmount, candidateOrderClaim.body.l1Amount);

          if (selectedRate < candidateRate) {
            return candidateOrderClaim;
          } else {
            return selectedOrderClaim;
          }
        })
      : undefined;

  const promisedQuoteAmount = orderClaim
    ? (BigInt(initialRequestData.baseAmount) * BigInt(orderClaim?.body.l1Amount)) / BigInt(orderClaim?.body.baseAmount)
    : null;

  if (!orderClaim || !promisedQuoteAmount) {
    const transactionFee = 900n + queueCostFee();

    return [
      constructContinueTx(
        context,
        [],
        [
          {
            callInfo: prepareQueueCall(constructContractIssuer(initialRequestData.fallbackContractId), {
              methodInfo: {
                methodName: initialRequestData.fallbackMethodName,
                methodArgs: [initialRequestData.requestedQuoteAmount, initialRequestData.quoteWallet],
              },
              contractInfo: {
                providedCweb: availableCweb - transactionFee,
                authenticated: null,
              },
              contractArgs: [],
            }),
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
                toHex(promisedQuoteAmount),
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
};
