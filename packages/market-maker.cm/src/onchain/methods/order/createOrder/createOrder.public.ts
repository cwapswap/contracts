import { Context } from '@coinweb/contract-kit';

import { CreateOrderArguments, FEE, ORDER_ACTIVITY_STATUS, OrderStateClaimBody } from '../../../../offchain/shared';
import { CONSTANTS } from '../../../constants';
import { getCallParameters, getContractIssuer, getMethodArguments, getUser, hashObject } from '../../../utils';

import { constructPrivateOrderCall } from './utils';

export const createOrderPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [baseAmount, l1Amount, baseWallet] = getMethodArguments<CreateOrderArguments>(context);

  if (availableCweb < BigInt(baseAmount) + FEE.CREATE_ORDER) {
    throw new Error('Insufficient cweb provided'); //TODO! Return a rest of cweb;
  }

  const createdAt = Date.now();

  const initialState = {
    activityStatus: ORDER_ACTIVITY_STATUS.ACTIVE,
    baseAmount,
    quoteAmount: l1Amount,
    createdAt,
    expirationDate: createdAt + CONSTANTS.ORDER_LIFE_TIME,
    collateral: l1Amount,
    baseWallet,
    owner: getUser(context),
  } satisfies OrderStateClaimBody;

  const orderId = hashObject(initialState);

  const issuer = getContractIssuer(context);

  return [constructPrivateOrderCall(context, issuer, orderId, initialState, availableCweb, authInfo)];
};
