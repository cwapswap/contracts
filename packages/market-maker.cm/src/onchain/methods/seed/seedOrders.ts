import { constructContinueTx, Context, passCwebFrom, selfCallWrapper } from '@coinweb/contract-kit';

import { CreateOrderArguments, PUBLIC_METHODS } from '../../../offchain/shared';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments } from '../../utils';

import { SeedOrdersPrivateArguments } from './types';

export const seedOrders = selfCallWrapper((context: Context) => {
  const { availableCweb, authInfo } = getCallParameters(context);

  const orders = getMethodArguments<SeedOrdersPrivateArguments>(context);

  const issuer = getContractIssuer(context);

  const seedTransactionFee = 50000n;

  return [
    constructContinueTx(
      context,
      [passCwebFrom(issuer, availableCweb)],
      orders.map((order) => ({
        callInfo: {
          ref: getContractRef(context),
          methodInfo: {
            methodName: PUBLIC_METHODS.CREATE_ORDER,
            methodArgs: order satisfies CreateOrderArguments,
          },
          contractInfo: {
            providedCweb: seedTransactionFee,
            authenticated: authInfo,
          },
          contractArgs: [],
        },
      })),
    ),
  ];
});
