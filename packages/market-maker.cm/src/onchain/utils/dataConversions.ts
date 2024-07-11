import { uint8ToHex } from '@coinweb/contract-kit';
import { blake3 } from '@noble/hashes/blake3';

import { HexBigInt } from '../../offchain/shared';
import { L1EventData } from '../types';

export const hashObject = (args: Record<string, unknown>, nonce?: string) => {
  let argsString = Object.entries(args)
    .map(([key, value]) => [key, String(value)].join(':'))
    .sort()
    .join('#');

  if (nonce) {
    argsString = argsString + `#nonce:${nonce}`;
  }

  return uint8ToHex(blake3(argsString));
};

const base64decode = (data: string) => {
  const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  const string = data + '=='.slice(2 - (data.length & 3));

  let bitmap;
  let result = '';
  let r1;
  let r2;
  let i = 0;

  for (; i < string.length; ) {
    bitmap =
      (b64.indexOf(string.charAt(i++)) << 18) |
      (b64.indexOf(string.charAt(i++)) << 12) |
      ((r1 = b64.indexOf(string.charAt(i++))) << 6) |
      (r2 = b64.indexOf(string.charAt(i++)));

    result +=
      r1 === 64
        ? String.fromCharCode((bitmap >> 16) & 255)
        : r2 === 64
          ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255)
          : String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255, bitmap & 255);
  }

  return result;
};

const base64ToHex = (textData: string) => {
  textData = base64decode(textData);

  const data = new Uint8Array(textData.length);

  for (let i = 0; i < textData.length; i++) {
    data[i] = textData.charCodeAt(i);
  }

  return Array.from(data)
    .map((i) => {
      return ('0' + i.toString(16)).slice(-2);
    })
    .join('');
};

export const parseL1EventData = (data: string): L1EventData => {
  const dataHex = base64ToHex(data);

  return {
    recipient: `0x${dataHex.slice(24, 64)}`,
    paidAmount: `0x${dataHex.slice(64, 128)}`,
  };
};

export const createRateIndex = (base: HexBigInt | bigint, quote: HexBigInt | bigint) => {
  return (BigInt(quote) * BigInt(1e18)) / BigInt(base); //TODO! Check this approach
};
