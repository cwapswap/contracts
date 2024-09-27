import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

const BaseContractTemplate = 'dex-app.cm';
const MarketMakerContractTemplate = 'market-maker.cm';

const ParamsPatternMatching = [
  ['VITE_L2_OWNER_MIN_FEE', 'owner_min_fee'],
  ['VITE_L2_OWNER_PERCENTAGE_FEE', 'owner_percentage_fee'],
  ['VITE_L1_CONTRACT_ADDRESS', 'l1_contract_address']
];

const ContractIdPattern = 'VITE_L2_CONTRACT_ADDRESS';

const TemplatePatternMatching = [
  ['BASE', BaseContractTemplate],
  ['MAKER', MarketMakerContractTemplate]
];


const Variants = [['eth'], ['bnb'], ['btc'], ['eth', 'usdt'], ['bnb', 'usdt']]

function isMatch(value, pattern) {
  return value.toLowerCase().includes(pattern.toLowerCase());
}

function updateValue(line, value) {
  let startIndex = line.indexOf('=') + 1;

  const startQuote = [`'`, '"'].find((quote) => line[startIndex] === quote);

  if (startQuote) {
    startIndex += 1;
  }

  const dividerIndex = line.indexOf(startQuote ?? ' ', startIndex);
  const endIndex = dividerIndex > startIndex ? dividerIndex : line.length;
  
  if (startIndex === 0 || endIndex === -1) {
    return line;
  }
  
  const addQuotes = !startQuote && typeof value === 'string' ? `'` : '';

  return line.slice(0, startIndex) + addQuotes + value + addQuotes + line.slice(endIndex);
}

function updateLine (line, parameters, index) {
  const templatePattern = TemplatePatternMatching.find(([pattern]) => isMatch(line, pattern));
  const variant = Variants
    .filter((variant) => variant.every((pattern) => isMatch(line, pattern)))
    .sort(({length: a}, {length: b}) => a < b ? 1 : -1)[0];
  

  if (!templatePattern || !variant) {
    return line;
  }

  const paramPattern = ParamsPatternMatching.find(([pattern]) => isMatch(line, pattern));

  if (paramPattern) {
    const instanceParameters = parameters.find(
      ({alias, template}) => isMatch(template, templatePattern[1])
        && variant.every((pattern) => isMatch(alias, pattern))
    );

    if (instanceParameters) {
      const value = Object.entries(instanceParameters.parameters.content).find(([name]) => isMatch(name, paramPattern[1]))?.[1];
      
      if (value !== undefined) {
        return updateValue(line, value)
      }
    }
  }

  if (isMatch(line, ContractIdPattern)) {
    const instances = Object.entries(index).find(([name]) => isMatch(name, templatePattern[1]))?.[1].target_instances;

    if (instances?.length) {
      const contractId = instances.find(
        ({alias}) => variant.every((pattern) => isMatch(alias, pattern))
      )?.instance_id;

      
      
      if (contractId !== undefined) {
        return updateValue(line, '0x' + contractId)
      }
    }
  }

  return line;
}

void function () {
  try {
    const { '--env': envFileName } = Object.fromEntries([
      (process.argv[2] ?? '').split('='),
    ]);

    const profilePath = path.resolve('.env.yarn');
    const profile = fs.readFileSync(profilePath, 'utf-8')?.split('\n').find(line => line.startsWith('REGISTRATION_PROFILE'))?.split('=')[1];
    if (!profile) {
      throw new Error('"REGISTRATION_PROFILE" in .env.yarn is not defined');
    }

    const configPath = path.resolve('.cweb-config/config.yaml');
    const configFile = fs.readFileSync(configPath, 'utf8');
    const config = YAML.parse(configFile)[profile];
    if (!config) {
      throw new Error('Cannot find config for profile', profile);
    }

    const indexPath = path.resolve(config.pathToLockIndexFile);
    const indexFile = fs.readFileSync(indexPath, 'utf8');
    const index = YAML.parse(indexFile)?.contract_templates;

    if (!index) {
      throw new Error('Cannot find lockfile or contract instances', profile);
    }

    const parametersPath = path.resolve(config.pathToIndexFile);
    const parametersFile = fs.readFileSync(parametersPath, 'utf8');
    const parameters = YAML.parse(parametersFile)?.contract_instances;
    if (!parameters) {
      throw new Error('Cannot find config for profile', profile);
    }

    const envFilePath = path.resolve('packages/dapp-ui', envFileName);
    
    const env = fs.readFileSync(envFilePath, 'utf-8');
    if (!env) {
      console.error('Env file is not found in', envFilePath);
      process.exit(2);
    }

    const updatedEnv = env.split('\n').map((line) => updateLine(line, parameters, index)).join('\n');

    fs.writeFileSync(envFilePath, updatedEnv, 'utf-8');
    console.log('\x1b[35m%s\x1b[0m', 'Done!');
  } catch (error) {
    console.log('\x1b[31m%s\x1b[0m', error.message);
    process.exit(2);
  }
}()
