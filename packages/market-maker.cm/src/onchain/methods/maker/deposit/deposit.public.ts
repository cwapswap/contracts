import { Context, constructContinueTx, constructRead } from '@coinweb/contract-kit';

import { DepositArguments, FEE, createMakerDepositKey } from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments, getUser } from '../../../utils';

import { DepositPrivateArguments } from './types';

export const depositPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [depositAmount] = getMethodArguments<DepositArguments>(context);

  const amount = BigInt(depositAmount);

  const callFee = FEE.DEPOSIT;

  if (amount + callFee > availableCweb) {
    throw new Error('Insufficient cweb provided'); //TODO! Return a rest of cweb;
  }

  const issuer = getContractIssuer(context);

  const transactionFee = 900n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.DEPOSIT,
              methodArgs: [depositAmount] satisfies DepositPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [constructRead(issuer, createMakerDepositKey(getUser(context)))],
          },
        },
      ],
    ),
  ];
};
