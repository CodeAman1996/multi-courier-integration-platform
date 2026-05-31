import { beforeEach, describe, expect, it } from 'vitest';

import {
  DuplicateOrderError,
  OrderNotFoundError,
  orderService,
} from '../../src/services/order.service.js';
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

  it('tracks an existing order through the configured courier adapter', async () => {
    await orderService.createOrder({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
    });

    const tracking = await orderService.trackOrder('ORD-1001');

    expect(tracking).toMatchObject({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
      awb_number: 'MOCK-AWB-ORD1001',
      status: 'IN_TRANSIT',
    });
    expect(tracking.history).toHaveLength(2);
  });

  it('throws not found when tracking an unknown order', async () => {
    await expect(orderService.trackOrder('UNKNOWN')).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('cancels an existing order through the configured courier adapter', async () => {
    await orderService.createOrder({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
    });

    const cancellation = await orderService.cancelOrder('ORD-1001');

    expect(cancellation).toEqual({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
      awb_number: 'MOCK-AWB-ORD1001',
      status: 'CANCELLED',
      cancelled: true,
    });

    const storedOrder = await orderRepository.findByOrderId('ORD-1001');
    expect(storedOrder?.status).toBe('CANCELLED');
  });

  it('throws not found when cancelling an unknown order', async () => {
    await expect(orderService.cancelOrder('UNKNOWN')).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('bulk creates orders and returns a summary', async () => {
    const result = await orderService.bulkCreateOrders({
      orders: [
        {
          order_id: 'ORD-1001',
          courier_partner: 'mock_courier',
        },
        {
          order_id: 'ORD-1002',
          courier_partner: 'mock_courier',
        },
      ],
    });

    expect(result).toMatchObject({
      total: 2,
      success: 2,
      failed: 0,
    });
    expect(result.results).toHaveLength(2);
  });

  it('handles duplicate order ids inside a bulk payload', async () => {
    const result = await orderService.bulkCreateOrders({
      orders: [
        {
          order_id: 'ORD-1001',
          courier_partner: 'mock_courier',
        },
        {
          order_id: 'ORD-1001',
          courier_partner: 'mock_courier',
        },
      ],
    });

    expect(result).toMatchObject({
      total: 2,
      success: 1,
      failed: 1,
    });
    expect(result.results[1]).toEqual({
      order_id: 'ORD-1001',
      success: false,
      error: {
        code: 'DUPLICATE_ORDER_IN_BATCH',
        message: 'Duplicate order in batch: ORD-1001',
      },
    });
  });
});
