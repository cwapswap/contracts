import { HexBigInt } from '../../../../offchain';

export type ExecutionFallbackArguments = [
  contractId: string,
  methodName: string,
  quoteAmount: HexBigInt,
  quoteWallet: string,
];
