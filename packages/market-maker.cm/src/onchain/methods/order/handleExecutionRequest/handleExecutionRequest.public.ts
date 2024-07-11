import { constructContinueTx, constructRead, Context } from '@coinweb/contract-kit';

import { HandleExecutionRequestArguments, FEE, createOrderStateKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments } from '../../../utils';

import { PrepareRequestPrivateArguments } from './types';

export const handleExecutionRequestPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [baseAmount, quoteWallet, orderId, fallbackContractId, fallbackMethodName] =
    getMethodArguments<HandleExecutionRequestArguments>(context);

  if (availableCweb < BigInt(baseAmount) + FEE.HANDLE_EXECUTION_REQUEST) {
    throw new Error('Insufficient cweb provided'); //TODO! Return a rest of cweb;
  }

  const issuer = getContractIssuer(context);

  const transactionFee = 2000n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST,
              methodArgs: [
                baseAmount,
                quoteWallet,
                orderId,
                fallbackContractId,
                fallbackMethodName,
              ] satisfies PrepareRequestPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [constructRead(issuer, createOrderStateKey(orderId))],
          },
        },
      ],
    ),
  ];
};
