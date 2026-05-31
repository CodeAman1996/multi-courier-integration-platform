import type { Request, Response } from 'express';

import { UnknownCourierError } from '../couriers/courier-registry.js';
import { errorResponse, successResponse } from '../helpers/response.helper.js';
import { RequestValidationError, validateCreateOrder } from '../helpers/validation.helper.js';
import { DuplicateOrderError, orderService } from '../services/order.service.js';

export async function createOrder(req: Request, res: Response) {
  try {
    const payload = validateCreateOrder(req.body);
    const order = await orderService.createOrder(payload);

    return successResponse(
      res,
      {
        message: 'Order shipment created successfully',
        statusCode: 201,
        data: order,
      },
      201,
    );
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof UnknownCourierError) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: {
          supported_couriers: error.supportedCouriers,
        },
      });
    }

    if (error instanceof DuplicateOrderError) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
      });
    }

    return errorResponse(res, {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    });
  }
}
