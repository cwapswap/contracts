import { Context, constructContinueTx, constructRead } from '@coinweb/contract-kit';

import { FEE, ORDER_ACTIVITY_STATUS, createOrderStateKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments } from '../../../utils';

import { DeactivateOrderPrivateArguments } from './types';

export const cancelOrderPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [id] = getMethodArguments<[string]>(context);

  const callFee = FEE.CANCEL_ORDER;

  if (callFee > BigInt(availableCweb)) {
    throw new Error('Insufficient fee provided'); //TODO! Return a rest of cweb to caller;
  }

  const issuer = getContractIssuer(context);

  const transactionFee = 1000n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.DEACTIVATE_ORDER,
              methodArgs: [id, ORDER_ACTIVITY_STATUS.CANCELLED] satisfies DeactivateOrderPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [constructRead(issuer, createOrderStateKey(id))],
          },
        },
      ],
    ),
  ];
};
