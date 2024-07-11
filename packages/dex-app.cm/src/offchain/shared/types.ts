import { ACTIVITY_STATUS, PAYMENT_STATUS } from './constants';

export type PubKey = string;

export type HexBigInt = `0x${string}`;

export type PositionStateClaimBody = {
  recipient: string;
  baseAmount: HexBigInt;
  quoteAmount: HexBigInt;
  createdAt: number;
  expirationDate: number;
  activityStatus: ACTIVITY_STATUS;
  paymentStatus: PAYMENT_STATUS;
  funds: HexBigInt;
};

export type PositionFundsClaimBody = {
  owner: PubKey;
  baseAmount: HexBigInt;
  quoteAmount: HexBigInt;
};
