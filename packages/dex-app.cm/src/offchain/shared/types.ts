import type { HexString, User } from '@coinweb/contract-kit';

import { ACTIVITY_STATUS, PAYMENT_STATUS, CallType } from './constants';

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
  chainData: ChainData;
  txId: string;
  error: string | null;
};

export type PositionFundsClaimBody = {
  owner: User;
  baseAmount: HexBigInt;
  quoteAmount: HexBigInt;
};

export type UniquenessClaimBody = {
  message: string;
};

export type ChainData = unknown;

export type BtcChainData = {
  l1TxId: string;
  vout: number;
  psbt: string;
};

export type L1TxDataForAccept = {
  callType: CallType.Accept;
  quoteAmount: HexString;
  quoteRecipient: HexString;
  baseRecipient: HexString;
};

export type L1TxDataForTransfer = {
  callType: CallType.Transfer;
  quoteAmount: HexString;
  quoteRecipient: HexString;
  nextContractId: HexString;
  nextContractMethod: HexString;
  fallbackContractId: HexString;
  fallbackContractMethod: HexString;
};
