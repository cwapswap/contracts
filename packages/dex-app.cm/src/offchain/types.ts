import type { GqlIssuedClaim } from '@coinweb/wallet-lib';

import { ACTIVITY_STATUS, PAYMENT_STATUS } from './shared/constants';

export type CreatePositionRequestData = {
  contractId: string;
  baseAmount: string;
  quoteAmount: string;
  recipient: string;
  contractOwnerFee: string;
};

export type CancelPositionRequestData = {
  contractId: string;
  positionId: string;
};

export type IssuedClaim = GqlIssuedClaim & {
  content: {
    key: {
      first_part: string;
      second_part: string;
    };
  };
};

export type Pagination = {
  limit: number;
  offset: number;
};

export type PositionData = {
  id: string;
  recipient: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  activityStatus: ACTIVITY_STATUS;
  paymentStatus: PAYMENT_STATUS;
  funds: bigint;
  createdAt: number;
};

export type Client = {
  fetchClaims<T extends NonNullable<unknown>>(
    firstPart: NonNullable<unknown>,
    secondPart: T | null,
    range?: {
      start: T;
      end: T;
    },
  ): Promise<GqlIssuedClaim[]>;
};
