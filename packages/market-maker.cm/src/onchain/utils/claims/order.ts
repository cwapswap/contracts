import { type Claim, constructClaim, User } from '@coinweb/contract-kit';

import {
  createActiveOrderIndexKey,
  createBestOrderIndexKey,
  createOrderDateIndexKey,
  createOrderStateKey,
  createOrderCollateralKey,
  createOrderOwnerIndexKey,
  OrderStateClaimBody,
  toHex,
  CollateralClaimBody,
  createClosedOrderIndexKey,
} from '../../../offchain/shared';

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
  baseAmount: bigint;
  quoteAmount: bigint;
  id: string;
}): Claim =>
  constructClaim(
    createBestOrderIndexKey(
      quoteAmount
        ? baseAmount / quoteAmount
        : BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'), //TODO: Come back to this later
      id,
    ),
    {},
    toHex(0),
  );

export const createOrderOwnerIndexClaim = ({
  user,
  timestamp,
  id,
}: {
  user: User;
  timestamp: number;
  id: string;
}): Claim => constructClaim(createOrderOwnerIndexKey(user, timestamp, id), {}, toHex(0));

export const createClosedOrderIndexClaim = ({ id }: { id: string }): Claim =>
  constructClaim(createClosedOrderIndexKey(id), {}, toHex(0));
