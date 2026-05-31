import { describe, expect, it, vi } from 'vitest';

import type { CourierAdapter } from '../../src/couriers/courier-adapter.js';
import { CourierRegistry, UnknownCourierError } from '../../src/couriers/courier-registry.js';

function createAdapter(partnerCode: string): CourierAdapter {
  return {
    partnerCode,
    createShipment: vi.fn(),
    trackShipment: vi.fn(),
    cancelShipment: vi.fn(),
  };
}

describe('CourierRegistry', () => {
  it('registers and resolves adapters by normalized partner code', () => {
    const registry = new CourierRegistry();
    const adapter = createAdapter('UrbaneBolt');

    registry.register(adapter);

    expect(registry.get(' urbanebolt ')).toMatchObject({
      partnerCode: 'urbanebolt',
    });
  });

  it('returns supported couriers in sorted order', () => {
    const registry = new CourierRegistry();

    registry.register(createAdapter('mock_courier'));
    registry.register(createAdapter('urbanebolt'));

    expect(registry.listSupportedCouriers()).toEqual(['mock_courier', 'urbanebolt']);
  });

  it('throws a normalized unknown courier error for unsupported partners', () => {
    const registry = new CourierRegistry();
    registry.register(createAdapter('urbanebolt'));

    expect(() => registry.get('delhivery')).toThrow(UnknownCourierError);

    try {
      registry.get('delhivery');
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        code: 'UNKNOWN_COURIER',
        courierPartner: 'delhivery',
        supportedCouriers: ['urbanebolt'],
      });
    }
  });
});
