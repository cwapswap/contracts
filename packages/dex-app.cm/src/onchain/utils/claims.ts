import { type Claim, constructClaim, ClaimKey, getParameters, constructClaimKey } from '@coinweb/contract-kit';
import type { PubKey } from '@coinweb/wallet-lib';

import {
  createActivePositionIndexKey,
  createBestPositionIndexKey,
  createDateIndexKey,
  createPositionStateKey,
  createPositionFundsKey,
  createUserIndexKey,
  PositionStateClaimBody,
  toHex,
  PositionFundsClaimBody,
  HexBigInt,
  createClosedIndexKey,
  createOwnerKey,
} from '../../offchain/shared';
import { CONSTANTS } from '../constants';
import { ContractConfig, OwnerClaimBody } from '../types';

import { getExpectedBlockHeight } from './contract';

export const createPositionStateClaim = ({ id, body }: { id: string; body: PositionStateClaimBody }): Claim =>
  constructClaim(createPositionStateKey(id), body, toHex(0));

export const createFundsClaim = ({
  positionId,
  amount,
  owner,
  baseAmount,
  quoteAmount,
}: {
  positionId: string;
  amount: bigint;
  owner: PubKey;
  baseAmount: HexBigInt;
  quoteAmount: HexBigInt;
}): Claim =>
  constructClaim(
    createPositionFundsKey(positionId),
    {
      owner,
      baseAmount,
      quoteAmount,
    } satisfies PositionFundsClaimBody,
    toHex(amount),
  );

export const createActiveIndexClaim = ({ timestamp, positionId }: { timestamp: number; positionId: string }): Claim =>
  constructClaim(createActivePositionIndexKey(timestamp, positionId), {}, toHex(0));

export const createDateIndexClaim = ({ timestamp, positionId }: { timestamp: number; positionId: string }): Claim =>
  constructClaim(createDateIndexKey(timestamp, positionId), {}, toHex(0));

export const createBestPositionIndexClaim = ({
  baseAmount,
  quoteAmount,
  positionId,
}: {
  baseAmount: bigint;
  quoteAmount: bigint;
  positionId: string;
}): Claim =>
  constructClaim(
    createBestPositionIndexKey(
      quoteAmount
        ? baseAmount / quoteAmount
        : BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), //TODO: Come back to this later
      positionId,
    ),
    {},
    toHex(0),
  );

export const createUserIndexClaim = ({
  pubKey,
  timestamp,
  positionId,
}: {
  pubKey: PubKey;
  timestamp: number;
  positionId: string;
}): Claim => constructClaim(createUserIndexKey(pubKey, timestamp, positionId), {}, toHex(0));

export const createClosedIndexClaim = ({ positionId }: { positionId: string }): Claim =>
  constructClaim(createClosedIndexKey(positionId), {}, toHex(0));

export const createOwnerClaim = ({ owner }: { owner: string }): Claim =>
  constructClaim(
    createOwnerKey(),
    {
      owner,
      updatedAt: Date.now(),
    } satisfies OwnerClaimBody,
    toHex(0),
  );

export const createL1AcceptEventClaimKey = (positionId: string, nonce: bigint): ClaimKey => {
  const parameters: ContractConfig = getParameters('contract/parameters.json');

  return constructClaimKey(
    {
      l1_contract: parameters.l1_contract_address.toLowerCase(),
    },
    {
      topics: [CONSTANTS.L1_ACCEPT_EVENT_SIGNATURE, positionId, toHex(nonce)],
    },
  );
};

export const createExpirationPositionClaimKey = (expirationDate: number): ClaimKey =>
  constructClaimKey('L2BlockIdToHeightFirstPart', getExpectedBlockHeight(expirationDate));
