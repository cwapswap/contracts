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

import { FEE, createPositionFundsKey, createPositionStateKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';

export const cancelPositionPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, positionId] = getMethodArguments(context) as [unknown, string, string];

  if (BigInt(availableCweb) < FEE.CANCEL_POSITION) {
    throw new Error('Insufficient fee provided'); //TODO! Return a rest of cweb to signer;
  }

  const issuer = constructContractIssuer(getContractId(tx));

  const transactionFee = 1000n;

  const callInfo = {
    ref: constructContractRef(issuer, []),
    methodInfo: {
      methodName: PRIVATE_METHODS.DEACTIVATE_POSITION,
      methodArgs: [positionId],
    },
    contractInfo: {
      providedCweb: availableCweb - transactionFee,
      authenticated: auth,
    },
    contractArgs: [
      constructRead(issuer, createPositionStateKey(positionId)),
      constructRead(issuer, createPositionFundsKey(positionId)),
    ],
  };

  addContinuation(context, {
    onSuccess: callInfo,
  });

  return [];
};
