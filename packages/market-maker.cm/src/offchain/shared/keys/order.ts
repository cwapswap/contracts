import { ClaimKey, User } from '@coinweb/contract-kit';

import { Key } from '../constants';

export const createOrderStateFirstPart = () => [Key.ORDER_STATE];
export const createOrderCollateralFirstPart = () => [Key.ORDER_COLLATERAL];
export const createOrderDateIndexFirstPart = () => [Key.ORDER_DATE_INDEX];
export const createBestOrderIndexFirstPart = () => [Key.ORDER_BEST_INDEX];
export const createActiveOrderIndexFirstPart = () => [Key.ORDER_ACTIVE_INDEX];
export const createBestActiveOrderIndexFirstPart = () => [Key.ORDER_BEST_INDEX, Key.ORDER_ACTIVE_INDEX];
export const createOrderByOwnerIndexFirstPart = (user: User) => [Key.ORDER_OWNER_INDEX, user];
export const createBestOrderByOwnerIndexFirstPart = (user: User) => [Key.ORDER_BEST_INDEX, Key.ORDER_OWNER_INDEX, user];
export const createOrderClosedIndexFirstPart = () => [Key.ORDER_CLOSED_INDEX];
export const createPendingOrderByOwnerIndexFirstPart = (user: User) => [
  Key.ORDER_PENDING_INDEX,
  Key.ORDER_OWNER_INDEX,
  user,
];

export const createOrderStateKey = (id: string) =>
  ({
    first_part: createOrderStateFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;

export const createOrderCollateralKey = (id: string) =>
  ({
    first_part: createOrderCollateralFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;

export const createOrderDateIndexKey = (timestamp: number, id: string) =>
  ({
    first_part: createOrderDateIndexFirstPart(),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, id],
  }) satisfies ClaimKey;

export const createBestOrderIndexKey = (rate: bigint, id: string) =>
  ({
    first_part: createBestOrderIndexFirstPart(),
    second_part: [rate.toString(16), id],
  }) satisfies ClaimKey;

export const createActiveOrderIndexKey = (timestamp: number, id: string) =>
  ({
    first_part: createActiveOrderIndexFirstPart(),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, id],
  }) satisfies ClaimKey;

export const createBestActiveOrderIndexKey = (rate: bigint, id: string) =>
  ({
    first_part: createBestActiveOrderIndexFirstPart(),
    second_part: [rate.toString(16), id],
  }) satisfies ClaimKey;

export const createOrderByOwnerIndexKey = (user: User, timestamp: number, id: string) =>
  ({
    first_part: createOrderByOwnerIndexFirstPart(user),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, id],
  }) satisfies ClaimKey;

export const createPendingOrderByOwnerIndexKey = (user: User, timestamp: number, id: string) =>
  ({
    first_part: createPendingOrderByOwnerIndexFirstPart(user),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, id],
  }) satisfies ClaimKey;

export const createBestOrderByOwnerIndexKey = (rate: bigint, user: User, id: string) =>
  ({
    first_part: createBestOrderByOwnerIndexFirstPart(user),
    second_part: [rate.toString(16), id],
  }) satisfies ClaimKey;

export const createClosedOrderIndexKey = (id: string) =>
  ({
    first_part: createOrderClosedIndexFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;
