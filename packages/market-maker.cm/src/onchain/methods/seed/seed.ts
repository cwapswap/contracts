import { constructContinueTx, constructRead, Context } from '@coinweb/contract-kit';

import { createContractOwnerKey, createMakerDepositKey } from '../../../offchain/shared';
import { PRIVATE_METHODS } from '../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getMethodArguments, getUser } from '../../utils';

import { PrepareSeedPrivateArguments } from './types';

export const seed = (context: Context) => {
  const { availableCweb, authInfo } = getCallParameters(context);

  const parametersForPreparing = getMethodArguments<PrepareSeedPrivateArguments>(context);

  const issuer = getContractIssuer(context);

  const transactionFee = 1000n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: getContractRef(context),
            methodInfo: {
              methodName: PRIVATE_METHODS.PREPARE_SEED,
              methodArgs: parametersForPreparing satisfies PrepareSeedPrivateArguments,
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: authInfo,
            },
            contractArgs: [
              constructRead(issuer, createContractOwnerKey()),
              constructRead(issuer, createMakerDepositKey(getUser(context))),
            ],
          },
        },
      ],
    ),
  ];
};
