import {
  BlockFilter,
  Claim,
  ClaimIssuer,
  ClaimKey,
  ContractIssuer,
  constructContractIssuer,
  constructContractRef,
  getContextSystem,
} from '@coinweb/contract-kit';

import { CONSTANTS } from '../constants';
import { TypedClaim } from '../types';

import { getInstanceParameters } from './contract';
import { createL1AcceptEventBlockFilter } from './filters';

export const wrapWithJumpEventClaimKey = (claimKey: ClaimKey, issuer: ClaimIssuer) => {
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
        issuer: CONSTANTS.L1_EVENT_INFO_PROVIDER,
        first: claimKey.first_part,
        second: claimKey.second_part,
      },
    ],
  };
};

export const wrapWithJumpEventIssuer = () => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return CONSTANTS.L1_EVENT_INFO_PROVIDER;
  }

  return constructContractIssuer(CONSTANTS.JUMP_CONTRACT_ID);
};

export const wrapWithJumpEventBlockFilter = (filter: BlockFilter, issuer: ContractIssuer): BlockFilter => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return filter;
  }

  return {
    issuer: constructContractIssuer(CONSTANTS.JUMP_CONTRACT_ID),
    first: issuer,
    second: [eventShard, filter],
  };
};

export const constructJumpCall = (claimKey: ClaimKey, providedCweb: bigint) => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (currentShard === eventShard) {
    return [];
  }

  return [
    {
      callInfo: {
        ref: constructContractRef(constructContractIssuer(CONSTANTS.JUMP_CONTRACT_ID), []),
        methodInfo: {
          methodName: CONSTANTS.JUMP_CONTRACT_METHOD,
          methodArgs: [eventShard, createL1AcceptEventBlockFilter(claimKey)],
        },
        contractInfo: {
          providedCweb,
          authenticated: null,
        },
        contractArgs: [],
      },
    },
  ];
};

export const unwrapEventClaim = <T extends Claim>(claim?: Claim): T => {
  const { shard: currentShard } = getContextSystem();
  const { shard: eventShard } = getInstanceParameters();

  if (!claim || currentShard === eventShard) {
    return claim as T;
  }

  return (claim as TypedClaim<[{ content: T }]>).body[0].content;
};
