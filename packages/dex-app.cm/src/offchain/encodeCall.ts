enum DataType {
  Hex = '00',
  Str = '01',
}

const binaryStrNumToFixed8 = (binaryStr: string) => `00000000${binaryStr}`.slice(-8);

const intToFixed8bin = (num: number) => `00000000${BigInt(num).toString(2)}`.slice(-8);

const stringToBin8 = (str: string) =>
  str
    .split('')
    .map((char) => binaryStrNumToFixed8(char.charCodeAt(0).toString(2)))
    .join('');

const bin8ToStr = (binStr: string) => {
  let result = '';

  for (let index = 0; index < binStr.length; index += 8) {
    result += String.fromCharCode(parseInt(binStr.slice(index, index + 8), 2));
  }

  return result;
};

const anyStringToBin = (anyStr: string) => {
  if (/^0x[0-9A-Fa-f]+/.test(anyStr)) {
    return [DataType.Hex, BigInt(anyStr).toString(2)];
  }

  return [DataType.Str, stringToBin8(anyStr)];
};

export const encodeArgs = (...args: string[]) => {
  const numOfArgs = intToFixed8bin(args.length);

  if (numOfArgs[0] === '1') {
    throw new Error('Too many arguments');
  }

  const preparedData = args.reduce(
    (result, item) => {
      const [dataType, data] = anyStringToBin(item);

      return [
        [...result[0], dataType, intToFixed8bin(Math.trunc(data.length / 256)), intToFixed8bin(data.length % 256)],
        [...result[1], data],
      ];
    },
    [[], []] as string[][],
  );

  return [`1${numOfArgs.slice(1)}`, ...preparedData[0], ...preparedData[1]].join('');
};

export const encodeContractCall = ({
  contractAddress,
  methodName,
  args,
}: {
  contractAddress: string;
  methodName: string;
  args: string[];
}) => {
  return encodeArgs(contractAddress, methodName, ...args);
};

export const binaryToHex = (binaryStr: string) => {
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

export const decodeData = (hexData: string) => {
  const binData = BigInt(hexData).toString(2);

  const decodedData: string[][] = [];
  let offset = 0;

  while (binData.length > offset) {
    const numOfItems = parseInt(binData.slice(offset + 1, offset + 8), 2);

    if (!numOfItems) {
      break;
    }

    const decodedItems: string[] = [];
    let currentOffset = offset + 8 + numOfItems * 18;

    for (let index = 0; index < numOfItems; index++) {
      const pointerOffset = offset + 8 + index * 18;
      const dataType = binData.slice(pointerOffset, pointerOffset + 2);

      const sliceLength =
        parseInt(binData.slice(pointerOffset + 2, pointerOffset + 10), 2) * 256 +
        parseInt(binData.slice(pointerOffset + 10, pointerOffset + 18), 2);

      const slice = binData.slice(currentOffset, currentOffset + sliceLength);

      switch (dataType) {
        case DataType.Hex:
          decodedItems.push(binaryToHex(slice));
          break;
        case DataType.Str:
          decodedItems.push(bin8ToStr(slice));
          break;
        default:
          break;
      }

      currentOffset += sliceLength;
    }

    decodedData.push(decodedItems);
    offset = currentOffset;
  }

  return decodedData;
};
