import { describe, expect, it, vi } from 'vitest';

import { UrbaneBoltAdapter } from '../../src/couriers/urbanebolt/urbanebolt.adapter.js';
import { CourierApiError } from '../../src/couriers/urbanebolt/urbanebolt.error-mapper.js';

describe('UrbaneBoltAdapter', () => {
  it('refreshes auth token and retries once when the courier rejects the token', async () => {
    const client = {
      trackShipment: vi
        .fn()
        .mockRejectedValueOnce(new CourierApiError('COURIER_AUTH_FAILED', 'expired token', 401))
        .mockResolvedValueOnce({
          status: 'IN_TRANSIT',
          history: [],
        }),
    };
    const auth = {
      getAccessToken: vi.fn().mockResolvedValueOnce('expired-token').mockResolvedValueOnce('fresh-token'),
    };
    const adapter = new UrbaneBoltAdapter(client as never, auth as never);

    await expect(
      adapter.trackShipment({
        orderId: 'ORD-1001',
        awbNumber: 'AWB-1001',
      }),
    ).resolves.toMatchObject({
      status: 'IN_TRANSIT',
    });

    expect(auth.getAccessToken).toHaveBeenNthCalledWith(1);
    expect(auth.getAccessToken).toHaveBeenNthCalledWith(2, true);
    expect(client.trackShipment).toHaveBeenNthCalledWith(1, 'expired-token', 'AWB-1001');
    expect(client.trackShipment).toHaveBeenNthCalledWith(2, 'fresh-token', 'AWB-1001');
  });
});
