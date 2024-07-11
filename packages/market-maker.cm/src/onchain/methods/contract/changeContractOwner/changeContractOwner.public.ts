import {
  Context,
  User,
  constructContinueTx,
  constructContractIssuer,
  constructContractRef,
  constructRead,
  extractContractInfo,
  getContractId,
  getMethodArguments,
} from '@coinweb/contract-kit';

import { PUBLIC_METHODS, createContractOwnerKey } from '../../../../offchain/shared';

export const changeContractOwnerPublic = (context: Context) => {
  const { tx } = context;
  const { providedCweb: availableCweb, authenticated: auth } = extractContractInfo(tx);

  if (!availableCweb) {
    throw new Error('Cweb was not provided');
  }

  const [, newOwner] = getMethodArguments(context) as [unknown, User];

  const issuer = constructContractIssuer(getContractId(tx));

  const transactionFee = 900n;

  return [
    constructContinueTx(
      context,
      [],
      [
        {
          callInfo: {
            ref: constructContractRef(issuer, []),
            methodInfo: {
              methodName: PUBLIC_METHODS.CHANGE_CONTRACT_OWNER,
              methodArgs: [newOwner],
            },
            contractInfo: {
              providedCweb: availableCweb - transactionFee,
              authenticated: auth,
            },
            contractArgs: [constructRead(issuer, createContractOwnerKey())],
          },
        },
      ],
    ),
  ];
};
