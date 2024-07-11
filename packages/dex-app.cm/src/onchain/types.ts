import { Claim, HexString, OrdJson } from '@coinweb/contract-kit';

import { HexBigInt } from '../offchain/shared';

export type L1EventClaimBody = {
  data: string;
};

export type CallContractData = {
  l2Contract: string;
  l2MethodName: string;
  transferQuoteAmount: HexBigInt;
  l1RecipientAddress: string;
  contractOwnerFee: bigint;
  callFee: bigint;
};

export type L1EventData = {
  recipient: HexBigInt;
  paidAmount: HexBigInt;
  cwebAddress: string;
  callContractData: CallContractData;
};

export type ContractConfig = {
  l1_contract_address: string;
  owner: string;
  owner_min_fee?: HexString;
  owner_percentage_fee?: number;
};

export type OwnerClaimBody = {
  owner: string;
  updatedAt: number;
};

export type TypedClaim<T extends OrdJson | null> = Claim & {
  body: T;
  fees_stored: HexBigInt;
};
