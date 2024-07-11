import { getContextGenesis, getContextSystem } from '@coinweb/contract-kit';

const { l2_shard_mining_time: miningTime } = getContextGenesis();

export const getExpectedBlockHeight = (futureDate: number) => {
  const { block_height: currentHeight } = getContextSystem();
  const now = Date.now();

  const miningPeriod = miningTime.secs * 1000 + miningTime.nanos / 1_000_000;

  if (now >= futureDate) {
    return currentHeight;
  }

  return currentHeight + Math.trunc((futureDate - now) / miningPeriod);
};
