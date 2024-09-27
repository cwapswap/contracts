import fs from 'node:fs';

import YAML from 'yaml';

import { CallType, createL1TxData, toHex, uint8ArrayToHexStr } from '../src/offchain';
import { InstanceParameters } from '../src/onchain/types';

export type InstanceConfig = {
  id: string;
  alias: string;
  parameters: InstanceParameters;
};

export const dexAppContractName = 'dex-app.cm v0.0.9';
export const marketMakerContractName = 'market-maker.cm v0.0.10';

const configFile = fs.readFileSync('./tests_data/index.yaml', 'utf8');
const config = YAML.parse(configFile);

export const instances = (template: string): InstanceConfig[] => {
  return (
    config.contract_templates[template]['target_instances'] as {
      instance_id: string;
      alias: string;
      parameters: {
        content: InstanceParameters;
      };
    }[]
  ).map(
    ({ alias, instance_id, parameters }) =>
      ({ alias, id: `0x${instance_id}`, parameters: parameters.content }) satisfies InstanceConfig,
  );
};

function hexToBase64(str: string) {
  return btoa(
    String.fromCharCode.apply(
      null,
      str
        .replace(/\r|\n/g, '')
        .replace(/([\da-fA-F]{2}) ?/g, '0x$1 ')
        .replace(/ +$/, '')
        .split(' ')
        .map(Number),
    ),
  );
}

export type SwapData = {
  cwebWallet?: string;
  recipient: string;
  amount: bigint;
  nextContractId: string;
  nextContractMethod: string;
  fallbackContractId: string;
  fallbackContractMethod: string;
  quoteRecipient: string;
  quoteAmount: bigint;
};

export const constructEvmEventForC1 = ({
  amount,
  nextContractId,
  nextContractMethod,
  fallbackContractId,
  fallbackContractMethod,
  quoteAmount,
  quoteRecipient,
  recipient,
}: SwapData) => {
  const to64LengthHex = (amount: number | bigint | string) => {
    let hex: string;

    if (typeof amount === 'string') {
      if (amount.slice(0, 2) === '0x') {
        hex = amount.slice(2);
      } else {
        hex = amount;
      }
    } else {
      hex = amount.toString(16);
    }

    return '0'.repeat(64 - hex.length).concat(hex);
  };
  const recipientStringData = to64LengthHex(recipient);
  const amountStringData = to64LengthHex(amount);
  const eventData =
    recipientStringData +
    amountStringData +
    '0'.repeat(128) +
    uint8ArrayToHexStr(
      createL1TxData({
        callType: CallType.Transfer,
        quoteAmount: toHex(quoteAmount),
        quoteRecipient,
        nextContractId,
        nextContractMethod,
        fallbackContractId,
        fallbackContractMethod,
      }),
    ).slice(2);

  return hexToBase64(eventData);
};
