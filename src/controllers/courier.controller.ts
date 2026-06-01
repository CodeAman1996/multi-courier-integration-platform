import type { Request, Response } from 'express';

import { courierRegistry } from '../couriers/courier-registry.instance.js';
import { errorResponse, successResponse } from '../helpers/response.helper.js';
import { validateCourierPartnerParam } from '../helpers/validation.helper.js';

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
    return errorResponse(res, error, req);
  }
}
