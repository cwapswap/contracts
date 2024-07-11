import { type GqlIssuedClaim } from '@coinweb/wallet-lib';

import { OrderStateClaimBody } from './shared';

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

export type Order = { id: string; baseAmount: bigint; quoteAmount: bigint; collateral: bigint } & Omit<
  OrderStateClaimBody,
  'baseAmount' | 'quoteAmount' | 'collateral'
>;

export type DepositRequestData = {
  contractId: string;
  depositAmount: bigint;
  contractOwnerFee: bigint;
};

export type WithdrawRequestData = {
  contractId: string;
  withdrawAmount: bigint;
};

export type CreateOrderRequestData = {
  contractId: string;
  baseAmount: bigint;
  l1Amount: bigint;
  baseWallet: string;
};

export type CancelOrderRequestData = {
  contractId: string;
  orderId: string;
};
