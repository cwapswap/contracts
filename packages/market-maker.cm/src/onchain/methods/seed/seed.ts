import { constructContinueTx, constructRead, Context, selfCallWrapper } from '@coinweb/contract-kit';

import { createContractOwnerKey, createMakerDepositKey } from '../../../offchain/shared';
import { PRIVATE_METHODS } from '../../constants';
import { getCallParameters, getContractIssuer, getContractRef, getUser } from '../../utils';

export const seed = selfCallWrapper((context: Context) => {
  const { availableCweb, authInfo } = getCallParameters(context);

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
              methodArgs: [],
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
});
