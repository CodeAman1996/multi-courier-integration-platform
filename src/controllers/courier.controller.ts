import type { Request, Response } from 'express';

import { courierRegistry } from '../couriers/courier-registry.instance.js';
import { UnknownCourierError } from '../couriers/courier-registry.js';
import { errorResponse, successResponse } from '../helpers/response.helper.js';
import {
  RequestValidationError,
  validateCourierPartnerParam,
} from '../helpers/validation.helper.js';

export function listCouriers(_req: Request, res: Response) {
  return successResponse(res, {
    supported_couriers: courierRegistry.listSupportedCouriers(),
  });
}

export function getCourier(req: Request, res: Response) {
  try {
    const { courierPartner } = validateCourierPartnerParam(req.params);
    const courier = courierRegistry.get(courierPartner);

    return successResponse(res, {
      courier_partner: courier.partnerCode,
      supported: true,
    });
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

    return errorResponse(res, {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    });
  }
}
