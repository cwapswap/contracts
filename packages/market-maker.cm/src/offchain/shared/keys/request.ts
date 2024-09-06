import { ClaimKey, User } from '@coinweb/contract-kit';

import { Key } from '../constants';

export const createRequestStateFirstPart = () => [Key.REQUEST_STATE];
export const createRequestFundsFirstPart = () => [Key.REQUEST_FUNDS];
export const createRequestByOrderIndexFirstPart = (orderId: string) => [Key.REQUEST_BY_ORDER_INDEX, orderId];
export const createRequestByMarketMakerIndexFirstPart = (marketMaker: User) => [
  Key.REQUEST_BY_MAKER_INDEX,
  marketMaker,
];

export const createRequestStateKey = (id: string) =>
  ({
    first_part: createRequestStateFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;

export const createRequestFundsKey = (id: string) =>
  ({
    first_part: createRequestFundsFirstPart(),
    second_part: [id],
  }) satisfies ClaimKey;

export const createRequestByOrderIndexKey = (orderId: string, timestamp: number, requestId: string) =>
  ({
    first_part: createRequestByOrderIndexFirstPart(orderId),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, requestId],
  }) satisfies ClaimKey;

export const createRequestByMarketMakerIndexKey = (marketMaker: User, timestamp: number, requestId: string) =>
  ({
    first_part: createRequestByMarketMakerIndexFirstPart(marketMaker),
    second_part: [Number.MAX_SAFE_INTEGER - timestamp, requestId],
  }) satisfies ClaimKey;
