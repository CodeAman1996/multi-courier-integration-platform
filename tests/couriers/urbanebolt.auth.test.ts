import { describe, expect, it, vi } from 'vitest';

import { UrbaneBoltAuthService } from '../../src/couriers/urbanebolt/urbanebolt.auth.js';
import { InMemoryCourierTokenRepository } from '../../src/repositories/courier-token.repository.js';

describe('UrbaneBoltAuthService', () => {
  it('reuses a valid cached token', async () => {
    const tokenRepository = new InMemoryCourierTokenRepository();
    await tokenRepository.upsert({
      courierPartner: 'urbanebolt',
      accessToken: 'cached-token',
      expiresAt: new Date(Date.now() + 60_000),
    });

    const client = {
      getToken: vi.fn(),
    };
    const auth = new UrbaneBoltAuthService(client as never, tokenRepository);

    await expect(auth.getAccessToken()).resolves.toBe('cached-token');
    expect(client.getToken).not.toHaveBeenCalled();
  });
});
