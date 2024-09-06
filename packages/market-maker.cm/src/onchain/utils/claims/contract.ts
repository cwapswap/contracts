import { type Claim, constructClaim, User } from '@coinweb/contract-kit';

import { createContractOwnerKey, toHex } from '../../../offchain/shared';
import { ContractOwnerClaimBody } from '../../types';
import { getTime } from '../context';

export const createContractOwnerClaim = ({ owner }: { owner: User }): Claim =>
  constructClaim(
    createContractOwnerKey(),
    {
      owner,
      updatedAt: getTime(),
    } satisfies ContractOwnerClaimBody,
    toHex(0),
  );
