import { HexString } from '@coinweb/contract-kit';

import { CallType, L1TxDataForAccept, L1TxDataForTransfer } from './shared';

const AMOUNT_BYTE_LENGTH = 16;

const hexToUint8Array = (value: HexString): Uint8Array => {
  const hex = value.slice(0, 2).toLowerCase() === '0x' ? value.slice(2) : value;
  const valueByteLength = Math.ceil(hex.length / 2);

  const u8array = new Uint8Array(valueByteLength);

  for (let i = 0; i < valueByteLength; i++) {
    u8array[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  return u8array;
};

const numberToOneByteUint8Array = (value: number): Uint8Array => {
  const u8array = hexToUint8Array(value.toString(16));

  if (u8array.byteLength > 1) {
    throw Error('Too large number');
  }

  return hexToUint8Array(value.toString(16));
};

const bin8StringToNumber = (binString: string): number => {
  if (binString.length !== 8) {
    throw new Error('Invalid string to convert to number');
  }

  return parseInt(binString, 2);
};

const binStringToHex = (binaryStr: string) => {
  let hex = '';
  const hexDigits = '0123456789abcdef';

  const preparedStr = `${Array((4 - (binaryStr.length % 4)) % 4)
    .fill('0')
    .join('')}${binaryStr}`;

  for (let i = 0; i < preparedStr.length; i += 4) {
    const chunk = preparedStr.slice(i, i + 4);
    const decimal = parseInt(chunk, 2);

    hex += hexDigits[decimal];
  }

  return `0x${hex.length % 2 ? `0${hex}` : hex}`;
};

const validateMaxAmount = (amount: HexString) => hexToUint8Array(amount).byteLength <= AMOUNT_BYTE_LENGTH;

export const createL1TxData = (params: L1TxDataForAccept | L1TxDataForTransfer) => {
  const quoteAmountHex = BigInt(params.quoteAmount).toString(16);

  if (!validateMaxAmount(quoteAmountHex)) {
    throw Error('Too large amount');
  }

  const callType = numberToOneByteUint8Array(params.callType);
  const quoteAmount = hexToUint8Array(quoteAmountHex);

  const quoteRecipient = hexToUint8Array(params.quoteRecipient);

  const results = [
    ...callType,
    ...numberToOneByteUint8Array(quoteAmount.byteLength),
    ...quoteAmount,
    ...numberToOneByteUint8Array(quoteRecipient.byteLength),
    ...quoteRecipient,
  ];

  if (params.callType === CallType.Accept) {
    const baseRecipient = hexToUint8Array(params.baseRecipient);

    results.push(...numberToOneByteUint8Array(baseRecipient.byteLength), ...baseRecipient);
  }

  if (params.callType === CallType.Transfer) {
    const nextContractId = hexToUint8Array(params.nextContractId);
    const nextContractMethod = hexToUint8Array(params.nextContractMethod);

    results.push(...numberToOneByteUint8Array(nextContractId.byteLength), ...nextContractId, ...nextContractMethod);
  }

  return new Uint8Array(results);
};

export const parseL1TxData = <TCallType extends CallType>(hexData: HexString) => {
  const hex = hexData.slice(0, 2).toLowerCase() === '0x' ? hexData : `0x${hexData}`;

  const binString = BigInt(hex).toString(2);

  let offset = 0;

  const sliceNext = (length: number) => {
    const slice = binString.slice(offset, (offset += length));

    return slice;
  };

  const sliceNextParam = () => {
    const paramLength = bin8StringToNumber(sliceNext(8));

    return binStringToHex(sliceNext(paramLength * 8));
  };

  const result = {} as TCallType extends CallType.Accept
    ? L1TxDataForAccept
    : TCallType extends CallType.Transfer
      ? L1TxDataForTransfer
      : L1TxDataForAccept | L1TxDataForTransfer;

  result.callType = bin8StringToNumber(sliceNext(8)) as CallType;

  result.quoteAmount = sliceNextParam();

  result.quoteRecipient = sliceNextParam();

  if (result.callType === CallType.Accept) {
    result.baseRecipient = sliceNextParam();
  }

  if (result.callType === CallType.Transfer) {
    result.nextContractId = sliceNextParam();

    result.nextContractMethod = binStringToHex(sliceNext(8));
  }

  return result;
};

export const uint8ArrayToHexStr = (uint8: Uint8Array) => {
  return `0x${Array.from(uint8)
    .map((i) => i.toString(16).padStart(2, '0'))
    .join('')}`;
};
