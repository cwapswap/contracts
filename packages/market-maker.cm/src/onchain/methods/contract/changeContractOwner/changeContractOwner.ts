import {
  Context,
  User,
  constructContinueTx,
  constructStore,
  extractContractArgs,
  extractRead,
  extractUser,
  getAuthenticated,
  getMethodArguments,
  getParameters,
  selfCallWrapper,
} from '@coinweb/contract-kit';

import { InstanceParameters, ContractOwnerClaimBody } from '../../../types';
import { createContractOwnerClaim } from '../../../utils/claims';
import { isEqualUser } from '../../../utils/user';

export const changeContractOwner = selfCallWrapper((context: Context) => {
  const { tx } = context;

  const [, newOwner] = getMethodArguments(context) as [unknown, User];

  const ownerClaim = extractRead(extractContractArgs(tx)[0])?.[0]?.content.body as ContractOwnerClaimBody | undefined;

  const currentOwner = ownerClaim?.owner || (getParameters('contract/parameters.json') as InstanceParameters).owner;

  const signer = extractUser(getAuthenticated(tx));

  if (!isEqualUser(currentOwner, signer)) {
    throw new Error('Operation not permitted');
  }

  if (isEqualUser(currentOwner, newOwner)) {
    throw new Error('The new contract owner may not be the same');
  }

  return [
    constructContinueTx(context, [
      constructStore(
        createContractOwnerClaim({
          owner: newOwner,
        }),
      ),
    ]),
  ];
});
