import type { Request, Response } from 'express';

import { UnknownCourierError } from '../couriers/courier-registry.js';
import { errorResponse, successResponse } from '../helpers/response.helper.js';
import {
  RequestValidationError,
  validateBulkCreateOrders,
  validateCreateOrder,
  validateOrderIdParam,
} from '../helpers/validation.helper.js';
import {
  DuplicateOrderError,
  OrderNotFoundError,
  orderService,
} from '../services/order.service.js';

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

export async function bulkCreateOrders(req: Request, res: Response) {
  try {
    const payload = validateBulkCreateOrders(req.body);
    const result = await orderService.bulkCreateOrders(payload);

    return successResponse(res, result);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    return errorResponse(res, {
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
    });
  }
}

export async function trackOrder(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const tracking = await orderService.trackOrder(orderId);

    return successResponse(res, tracking);
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

    if (error instanceof OrderNotFoundError) {
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

export async function getTrackingHistory(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const history = await orderService.getTrackingHistory(orderId);

    return successResponse(res, history);
  } catch (error) {
    if (error instanceof RequestValidationError) {
      return errorResponse(res, {
        statusCode: error.statusCode,
        code: error.code,
        message: error.message,
        details: error.details,
      });
    }

    if (error instanceof OrderNotFoundError) {
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

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const cancellation = await orderService.cancelOrder(orderId);

    return successResponse(res, cancellation);
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

    if (error instanceof OrderNotFoundError) {
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
