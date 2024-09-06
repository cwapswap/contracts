import { Claim, HexString, OrdJson, Shard } from '@coinweb/contract-kit';

import { HexBigInt, L1TxDataForAccept, L1TxDataForTransfer } from '../offchain/shared';

export type EvmEventClaimBody = {
  data: string;
};

export type BtcEventClaimBody = {
  UtxoBased: {
    vout: {
      scriptPubKey: {
        asm: string;
      };
    }[];
  };
};

export type CallContractData = {
  l2Contract: string;
  l2MethodName: string;
  l2Args: unknown[];
};

export type L1EventData = {
  recipient: HexBigInt;
  paidAmount: HexBigInt;
} & (L1TxDataForAccept | L1TxDataForTransfer);

export enum L1Types {
  Evm,
  Btc,
}

export enum Logs {
  MethodName = 'method-name',
  ProvidedCweb = 'provided-cweb',
  MethodArgument = 'method-args',
  ContractArguments = 'contract-args',
  Custom = 'custom',
}

export type InstanceParameters = {
  l1_type: L1Types;
  l1_contract_address?: string;
  shard: Shard;
  owner: string;
  logs?: Logs[];
  owner_min_fee?: HexString;
  owner_percentage_fee?: number;
};

export type InstanceParametersForEvm = {
  l1_type: L1Types.Evm;
  l1_contract_address: string;
} & Omit<InstanceParameters, 'l1_type' | 'l1_contract_address'>;

export type InstanceParametersForBtc = {
  l1_type: L1Types.Btc;
  address_prefix: string;
} & Omit<InstanceParameters, 'l1_type' | 'l1_contract_address'>;

export type OwnerClaimBody = {
  owner: string;
  updatedAt: number;
};

export type TypedClaim<T extends OrdJson | null> = Claim & {
  body: T;
  fees_stored: HexBigInt;
};
