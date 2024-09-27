import { Context, addContinuation, constructRead } from '@coinweb/contract-kit';

import { WithdrawArguments, createMakerDepositKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments, getUser } from '../../../utils';

import { WithdrawPrivateArguments } from './types';

export const withdrawPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [withdrawAmount] = getMethodArguments<WithdrawArguments>(context);

  const transactionFee = 900n;
  const callInfo = {
    ref: getContractRef(context),
    methodInfo: {
      methodName: PRIVATE_METHODS.WITHDRAW,
      methodArgs: [withdrawAmount] satisfies WithdrawPrivateArguments,
    },
    contractInfo: {
      providedCweb: availableCweb - transactionFee,
      authenticated: authInfo,
    },
    contractArgs: [constructRead(getContractIssuer(context), createMakerDepositKey(getUser(context)))],
  };

  addContinuation(context, {
    onSuccess: callInfo,
  });

  return [];
};
