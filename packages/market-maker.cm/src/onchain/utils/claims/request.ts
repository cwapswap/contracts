import { Claim, ClaimKey, User, constructClaim } from '@coinweb/contract-kit';

import {
  RequestStateClaimBody,
  toHex,
  createRequestStateKey,
  createRequestFundsKey,
  createRequestByOrderIndexKey,
  createRequestByMarketMakerIndexKey,
} from '../../../offchain/shared';

export const createRequestStateClaim = ({ id, body }: { id: string; body: RequestStateClaimBody }): Claim =>
  constructClaim(createRequestStateKey(id), body, toHex(0));

export const createRequestFundsClaim = ({ id, amount }: { id: string; amount: bigint }): Claim =>
  constructClaim(createRequestFundsKey(id), {}, toHex(amount));

export const createRequestByOrderIndexClaim = ({
  id,
  orderId,
  timestamp,
}: {
  orderId: string;
  timestamp: number;
  id: string;
}) => constructClaim(createRequestByOrderIndexKey(orderId, timestamp, id), {}, toHex(0));

export const createRequestByMarketMakerIndexClaim = ({
  marketMaker,
  timestamp,
  id,
}: {
  marketMaker: User;
  timestamp: number;
  id: string;
}) => constructClaim(createRequestByMarketMakerIndexKey(marketMaker, timestamp, id), {}, toHex(0));
