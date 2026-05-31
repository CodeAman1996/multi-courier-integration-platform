import { describe, expect, it } from 'vitest';

import {
  CourierApiError,
  isRetryableCourierError,
  mapUrbaneBoltError,
} from '../../src/couriers/urbanebolt/urbanebolt.error-mapper.js';

describe('UrbaneBolt error mapper', () => {
  it('maps auth errors', () => {
    const error = mapUrbaneBoltError(401, { detail: 'expired' });

    expect(error).toBeInstanceOf(CourierApiError);
    expect(error).toMatchObject({
      code: 'COURIER_AUTH_FAILED',
      statusCode: 401,
    });
  });

  it('maps validation and retryable courier failures', () => {
    expect(mapUrbaneBoltError(400, {})).toMatchObject({
      code: 'COURIER_VALIDATION_FAILED',
    });

    const error = mapUrbaneBoltError(503, {});
    expect(error).toMatchObject({
      code: 'COURIER_UNAVAILABLE',
    });
    expect(isRetryableCourierError(error)).toBe(true);
  });
});
