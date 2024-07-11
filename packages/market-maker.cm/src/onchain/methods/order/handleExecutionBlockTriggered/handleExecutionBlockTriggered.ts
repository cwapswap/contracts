import { Context, selfCallWrapper } from '@coinweb/contract-kit';

import { OrderStateClaimBody, MakerDepositClaimBody, RequestStateClaimBody } from '../../../../offchain/shared';
import { L1EventClaimBody, TypedClaim } from '../../../types';
import {
  getCallParameters,
  getContractIssuer,
  getMethodArguments,
  getReadClaimByIndex,
  parseL1EventData,
  unwrapEventClaim,
} from '../../../utils';
import { constructCallWithL1Block } from '../handleExecutionRequest/utils';

import { handleExecution } from './handleExecution';
import { handleExpiration } from './handleExpiration';
import { HandleExecutionBlockTriggeredArguments } from './types';

export const handleExecutionBlockTriggered = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestId, orderId, nonce] = getMethodArguments<HandleExecutionBlockTriggeredArguments>(context);

  const issuer = getContractIssuer(context);

  const requestClaim = getReadClaimByIndex<TypedClaim<RequestStateClaimBody>>(context)(2);
  const orderClaim = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(3);
  const depositClaim = getReadClaimByIndex<TypedClaim<MakerDepositClaimBody>>(context)(4);
  const requestFundsClaim = getReadClaimByIndex(context)(5);

  if (!requestClaim || !orderClaim || !depositClaim || !requestFundsClaim) {
    throw new Error('An error has occurred');
  }

  const request = requestClaim.body;
  const order = orderClaim.body;
  const deposit = depositClaim.body;
  const depositAmount = depositClaim.fees_stored;

  const eventClaim = unwrapEventClaim<TypedClaim<L1EventClaimBody>>(getReadClaimByIndex(context)(0));

  if (eventClaim) {
    const { paidAmount, recipient } = parseL1EventData(eventClaim.body.data);

    if (
      request.quoteWallet.toLowerCase() !== recipient.toLowerCase() ||
      BigInt(paidAmount) < BigInt(request.quoteAmount)
    ) {
      //TODO! Add partially accept
      return [
        constructCallWithL1Block({
          requestId,
          orderId,
          providedCweb: availableCweb,
          authInfo,
          context,
          issuer,
          nonce: BigInt(nonce) + 1n,
          expirationDate: request.expirationDate,
          owner: order.owner,
        }),
      ];
    }

    return handleExecution({
      context,
      issuer,
      orderId,
      orderState: order,
      providedCweb: availableCweb,
      requestId,
      sendAmount: request.baseAmount,
      collateral: request.collateral,
      depositAmount,
      depositOwner: deposit.owner,
    });
  }

  const expirationClaim = getReadClaimByIndex<TypedClaim<RequestStateClaimBody>>(context)(1);

  if (expirationClaim) {
    return handleExpiration({
      authInfo,
      context,
      contractId: request.fallbackContractId,
      methodName: request.fallbackMethodName,
      providedCweb: availableCweb,
      quoteWallet: request.quoteWallet,
      requestId,
      orderId,
      collateral: request.collateral,
      quoteAmount: request.quoteAmount,
      requestFunds: requestFundsClaim.fees_stored,
      order,
    });
  }

  throw new Error(`An error has occurred while trying to process the request ${requestId}`);
});
