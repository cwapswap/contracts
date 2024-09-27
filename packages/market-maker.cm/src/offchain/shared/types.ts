import { User } from '@coinweb/contract-kit';

import { ORDER_ACTIVITY_STATUS, REQUEST_EXECUTION_STATUS } from './constants';

export type HexBigInt = `0x${string}`;

export type MakerStateClaimBody = {
  deposit: HexBigInt;
  collateral: HexBigInt;
};

export type MakerDepositClaimBody = {
  owner: User;
  updatedAt: number;
};

export type OrderStateClaimBody = {
  baseAmount: HexBigInt;
  l1Amount: HexBigInt;
  createdAt: number;
  expirationDate: number;
  activityStatus: ORDER_ACTIVITY_STATUS;
  collateral: HexBigInt;
  covering: HexBigInt;
  owner: User;
  baseRecipient: User;
  txId: string;
};

export type CollateralClaimBody = {
  owner: User;
};

export type RequestStateClaimBody = {
  requestedOrderId: string;
  quoteWallet: string;
  baseAmount: HexBigInt;
  requestedQuoteAmount: HexBigInt;
  promisedQuoteAmount: HexBigInt;
  createdAt: number;
  expirationDate: number;
  executionStatus: REQUEST_EXECUTION_STATUS;
  collateral: HexBigInt;
  fallbackContractId: string;
  fallbackMethodName: string;
  txId: string;
};

export type OrderId = string;
export type CwebWallet = string;

export type DepositArguments = [depositAmount: HexBigInt];
export type WithdrawArguments = [withdrawAmount: HexBigInt];
export type CreateOrderArguments = [baseAmount: HexBigInt, l1Amount: HexBigInt, baseRecipient: User];
export type ChangeOrderArguments = [baseAmount: HexBigInt, l1Amount: HexBigInt, baseRecipient: User];
export type CancelOrderArguments = [id: OrderId];
export type ChangeContractOwnerArguments = [newOwner: User];
