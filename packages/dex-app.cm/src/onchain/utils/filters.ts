import { BlockFilter, ClaimKey, ContractIssuer } from '@coinweb/contract-kit';

import { createClosedIndexKey } from '../../offchain/shared';
import { CONSTANTS } from '../constants';

import { createExpirationPositionClaimKey } from './claims';

export const createExpirationPositionBlockFilter = (expirationDate: number): BlockFilter => {
  const { first_part: first, second_part: second } = createExpirationPositionClaimKey(expirationDate);

  return {
    issuer: CONSTANTS.BLOCK_HEIGHT_INFO_PROVIDER,
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

export const createL1AcceptEventBlockFilter = (claimKey: ClaimKey): BlockFilter => {
  const { first_part: first, second_part: second } = claimKey;

  return {
    issuer: CONSTANTS.L1_EVENT_INFO_PROVIDER,
    first,
    second,
  };
};
