import { Claim, ClaimKey, HexString, OrdJson, Shard, User } from '@coinweb/contract-kit';

import { HexBigInt } from '../offchain/shared';

export type L1EventClaimBody = {
  data: string;
};

export type L1EventData = {
  paidAmount: HexBigInt;
  recipient: string;
};

export enum Logs {
  MethodName = 'method-name',
  ProvidedCweb = 'provided-cweb',
  MethodArgument = 'method-args',
  ContractArguments = 'contract-args',
  Custom = 'custom',
}

export type InstanceParameters = {
  l1_contract_address: string;
  owner: User;
  collateral_percentage_Int: number;
  logs?: Logs[];
  owner_min_fee_Hex?: HexString;
  owner_percentage_fee_Int?: number;
  shard: Shard;
};

export type ContractOwnerClaimBody = {
  owner: User;
  updatedAt: number;
};

export type TypedClaim<TBody extends OrdJson | null, TKey extends ClaimKey = ClaimKey> = Claim & {
  body: TBody;
  fees_stored: HexBigInt;
  key: TKey;
};
