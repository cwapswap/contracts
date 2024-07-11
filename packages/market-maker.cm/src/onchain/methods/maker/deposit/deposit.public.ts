import { Context, constructContinueTx, constructRead } from '@coinweb/contract-kit';

import {
  DepositArguments,
  FEE,
  createContractOwnerKey,
  createMakerDepositKey,
  toHex,
} from '../../../../offchain/shared';
import { PRIVATE_METHODS } from '../../../constants';
import {
  getCallParameters,
  getContractIssuer,
  getContractOwnerFee,
  getContractRef,
  getMethodArguments,
  getUser,
} from '../../../utils';

import { DepositPrivateArguments } from './types';

export const depositPublic = (context: Context) => {
  const { authInfo, availableCweb } = getCallParameters(context);

  const [depositAmount] = getMethodArguments<DepositArguments>(context);

  const amount = BigInt(depositAmount);

  const ownerFee = getContractOwnerFee(amount);
  const callFee = FEE.DEPOSIT;

  if (amount + callFee + ownerFee > availableCweb) {
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
              methodArgs: [depositAmount, toHex(ownerFee)] satisfies DepositPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [
              constructRead(issuer, createMakerDepositKey(getUser(context))),
              constructRead(issuer, createContractOwnerKey()),
            ],
          },
        },
      ],
    ),
  ];
};
