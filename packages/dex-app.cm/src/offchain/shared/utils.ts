import { HexBigInt } from './types';

export const toHex = (amount: number | bigint) => {
  const hex = amount.toString(16);

  return '0x'.concat('0'.repeat(64 - hex.length)).concat(hex) as HexBigInt;
};
