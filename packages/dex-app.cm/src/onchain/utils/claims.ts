import { type Claim, constructClaim, ClaimKey, constructClaimKey } from '@coinweb/contract-kit';
import type { PubKey } from '@coinweb/wallet-lib';

import {
  createActivePositionIndexKey,
  createBestByQuoteIndexKey,
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
  createBestByQuoteActiveIndexKey,
} from '../../offchain/shared';
import { CONSTANTS } from '../constants';
import { L1Types, OwnerClaimBody } from '../types';

import { getExpectedBlockHeight, getInstanceParameters, getTime } from './contract';
import { createBestByQuoteIndex } from './dataConversion';

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
  owner?: PubKey;
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

export const createBestByQuoteIndexClaim = ({
  baseAmount,
  quoteAmount,
  positionId,
}: {
  baseAmount: bigint | HexBigInt;
  quoteAmount: bigint | HexBigInt;
  positionId: string;
}): Claim =>
  constructClaim(createBestByQuoteIndexKey(createBestByQuoteIndex(baseAmount, quoteAmount), positionId), {}, toHex(0));

export const createBestByQuoteActiveIndexClaim = ({
  baseAmount,
  quoteAmount,
  positionId,
}: {
  baseAmount: bigint | HexBigInt;
  quoteAmount: bigint | HexBigInt;
  positionId: string;
}): Claim =>
  constructClaim(
    createBestByQuoteActiveIndexKey(createBestByQuoteIndex(baseAmount, quoteAmount), positionId),
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
      updatedAt: getTime(),
    } satisfies OwnerClaimBody,
    toHex(0),
  );

export const createEvmEventClaimKey = (positionId: string, nonce: bigint): ClaimKey => {
  const parameters = getInstanceParameters(L1Types.Evm);

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
