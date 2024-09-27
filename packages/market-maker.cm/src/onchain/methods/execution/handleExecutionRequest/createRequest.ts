import { Context, constructContinueTx, constructStore, constructTake, passCwebFrom } from '@coinweb/contract-kit';

import { CollateralClaimBody, createOrderCollateralKey, toHex } from '../../../../offchain/shared';
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
  constructJumpCall,
} from '../../../utils';

import { CreateRequestPrivateArguments } from './types';
import { constructCallWithL1Block } from './utils';

export const createRequest = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestId, preparedRequest, promisedQuoteAmount, orderId, orderState] =
    getMethodArguments<CreateRequestPrivateArguments>(context);

  const collateralClaim = getReadClaimByIndex<TypedClaim<CollateralClaimBody>>(context)(0);

  if (!collateralClaim) {
    throw new Error('An error has occurred');
  }

  const issuer = getContractIssuer(context);

  const requestFunds = BigInt(preparedRequest.baseAmount);

  const collateralPercentage = getInstanceParameters().collateral_percentage_Int;

  const collateralAmount = BigInt(collateralClaim?.fees_stored || 0);

  const requestedCollateral = (requestFunds * BigInt(collateralPercentage)) / 100n;
  const restCollateralAmount = collateralAmount - requestedCollateral;
  const restCoveringAmount = BigInt(orderState.covering) - requestFunds;

  const jumpContractFee = 2000n;
  const firstTransactionFee = 2000n + requestFunds + jumpContractFee;

  return [
    constructContinueTx(
      context,
      [
        passCwebFrom(issuer, firstTransactionFee),
        constructTake(createOrderCollateralKey(orderId)),
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
              collateral: toHex(restCollateralAmount),
              covering: toHex(restCoveringAmount),
            },
          }),
        ),
        constructStore(
          createRequestStateClaim({
            id: requestId,
            body: {
              ...preparedRequest,
              collateral: toHex(requestedCollateral),
              requestedOrderId: orderId,
              promisedQuoteAmount,
            },
          }),
        ),
        constructStore(
          createRequestFundsClaim({
            id: requestId,
            amount: requestFunds + requestedCollateral,
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
      ],
      constructJumpCall(0n, requestId, jumpContractFee),
    ),
    constructCallWithL1Block({
      context,
      providedCweb: availableCweb - firstTransactionFee,
      authInfo,
      requestId,
      orderId,
      issuer,
      nonce: 0n,
      expirationDate: preparedRequest.expirationDate,
      owner: orderState.owner,
    }),
  ];
};
