import { BlockFilter, ContractIssuer } from '@coinweb/contract-kit';

import { createClosedIndexKey } from '../../offchain/shared';

import { createExpirationPositionClaimKey, createL1AcceptEventClaimKey } from './claims';

export const createExpirationPositionBlockFilter = (expirationDate: number): BlockFilter => {
  const { first_part: first, second_part: second } = createExpirationPositionClaimKey(expirationDate);

  return {
    issuer: 'L2BlockInfoProvider',
    first,
    second,
  };
};

export const createClosedPositionBlockFilter = (issuer: ContractIssuer, positionId: string): BlockFilter => {
  const { first_part: first, second_part: second } = createClosedIndexKey(positionId);

  return {
    issuer,
    first,
    second,
  };
};

export const createL1AcceptEventBlockFilter = (positionId: string, nonce: bigint): BlockFilter => {
  const { first_part: first, second_part: second } = createL1AcceptEventClaimKey(positionId, nonce);

  return {
    issuer: 'L2BlockInfoProvider',
    first,
    second,
  };
};
