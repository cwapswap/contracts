import { User } from '@coinweb/contract-kit';
import { type GqlIssuedClaim } from '@coinweb/wallet-lib';

import { OrderStateClaimBody, RequestStateClaimBody } from './shared';

export type Pagination = {
  limit: number;
  offset: number;
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

export type Order = {
  id: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  collateral: bigint;
  covering: bigint;
} & Omit<OrderStateClaimBody, 'baseAmount' | 'quoteAmount' | 'collateral' | 'covering'>;

export type ExecutionRequest = {
  id: string;
  baseAmount: bigint;
  quoteAmount: bigint;
  collateral: bigint;
} & Omit<RequestStateClaimBody, 'requestedQuoteAmount' | 'promisedQuoteAmount' | 'baseAmount' | 'collateral'>;

export type DepositRequestData = {
  contractId: string;
  depositAmount: bigint;
};

export type WithdrawRequestData = {
  contractId: string;
  withdrawAmount: bigint;
};

export type CreateOrderRequestData = {
  contractId: string;
  baseAmount: bigint;
  l1Amount: bigint;
  baseRecipient: User;
};

export type CancelOrderRequestData = {
  contractId: string;
  orderId: string;
};
