import { CreateOrderArguments, HexBigInt } from '../../../offchain/shared';

export type PrepareSeedPrivateArguments = [
  minBase: HexBigInt,
  maxBase: HexBigInt,
  minQuote: HexBigInt,
  maxQuote: HexBigInt,
];
export type SeedOrdersPrivateArguments = CreateOrderArguments[];
