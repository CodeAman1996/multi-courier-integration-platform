import { beforeEach, describe, expect, it } from 'vitest';

import { DuplicateOrderError, orderService } from '../../src/services/order.service.js';
import { orderRepository } from '../../src/repositories/order.repository.js';

describe('OrderService', () => {
  beforeEach(() => {
    orderRepository.clear();
  });

  it('creates an order through the configured courier adapter', async () => {
    const order = await orderService.createOrder({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
      payment_mode: 'PREPAID',
    });

    expect(order).toMatchObject({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
      courier_order_id: 'MOCK-SHIP-ORD1001',
      awb_number: 'MOCK-AWB-ORD1001',
      status: 'CREATED',
      payment_mode: 'PREPAID',
    });
  });

  it('throws a duplicate order error for an existing order_id', async () => {
    const payload = {
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
    };

    await orderService.createOrder(payload);

    await expect(orderService.createOrder(payload)).rejects.toBeInstanceOf(DuplicateOrderError);
  });
});
