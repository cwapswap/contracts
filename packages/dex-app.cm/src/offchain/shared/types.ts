import { HexString } from '@coinweb/contract-kit';

import { ACTIVITY_STATUS, CallType, PAYMENT_STATUS } from './constants';

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
};

export type PositionFundsClaimBody = {
  owner?: PubKey;
  baseAmount: HexBigInt;
  quoteAmount: HexBigInt;
};

export type ChainData = unknown;

export type BtcChainData = {
  l1TxId: string;
  vout: string;
  psbt: string;
};

export type L1TxDataForAccept = {
  callType: CallType.Accept;
  baseRecipient: HexString;
  quoteAmount: HexString;
  quoteRecipient: HexString;
};

export type L1TxDataForTransfer = {
  callType: CallType.Transfer;
  nextContractId: HexString;
  nextContractMethod: HexString;
  quoteAmount: HexString;
  quoteRecipient: HexString;
};
