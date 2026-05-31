import Joi from 'joi';
import { describe, expect, it } from 'vitest';

import {
  RequestValidationError,
  validateBulkCreateOrders,
  validateCourierPartner,
  validatePayload,
} from '../../src/helpers/validation.helper.js';

describe('validation helper', () => {
  it('validates and strips unknown fields from payloads', () => {
    const schema = Joi.object({
      order_id: Joi.string().required(),
    });

    const value = validatePayload(schema, {
      order_id: 'ORD-1',
      extra: 'ignored',
    });

    expect(value).toEqual({
      order_id: 'ORD-1',
    });
  });

  it('throws field-level validation errors', () => {
    const schema = Joi.object({
      order_id: Joi.string().required(),
    });

    expect(() => validatePayload(schema, {})).toThrow(RequestValidationError);

    try {
      validatePayload(schema, {});
    } catch (error) {
      expect(error).toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        details: [
          {
            field: 'order_id',
            message: 'order_id is required',
          },
        ],
      });
    }
  });

  it('validates supported courier partners case-insensitively', () => {
    const partnerCode = validateCourierPartner(' UrbaneBolt ', ['urbanebolt', 'mock_courier']);

    expect(partnerCode).toBe('urbanebolt');
  });

  it('rejects unsupported courier partners with a clear message', () => {
    expect(() => validateCourierPartner('delhivery', ['urbanebolt'])).toThrow(
      RequestValidationError,
    );
  });

  it('validates a bulk create order payload', () => {
    const payload = validateBulkCreateOrders({
      orders: [
        {
          order_id: 'ORD-1',
          courier_partner: 'MOCK_COURIER',
        },
      ],
    });

    expect(payload).toEqual({
      orders: [
        {
          order_id: 'ORD-1',
          courier_partner: 'mock_courier',
        },
      ],
    });
  });

  it('rejects bulk payloads over 100 orders', () => {
    expect(() =>
      validateBulkCreateOrders({
        orders: Array.from({ length: 101 }, (_, index) => ({
          order_id: `ORD-${index}`,
          courier_partner: 'mock_courier',
        })),
      }),
    ).toThrow(RequestValidationError);
  });
});
