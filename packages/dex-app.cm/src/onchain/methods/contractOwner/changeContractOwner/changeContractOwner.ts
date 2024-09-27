import {
  Context,
  User,
  constructContinueTx,
  constructStore,
  extractContractArgs,
  extractRead,
  getMethodArguments,
} from '@coinweb/contract-kit';

import { OwnerClaimBody } from '../../../types';
import { createOwnerClaim, getInstanceParameters, getUser, isEqualUser } from '../../../utils';

export const changeContractOwner = (context: Context) => {
  const { tx } = context;

  const [, newOwner] = getMethodArguments(context) as [unknown, User];

  const ownerClaim = extractRead(extractContractArgs(tx)[0])?.[0]?.content.body as OwnerClaimBody | undefined;

  const currentOwner = ownerClaim?.owner || getInstanceParameters().owner;

  const signer = getUser(context);

  if (!isEqualUser(currentOwner, signer)) {
    throw new Error('Operation not permitted');
  }

  if (isEqualUser(currentOwner, newOwner)) {
    throw new Error('The new contract owner may not be the same');
  }

  return [
    constructContinueTx(context, [
      constructStore(
        createOwnerClaim({
          owner: newOwner,
        }),
      ),
    ]),
  ];
};
