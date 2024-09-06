import { Context } from '@coinweb/contract-kit';

import { FEE, REQUEST_EXECUTION_STATUS, toHex } from '../../../../offchain/shared';
import { CONSTANTS } from '../../../constants';
import { getCallParameters, getMethodArguments, getTime, hashObject } from '../../../utils';

import { HandleExecutionRequestArguments, InitialRequestData } from './types';
import { constructPrepareRequest } from './utils';

export const handleExecutionRequestPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [quoteAmount, quoteWallet, fallbackContractId, fallbackMethodName] =
    getMethodArguments<HandleExecutionRequestArguments>(context);

  const createdAt = getTime();

  const baseAmount = availableCweb - FEE.HANDLE_EXECUTION_REQUEST;

  const initialRequestData = {
    baseAmount: toHex(baseAmount),
    createdAt,
    expirationDate: createdAt + CONSTANTS.REQUEST_LIFE_TIME,
    quoteWallet,
    executionStatus: REQUEST_EXECUTION_STATUS.PENDING,
    fallbackContractId,
    fallbackMethodName,
    txId: context.call.txid,
  } satisfies InitialRequestData;

  const id = hashObject(initialRequestData);

  return constructPrepareRequest({
    context,
    authInfo,
    availableCweb,
    id,
    initialRequestData,
    quoteAmount,
  });
};
