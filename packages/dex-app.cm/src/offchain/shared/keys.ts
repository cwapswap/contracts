import type { ClaimKey } from '@coinweb/contract-kit';

import { Key } from './constants';
import type { PubKey } from './types';

export const createPositionStateFirstPart = () => [Key.STATE];

export const createPositionFundsFirstPart = () => [Key.FUNDS];

export const createDateIndexFirstPart = () => [Key.DATE_INDEX];

export const createBestPositionIndexFirstPart = () => [Key.BEST_INDEX];

export const createActivePositionIndexFirstPart = () => [Key.ACTIVE_INDEX];

export const createUserIndexFirstPart = (pubKey: PubKey) => [Key.USER_INDEX, pubKey];

export const createClosedIndexFirstPart = () => [Key.CLOSED_INDEX];

export const createOwnerFirstPart = () => [Key.CONTRACT_OWNER];

export const createPositionStateKey = (positionId: string) =>
  ({
    first_part: createPositionStateFirstPart(),
    second_part: [positionId],
  }) satisfies ClaimKey;

export const createPositionFundsKey = (positionId: string) =>
  ({
    first_part: createPositionFundsFirstPart(),
    second_part: [positionId],
  }) satisfies ClaimKey;

export const createDateIndexKey = (timestamp: number, positionId: string) =>
  ({
    first_part: createDateIndexFirstPart(),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, positionId],
  }) satisfies ClaimKey;

export const createBestPositionIndexKey = (rate: bigint, positionId: string) =>
  ({
    first_part: createBestPositionIndexFirstPart(),
    second_part: [rate.toString(16), positionId],
  }) satisfies ClaimKey;

export const createActivePositionIndexKey = (timestamp: number, positionId: string) =>
  ({
    first_part: createActivePositionIndexFirstPart(),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, positionId],
  }) satisfies ClaimKey;

export const createUserIndexKey = (pubKey: PubKey, timestamp: number, positionId: string) =>
  ({
    first_part: createUserIndexFirstPart(pubKey),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, positionId],
  }) satisfies ClaimKey;

export const createClosedIndexKey = (positionId: string) =>
  ({
    first_part: createClosedIndexFirstPart(),
    second_part: [positionId],
  }) satisfies ClaimKey;

export const createOwnerKey = () =>
  ({
    first_part: createOwnerFirstPart(),
    second_part: [],
  }) satisfies ClaimKey;
