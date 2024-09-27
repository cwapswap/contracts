import {
  Context,
  addContinuation,
  constructContractIssuer,
  constructContractRef,
  constructRead,
  extractContractInfo,
  getContractId,
  getMethodArguments,
} from '@coinweb/contract-kit';

import { createOwnerKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';

export const changeOwnerPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, newOwner] = getMethodArguments(context) as [unknown, string];

  const issuer = constructContractIssuer(getContractId(tx));

  const transactionFee = 900n;
  const callInfo = {
    ref: constructContractRef(issuer, []),
    methodInfo: {
      methodName: PRIVATE_METHODS.CHANGE_CONTRACT_OWNER,
      methodArgs: [newOwner],
    },
    contractInfo: {
      providedCweb: availableCweb - transactionFee,
      authenticated: auth,
    },
    contractArgs: [constructRead(issuer, createOwnerKey())],
  };

  addContinuation(context, {
    onSuccess: callInfo,
  });

  return [];
};
