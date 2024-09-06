import { getContextGenesis, getContextSystem, getParameters } from '@coinweb/contract-kit';

import { InstanceParameters, InstanceParametersForBtc, InstanceParametersForEvm, L1Types } from '../types';

const { l2_shard_mining_time: miningTime } = getContextGenesis();

export const getExpectedBlockHeight = (futureDate: number) => {
  const { block_height: currentHeight } = getContextSystem();
  const now = getTime();

  const miningPeriod = miningTime.secs * 1000 + miningTime.nanos / 1_000_000;

  if (now >= futureDate) {
    return currentHeight;
  }

  return currentHeight + Math.trunc((futureDate - now) / miningPeriod);
};

export function getInstanceParameters(l1Type: L1Types.Evm): InstanceParametersForEvm;
export function getInstanceParameters(l1Type: L1Types.Btc): InstanceParametersForBtc;
export function getInstanceParameters(): InstanceParametersForEvm | InstanceParametersForBtc;
export function getInstanceParameters(l1Type?: L1Types) {
  const parameters = getParameters('contract/parameters.json') as InstanceParameters;

  if (l1Type && parameters.l1_type !== l1Type) {
    throw new Error('Internal error: Cannot get instance parameters');
  }

  return parameters;
}

export const getTime = () => {
  const { nanos_since_epoch: nanos, secs_since_epoch: secs } = getContextSystem().block_time;
  const time = secs * 1000 + nanos / 1_000_000;

  return time;
};
