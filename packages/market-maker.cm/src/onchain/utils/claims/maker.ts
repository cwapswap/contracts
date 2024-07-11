import { Claim, User, constructClaim } from '@coinweb/contract-kit';

import { MakerDepositClaimBody, createMakerDepositKey, toHex } from '../../../offchain/shared';

export const createMakerDepositClaim = ({ amount, user }: { user: User; amount: bigint }): Claim =>
  constructClaim(
    createMakerDepositKey(user),
    {
      owner: user,
      updatedAt: Date.now(),
    } satisfies MakerDepositClaimBody,
    toHex(amount),
  );
