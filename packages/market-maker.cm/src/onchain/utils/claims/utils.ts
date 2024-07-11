import { Claim, ClaimKey, ContractIssuer, getContextSystem } from '@coinweb/contract-kit';

import { getInstanceParameters } from '../context';

export const wrapWithJumpEventClaimKey = (claimKey: ClaimKey, issuer: ContractIssuer) => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return claimKey;
  }

  return {
    first_part: issuer,
    second_part: [
      eventShard,
      {
        issuer: 'L2BlockInfoProvider',
        first: claimKey.first_part,
        second: claimKey.second_part,
      },
    ],
  };
};

export const unwrapEventClaim = <T extends Claim | null>(claim?: Claim | null): T => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (!claim || currentShard === eventShard) {
    return claim as T;
  }

  //TODO! Check data structure and implement
  throw new Error(JSON.stringify(claim));
};
