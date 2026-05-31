import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';
import { orderRepository } from '../../src/repositories/order.repository.js';

describe('order routes', () => {
  const app = createApp();

  beforeEach(() => {
    orderRepository.clear();
  });

  it('creates an order shipment with the mock courier', async () => {
    const response = await request(app).post('/api/v1/orders').send({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
      payment_mode: 'COD',
      declared_value: 1200,
      collectable_value: 1200,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Order shipment created successfully',
      data: {
        order_id: 'ORD-1001',
        courier_partner: 'mock_courier',
        courier_order_id: 'MOCK-SHIP-ORD1001',
        awb_number: 'MOCK-AWB-ORD1001',
        status: 'CREATED',
        payment_mode: 'COD',
      },
    });
  });

  it('rejects invalid create order payloads', async () => {
    const response = await request(app).post('/api/v1/orders').send({
      courier_partner: 'mock_courier',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: [
          {
            field: 'order_id',
            message: 'order_id is required',
          },
        ],
      },
    });
  });

  it('rejects unknown courier partners', async () => {
    const response = await request(app).post('/api/v1/orders').send({
      order_id: 'ORD-1001',
      courier_partner: 'delhivery',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'UNKNOWN_COURIER',
        message: 'Unsupported courier partner: delhivery',
        details: {
          supported_couriers: ['mock_courier'],
        },
      },
    });
  });

  it('prevents duplicate order creation', async () => {
    const payload = {
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
    };

    await request(app).post('/api/v1/orders').send(payload);
    const response = await request(app).post('/api/v1/orders').send(payload);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'ORDER_ALREADY_EXISTS',
        message: 'Order already exists: ORD-1001',
      },
    });
  });

  it('tracks an existing order shipment', async () => {
    await request(app).post('/api/v1/orders').send({
      order_id: 'ORD-1001',
      courier_partner: 'mock_courier',
    });

    const response = await request(app).get('/api/v1/orders/ORD-1001/track');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        order_id: 'ORD-1001',
        courier_partner: 'mock_courier',
        awb_number: 'MOCK-AWB-ORD1001',
        status: 'IN_TRANSIT',
      },
    });
    expect(response.body.data.history).toHaveLength(2);
  });

  it('returns not found when tracking an unknown order', async () => {
    const response = await request(app).get('/api/v1/orders/UNKNOWN/track');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Order not found: UNKNOWN',
      },
    });
  });
});
