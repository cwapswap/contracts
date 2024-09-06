import fs from 'node:fs';

import YAML from 'yaml';

import { ContractConfig } from '../src/onchain/types';

export type InstanceConfig = {
  id: string;
  alias: string;
  parameters: ContractConfig;
};

export const contractName = `${process.env['npm_package_name']} v${process.env['npm_package_version']}`;

const configFile = fs.readFileSync('./tests_data/index.yaml', 'utf8');

const config = YAML.parse(configFile);

export const instances = (
  config.contract_templates[contractName]['target_instances'] as {
    instance_id: string;
    alias: string;
    parameters: {
      content: ContractConfig;
    };
  }[]
).map(
  ({ alias, instance_id, parameters }) =>
    ({ alias, id: `0x${instance_id}`, parameters: parameters.content }) satisfies InstanceConfig,
);
