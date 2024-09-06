import { hexToUint8, uint8ToHex } from '@coinweb/contract-kit';
import { blake3 } from '@noble/hashes/blake3';
import { sha256 } from '@noble/hashes/sha256';
import { binary_to_base58 as binToBase58 } from 'base58-js';

import {
  parseL1TxData,
  HexBigInt,
  PositionStateClaimBody,
  toHex,
  L1TxDataForAccept,
  L1TxDataForTransfer,
} from '../../offchain/shared';
import { L1EventData, L1Types, Logs } from '../types';

import { getInstanceParameters } from './contract';
import { log } from './logger';

export const hashClaimBody = (args: PositionStateClaimBody, nonce?: string) => {
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

const getEvmEventData = (body: unknown) => {
  if (body && typeof body === 'object' && 'data' in body) {
    if (typeof body.data === 'string') {
      return body.data;
    }
  }
};

const btcOutputToAddress = (hex: string) => {
  const addressPrefix = getInstanceParameters(L1Types.Btc).address_prefix;
  let tmp = hex;

  tmp = `${addressPrefix}${tmp}`;
  const hex1 = hexToUint8(tmp);
  const text1 = sha256(hex1);
  const text2 = sha256(text1);
  const address: string = tmp + uint8ToHex(text2).slice(2, 10);
  const hex3 = hexToUint8(address);
  const str = binToBase58(hex3);

  return str;
};

export const parseEvmEventClaimBody = (body: unknown): L1EventData => {
  const data = getEvmEventData(body);

  if (!data) {
    throw new Error('Invalid L1 event data');
  }

  const dataHex = base64ToHex(data);

  /*
  A dynamic type is encoding the following way: In the part dedicated to a 
  given dynamic parameter, the first word will hold the offset where the 
  parameter starts, then at this offset, a first word for the length of the 
  value of the parameter followed by the parameter value encoded on one or 
  more words.
  */
  const l1TxData = parseL1TxData(dataHex.slice(128 + 128)) as L1TxDataForAccept | L1TxDataForTransfer; // ^^^

  return {
    recipient: `0x${dataHex.slice(24, 64)}`,
    paidAmount: `0x${dataHex.slice(64, 128)}`,
    ...l1TxData,
  };
};

const getBtcEventData = (body: unknown) => {
  log('log', 1);
  console.log('console.log', 1);

  type BtcVout = {
    scriptPubKey: {
      asm: string;
    };
  };
  const BTC_TEXT = 'OP_RETURN ';
  const BTC_TEXT_WALLET_START = 'OP_HASH160 ';
  const BTC_TEXT_WALLET_END = ' OP_EQUAL';

  if (body && typeof body === 'object' && 'UtxoBased' in body) {
    if (body.UtxoBased && typeof body.UtxoBased === 'object' && 'vout' in body.UtxoBased) {
      if (Array.isArray(body.UtxoBased.vout)) {
        const dataArray = body.UtxoBased.vout.filter(
          (item): item is BtcVout =>
            item &&
            typeof item === 'object' &&
            item.scriptPubKey &&
            typeof item.scriptPubKey === 'object' &&
            typeof item.scriptPubKey.asm === 'string' &&
            item.scriptPubKey.asm.startsWith(BTC_TEXT),
        );
        let data = '';
        let valueBtc: number;
        let walletBtc = '';
        const vout = body.UtxoBased.vout[body.UtxoBased.vout.length - 2];

        if (vout.scriptPubKey.asm.startsWith(BTC_TEXT)) {
          valueBtc = Number(body.UtxoBased.vout[body.UtxoBased.vout.length - 1].value) * 1e8;
          const outputHash = body.UtxoBased.vout[body.UtxoBased.vout.length - 1].scriptPubKey.asm
            .replace(BTC_TEXT_WALLET_START, '')
            .replace(BTC_TEXT_WALLET_END, '');

          console.log(Logs.Custom, `Hash btc script (1): ${outputHash}`);
          walletBtc = btcOutputToAddress(outputHash);
        } else {
          valueBtc = Number(vout.value) * 1e8;
          const outputHash = body.UtxoBased.vout[body.UtxoBased.vout.length - 1].scriptPubKey.asm
            .replace(BTC_TEXT_WALLET_START, '')
            .replace(BTC_TEXT_WALLET_END, '');

          console.log(Logs.Custom, `Hash btc script (2): ${outputHash}`);
          walletBtc = btcOutputToAddress(outputHash);
        }

        for (let i = 0; i < dataArray.length; i += 1) {
          data = data + dataArray[i]?.scriptPubKey.asm.replace(BTC_TEXT, '');
        }

        const returnData = {
          data,
          value: toHex(BigInt(Math.trunc(valueBtc))),
          wallet: walletBtc,
        };

        log(Logs.Custom, 'Btc Tx data:');
        log(Logs.Custom, returnData);

        return returnData;
      }
    }
  }
};

export const parseBtcEventClaimBody = (body: unknown): L1EventData => {
  const data = getBtcEventData(body);

  if (!data) {
    throw new Error('Invalid L1 event data');
  }

  const l1TxData = parseL1TxData(data.data) as L1TxDataForAccept | L1TxDataForTransfer;

  log('l1TxData', l1TxData);

  return {
    recipient: data.wallet as HexBigInt,
    paidAmount: data.value,
    ...l1TxData,
  };
};

export const parseL1EventClaimBody = (body: unknown): L1EventData => {
  if (getInstanceParameters().l1_type === L1Types.Btc) {
    return parseBtcEventClaimBody(body);
  } else {
    return parseEvmEventClaimBody(body);
  }
};

export const createBestByQuoteIndex = (base: HexBigInt | bigint, quote: HexBigInt | bigint) => {
  return BigInt(Number(base) * 1e18) / BigInt(quote); //TODO! Check this approach
};
