import { Context, selfCallWrapper } from '@coinweb/contract-kit';

import { REQUEST_EXECUTION_STATUS, OrderStateClaimBody, toHex } from '../../../../offchain/shared';
import { CONSTANTS } from '../../../constants';
import { TypedClaim } from '../../../types';
import {
  getCallParameters,
  getContractIssuer,
  getMethodArguments,
  getReadClaimByIndex,
  hashObject,
} from '../../../utils';

import { PreparedRequest, PrepareRequestPrivateArguments } from './types';
import { constructPrivateRequestCall } from './utils/constructPrivateRequestCall';

export const prepareRequest = selfCallWrapper((context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [baseAmount, quoteWallet, orderId, fallbackContractId, fallbackMethodName] =
    getMethodArguments<PrepareRequestPrivateArguments>(context);

  const orderClaim = getReadClaimByIndex<TypedClaim<OrderStateClaimBody>>(context)(0);

  if (!orderClaim) {
    //TODO! Execute fallback
    throw new Error(`Order with id=${orderId} not found`);
  }

  const order = orderClaim.body;

  const createdAt = Date.now();

  const quoteAmount = toHex((BigInt(baseAmount) * BigInt(order.quoteAmount)) / BigInt(order.baseAmount));

  const initialState = {
    baseAmount,
    createdAt,
    expirationDate: createdAt + CONSTANTS.REQUEST_LIFE_TIME,
    quoteWallet,
    requestedOrderId: orderId,
    executionStatus: REQUEST_EXECUTION_STATUS.PENDING,
    quoteAmount,
    fallbackContractId,
    fallbackMethodName,
  } satisfies PreparedRequest;

  const id = hashObject(initialState);

  const issuer = getContractIssuer(context);

  return [constructPrivateRequestCall(context, issuer, id, initialState, availableCweb, authInfo)];
});
