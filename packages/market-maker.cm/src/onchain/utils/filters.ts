import {
  BlockFilter,
  ClaimKey,
  ContractIssuer,
  constructClaimKey,
  getContextGenesis,
  getContextSystem,
} from '@coinweb/contract-kit';

import { toHex } from '../../offchain/shared';
import { createClosedOrderIndexKey } from '../../offchain/shared/keys';
import { CONSTANTS } from '../constants';

import { getInstanceParameters } from './context';

const { l2_shard_mining_time: miningTime } = getContextGenesis();

const getExpectedBlockHeight = (futureDate: number) => {
  const { block_height: currentHeight } = getContextSystem();
  const now = Date.now();

  const miningPeriod = miningTime.secs * 1000 + miningTime.nanos / 1_000_000;

  if (now >= futureDate) {
    return currentHeight;
  }

  return currentHeight + Math.trunc((futureDate - now) / miningPeriod);
};

export const createExpirationClaimKey = (expirationDate: number): ClaimKey =>
  constructClaimKey('L2BlockIdToHeightFirstPart', getExpectedBlockHeight(expirationDate));

export const createExpirationBlockFilter = (expirationDate: number): BlockFilter => {
  const { first_part: first, second_part: second } = createExpirationClaimKey(expirationDate);

  return {
    issuer: 'L2BlockInfoProvider',
    first,
    second,
  };
};

export const createClosedOrderBlockFilter = (issuer: ContractIssuer, id: string): BlockFilter => {
  const { first_part: first, second_part: second } = createClosedOrderIndexKey(id);

  return {
    issuer,
    first,
    second,
  };
};

export const createL1ExecuteEventClaimKey = (requestId: string, nonce: bigint): ClaimKey => {
  const parameters = getInstanceParameters();

  return constructClaimKey(
    {
      l1_contract: parameters.l1_contract_address.toLowerCase(),
    },
    {
      topics: [CONSTANTS.L1_EXECUTE_EVENT_SIGNATURE, requestId, toHex(nonce)],
    },
  );
};

export const wrapWithJumpEventBlockFilter = (filter: BlockFilter, issuer: ContractIssuer): BlockFilter => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return filter;
  }

  return {
    issuer: {
      FromSmartContract: CONSTANTS.JUMP_CONTRACT_ID,
    },
    first: issuer,
    second: filter,
  };
};

export const createL1ExecuteEventBlockFilter = (id: string, nonce: bigint): BlockFilter => {
  const { first_part: first, second_part: second } = createL1ExecuteEventClaimKey(id, nonce);

  return {
    issuer: 'L2BlockInfoProvider',
    first,
    second,
  };
};
