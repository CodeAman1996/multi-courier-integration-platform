import { describe, expect, it } from 'vitest';

import { mockCourierAdapter } from '../../src/couriers/mock-courier/mock-courier.adapter.js';

describe('mockCourierAdapter', () => {
  it('creates deterministic mock shipment details', async () => {
    const result = await mockCourierAdapter.createShipment({
      orderId: 'ORD-1001',
      courierPartner: 'mock_courier',
      rawPayload: {},
    });

    expect(result).toMatchObject({
      courierPartner: 'mock_courier',
      courierOrderId: 'MOCK-SHIP-ORD1001',
      awbNumber: 'MOCK-AWB-ORD1001',
      status: 'CREATED',
    });
  });

  it('returns mock tracking history', async () => {
    const result = await mockCourierAdapter.trackShipment({
      orderId: 'ORD-1001',
      awbNumber: 'MOCK-AWB-ORD1001',
    });

    expect(result.status).toBe('IN_TRANSIT');
    expect(result.history).toHaveLength(2);
  });

  it('cancels a mock shipment', async () => {
    const result = await mockCourierAdapter.cancelShipment({
      orderId: 'ORD-1001',
      awbNumber: 'MOCK-AWB-ORD1001',
    });

    expect(result).toMatchObject({
      status: 'CANCELLED',
      cancelled: true,
    });
  });
});
