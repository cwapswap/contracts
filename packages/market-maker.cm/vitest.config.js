import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        reporters: 'default',
        silent: false,
        testTimeout: 240000,
        teardownTimeout: 240000,
        hookTimeout: 240000,
        pool: 'forks',
    },
});
