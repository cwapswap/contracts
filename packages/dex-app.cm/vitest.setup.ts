import { vi } from 'vitest';

vi.mock('@coinweb/contract-kit', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    getContextGenesis: vi.fn(() => ({
      l2_shard_mining_time: { secs: 1, nanos: 0 },
    })),
    getContextSystem: vi.fn(() => ({
      block_height: 100,
      block_time: { secs_since_epoch: 1600000000, nanos_since_epoch: 0 },
    })),
    getParameters: vi.fn(),
    sendCwebInterface: vi.fn(() => ({
      constructSendCweb: vi.fn(),
    })),
  };
});
