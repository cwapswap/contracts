import type { ClaimKey, OrdJson, User } from '@coinweb/contract-kit';

import { Key } from './constants';
import { BtcChainData } from './types';

/* FirstPart */

export const createPositionStateFirstPart = () => [Key.STATE];

export const createPositionFundsFirstPart = () => [Key.FUNDS];

export const createDateIndexFirstPart = () => [Key.DATE_INDEX];

export const createBestByQuoteIndexFirstPart = () => [Key.BEST_BY_QUOTE_INDEX];

export const createActivePositionIndexFirstPart = () => [Key.ACTIVE_INDEX];

export const createBestByQuoteActiveIndexFirstPart = () => [Key.BEST_BY_QUOTE_INDEX, Key.ACTIVE_INDEX];

export const createUserIndexFirstPart = (user: User) => [Key.USER_INDEX, user];

export const createClosedIndexFirstPart = () => [Key.CLOSED_INDEX];

export const createOwnerFirstPart = () => [Key.CONTRACT_OWNER];

export const createUniquenessFirstPart = () => [Key.UNIQUENESS_CHECK];

export const createErrorByDateFirstPart = () => [Key.ERROR_INDEX, Key.DATE_INDEX];

/* Key */
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

export const createBestByQuoteIndexKey = (rate: bigint, positionId: string) =>
  ({
    first_part: createBestByQuoteIndexFirstPart(),
    second_part: [rate.toString(16), positionId],
  }) satisfies ClaimKey;

export const createActivePositionIndexKey = (timestamp: number, positionId: string) =>
  ({
    first_part: createActivePositionIndexFirstPart(),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, positionId],
  }) satisfies ClaimKey;

export const createBestByQuoteActiveIndexKey = (rate: bigint, positionId: string) =>
  ({
    first_part: createBestByQuoteActiveIndexFirstPart(),
    second_part: [rate.toString(16), positionId],
  }) satisfies ClaimKey;

export const createUserIndexKey = (user: User, timestamp: number, positionId: string) =>
  ({
    first_part: createUserIndexFirstPart(user),
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

export const createUniquenessKey = (data: OrdJson) =>
  ({
    first_part: createUniquenessFirstPart(),
    second_part: data,
  }) satisfies ClaimKey;

export const createBtcUtxoUniquenessKey = (data: BtcChainData) =>
  ({
    first_part: createUniquenessFirstPart(),
    second_part: [data.l1TxId, data.vout],
  }) satisfies ClaimKey;

export const createErrorByDateKey = (timestamp: number, positionId: string) =>
  ({
    first_part: createErrorByDateFirstPart(),
    second_part: [timestamp, positionId],
  }) satisfies ClaimKey;
