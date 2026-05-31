import { describe, expect, it, vi } from 'vitest';

import { retry } from '../../src/utils/retry.js';

describe('retry', () => {
  it('retries failed operations before succeeding', async () => {
    const operation = vi
      .fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce('ok');

    await expect(
      retry({
        operation,
        retries: 1,
        delayMs: 0,
      }),
    ).resolves.toBe('ok');
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
