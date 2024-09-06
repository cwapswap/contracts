import { type Claim, constructClaim, User } from '@coinweb/contract-kit';

import {
  createActiveOrderIndexKey,
  createBestOrderIndexKey,
  createOrderDateIndexKey,
  createOrderStateKey,
  createOrderCollateralKey,
  createOrderByOwnerIndexKey,
  OrderStateClaimBody,
  toHex,
  CollateralClaimBody,
  createClosedOrderIndexKey,
  createBestActiveOrderIndexKey,
  HexBigInt,
  createPendingOrderByOwnerIndexKey,
} from '../../../offchain/shared';
import { createRateIndex } from '../dataConversions';

export const createOrderStateClaim = ({ id, body }: { id: string; body: OrderStateClaimBody }): Claim =>
  constructClaim(createOrderStateKey(id), body, toHex(0));

export const createOrderCollateralClaim = ({ id, amount, owner }: { id: string; amount: bigint; owner: User }): Claim =>
  constructClaim(
    createOrderCollateralKey(id),
    {
      owner,
    } satisfies CollateralClaimBody,
    toHex(amount),
  );

export const createOrderActiveIndexClaim = ({ timestamp, id }: { timestamp: number; id: string }): Claim =>
  constructClaim(createActiveOrderIndexKey(timestamp, id), {}, toHex(0));

export const createOrderDateIndexClaim = ({ timestamp, id }: { timestamp: number; id: string }): Claim =>
  constructClaim(createOrderDateIndexKey(timestamp, id), {}, toHex(0));

export const createBestOrderIndexClaim = ({
  baseAmount,
  quoteAmount,
  id,
}: {
  baseAmount: bigint | HexBigInt;
  quoteAmount: bigint | HexBigInt;
  id: string;
}): Claim => constructClaim(createBestOrderIndexKey(createRateIndex(baseAmount, quoteAmount), id), {}, toHex(0));

export const createBestActiveOrderIndexClaim = ({
  baseAmount,
  quoteAmount,
  id,
}: {
  baseAmount: bigint | HexBigInt;
  quoteAmount: bigint | HexBigInt;
  id: string;
}): Claim => constructClaim(createBestActiveOrderIndexKey(createRateIndex(baseAmount, quoteAmount), id), {}, toHex(0));

export const createOrderByOwnerIndexClaim = ({
  user,
  timestamp,
  id,
}: {
  user: User;
  timestamp: number;
  id: string;
}): Claim => constructClaim(createOrderByOwnerIndexKey(user, timestamp, id), {}, toHex(0));

export const createPendingOrderByOwnerIndexClaim = ({
  user,
  timestamp,
  id,
}: {
  user: User;
  timestamp: number;
  id: string;
}): Claim => constructClaim(createPendingOrderByOwnerIndexKey(user, timestamp, id), {}, toHex(0));

export const createClosedOrderIndexClaim = ({ id }: { id: string }): Claim =>
  constructClaim(createClosedOrderIndexKey(id), {}, toHex(0));
