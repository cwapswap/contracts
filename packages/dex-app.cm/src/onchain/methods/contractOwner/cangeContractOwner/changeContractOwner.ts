import {
  Context,
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

import { ContractConfig, OwnerClaimBody } from '../../../types';
import { createOwnerClaim } from '../../../utils';

export const changeContractOwner = selfCallWrapper((context: Context) => {
  const { tx } = context;

  const [, newOwner] = getMethodArguments(context) as [unknown, string];

  const ownerClaim = extractRead(extractContractArgs(tx)[0])?.[0]?.content.body as OwnerClaimBody | undefined;

  const currentOwner = ownerClaim?.owner || (getParameters('contract/parameters.json') as ContractConfig).owner;

  const signer = extractUser(getAuthenticated(tx)).payload;

  if (currentOwner !== signer) {
    throw new Error('Operation not permitted');
  }

  if (currentOwner === newOwner) {
    throw new Error('The new owner may not be the same');
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
});
