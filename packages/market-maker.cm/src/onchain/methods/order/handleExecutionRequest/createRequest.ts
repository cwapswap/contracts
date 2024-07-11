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
  RequestStateClaimBody,
  createActiveOrderIndexKey,
  createOrderCollateralKey,
  createOrderStateKey,
  toHex,
} from '../../../../offchain/shared';
import { TypedClaim } from '../../../types';
import {
  createOrderCollateralClaim,
  createOrderStateClaim,
  createRequestByOrderIndexClaim,
  createRequestByMarketMakerIndexClaim,
  createRequestFundsClaim,
  createRequestStateClaim,
  getCallParameters,
  getContractIssuer,
  getInstanceParameters,
  getMethodArguments,
  getReadClaimByIndex,
  hashObject,
} from '../../../utils';

import { CreateRequestPrivateArguments } from './types';
import { constructCallWithL1Block } from './utils';
import { constructPrivateRequestCall } from './utils/constructPrivateRequestCall';

export const createRequest = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestId, preparedRequest] = getMethodArguments<CreateRequestPrivateArguments>(context);

  const issuer = getContractIssuer(context);

  const existingRequest = getReadClaimByIndex<TypedClaim<RequestStateClaimBody>>(context)(0);

  if (existingRequest) {
    const newId = hashObject(preparedRequest, requestId);

    return [constructPrivateRequestCall(context, issuer, newId, preparedRequest, availableCweb, authInfo)];
  }

  const orderClaim =
    getReadClaimByIndex<TypedClaim<OrderStateClaimBody, ReturnType<typeof createOrderStateKey>>>(context)(1);

  if (!orderClaim) {
    throw new Error('Counterpart order not found');
  }

  const orderState = orderClaim.body;
  const [orderId] = orderClaim.key.second_part;

  const requestedAmount = BigInt(preparedRequest.baseAmount);

  const collateralPercentage = getInstanceParameters().collateral_percentage_Int;
  const collateralClaim = getReadClaimByIndex<TypedClaim<CollateralClaimBody>>(context)(2);
  const collateralAmount = BigInt(collateralClaim?.fees_stored || 0);

  const requestedCollateral = (requestedAmount * BigInt(collateralPercentage)) / 100n;
  const restCollateralAmount = collateralAmount - requestedCollateral;

  if (collateralAmount < requestedCollateral) {
    throw new Error('Not enough collateral to secure the bid');
  }

  const firstTransactionFee = 1200n + requestedAmount;

  return [
    constructContinueTx(context, [
      passCwebFrom(issuer, firstTransactionFee),
      constructTake(createOrderCollateralKey(orderId)),
      constructTake(createActiveOrderIndexKey(orderState.createdAt, orderId)),
      constructStore(
        createOrderCollateralClaim({
          id: orderId,
          amount: restCollateralAmount,
          owner: orderState.owner,
        }),
      ),
      constructStore(
        createOrderStateClaim({
          id: orderId,
          body: {
            ...orderState,
            activityStatus: ORDER_ACTIVITY_STATUS.PENDING,
            collateral: toHex(restCollateralAmount),
          },
        }),
      ),
      constructStore(
        createRequestStateClaim({
          id: requestId,
          body: { ...preparedRequest, collateral: toHex(requestedCollateral) },
        }),
      ),
      constructStore(
        createRequestFundsClaim({
          id: requestId,
          amount: requestedAmount + requestedCollateral,
        }),
      ),
      constructStore(
        createRequestByOrderIndexClaim({
          id: requestId,
          orderId,
          timestamp: preparedRequest.createdAt,
        }),
      ),
      constructStore(
        createRequestByMarketMakerIndexClaim({
          id: requestId,
          marketMaker: orderState.owner,
          timestamp: preparedRequest.createdAt,
        }),
      ),
    ]),
    constructCallWithL1Block({
      providedCweb: availableCweb - firstTransactionFee,
      authInfo,
      context,
      requestId,
      orderId,
      issuer,
      nonce: 0n,
      expirationDate: preparedRequest.expirationDate,
      owner: orderState.owner,
    }),
  ];
});
