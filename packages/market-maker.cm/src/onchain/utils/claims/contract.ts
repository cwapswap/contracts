import { type Claim, constructClaim, User } from '@coinweb/contract-kit';

import { createContractOwnerKey, toHex } from '../../../offchain/shared';
import { ContractOwnerClaimBody } from '../../types';

export const createContractOwnerClaim = ({ owner }: { owner: User }): Claim =>
  constructClaim(
    createContractOwnerKey(),
    {
      owner,
      updatedAt: Date.now(),
    } satisfies ContractOwnerClaimBody,
    toHex(0),
  );
