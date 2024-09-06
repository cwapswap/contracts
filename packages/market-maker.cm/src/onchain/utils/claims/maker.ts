import { Claim, User, constructClaim } from '@coinweb/contract-kit';

import { MakerDepositClaimBody, createMakerDepositKey, toHex } from '../../../offchain/shared';
import { getTime } from '../context';

export const createMakerDepositClaim = ({ amount, user }: { user: User; amount: bigint }): Claim =>
  constructClaim(
    createMakerDepositKey(user),
    {
      owner: user,
      updatedAt: getTime(),
    } satisfies MakerDepositClaimBody,
    toHex(amount),
  );
