import { constructContinueTx, constructContractRef, Context, selfCallWrapper } from '@coinweb/contract-kit';

import { getCallParameters, getMethodArguments } from '../../../utils';

import { ExecutionFallbackArguments } from './types';

export const executionFallback = selfCallWrapper((context: Context) => {
  const { availableCweb } = getCallParameters(context);

  const [contractId, methodName, quoteAmount, quoteWallet] = getMethodArguments<ExecutionFallbackArguments>(context);

  const transactionFee = 1000n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: constructContractRef({ FromSmartContract: contractId }, []),
            methodInfo: {
              methodName,
              methodArgs: [quoteAmount, quoteWallet],
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: null,
            },
            contractArgs: [],
          },
        },
      ],
    ),
  ];
});
