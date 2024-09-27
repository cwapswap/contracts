import { addContinuation, Context } from '@coinweb/contract-kit';

import { getCallParameters, getMethodArguments } from '../../../utils';

import { HandleExecutionRequestArguments } from './types';
import { constructPrepareRequestCall } from './utils';

export const handleExecutionRequestPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [requestedQuoteAmount, quoteWallet, fallbackContractId, fallbackMethodName] =
    getMethodArguments<HandleExecutionRequestArguments>(context);

  addContinuation(context, {
    onSuccess: constructPrepareRequestCall({
      context,
      authInfo,
      availableCweb,
      requestedQuoteAmount,
      quoteWallet,
      fallbackContractId,
      fallbackMethodName,
    }),
  });

  return [];
};
