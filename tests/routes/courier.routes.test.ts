import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

describe('courier routes', () => {
  const app = createApp();

  it('lists supported couriers', async () => {
    const response = await request(app).get('/api/v1/couriers');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        supported_couriers: ['mock_courier', 'urbanebolt'],
      },
    });
  });

  it('returns supported status for a courier partner', async () => {
    const response = await request(app).get('/api/v1/couriers/Mock_Courier');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        courier_partner: 'mock_courier',
        supported: true,
      },
    });
  });

  it('returns a normalized error for unknown courier partners', async () => {
    const response = await request(app).get('/api/v1/couriers/delhivery');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'UNKNOWN_COURIER',
        message: 'Unsupported courier partner: delhivery',
        details: {
          supported_couriers: ['mock_courier', 'urbanebolt'],
        },
      },
    });
  });
});
