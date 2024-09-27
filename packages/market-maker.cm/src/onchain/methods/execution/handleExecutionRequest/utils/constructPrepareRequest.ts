import { addContinuation, AuthInfo, constructRangeRead, constructRead, Context } from '@coinweb/contract-kit';

import {
  createOrderStateFirstPart,
  createRequestStateKey,
  FEE,
  HexBigInt,
  REQUEST_EXECUTION_STATUS,
  toHex,
} from '../../../../../offchain/shared';
import { CONSTANTS, PRIVATE_METHODS } from '../../../../constants';
import { getContractIssuer, getContractRef, getTime, hashObject } from '../../../../utils';
import { InitialRequestData, PrepareRequestPrivateArguments } from '../types';

export const constructPrepareRequestCall = ({
  context,
  availableCweb,
  authInfo,
  requestedQuoteAmount,
  quoteWallet,
  fallbackContractId,
  fallbackMethodName,
  nonce,
}: {
  context: Context;
  availableCweb: bigint;
  authInfo: AuthInfo;
  requestedQuoteAmount: HexBigInt;
  quoteWallet: string;
  fallbackContractId: string;
  fallbackMethodName: string;
  nonce?: string;
}) => {
  const transactionFee = 2000n;

  const issuer = getContractIssuer(context);

  const createdAt = getTime();

  const initialRequestData = {
    baseAmount: toHex(availableCweb - FEE.HANDLE_EXECUTION_REQUEST),
    createdAt,
    expirationDate: createdAt + CONSTANTS.REQUEST_LIFE_TIME,
    quoteWallet,
    requestedQuoteAmount,
    executionStatus: REQUEST_EXECUTION_STATUS.PENDING,
    fallbackContractId,
    fallbackMethodName,
    txId: context.call.txid,
  } satisfies InitialRequestData;

  const id = hashObject(initialRequestData, nonce);

  const callInfo = {
    ref: getContractRef(context),
    methodInfo: {
      methodName: PRIVATE_METHODS.PREPARE_EXECUTION_REQUEST,
      methodArgs: [id, initialRequestData] satisfies PrepareRequestPrivateArguments,
    },
    contractInfo: {
      providedCweb: availableCweb - transactionFee,
      authenticated: authInfo,
    },
    contractArgs: [
      constructRead(issuer, createRequestStateKey(id)),
      constructRangeRead(issuer, createOrderStateFirstPart(), {}, 1000),
    ],
  };

  return callInfo;
};
