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
import { logger } from '../utils/logger.js';

export async function createOrder(req: Request, res: Response) {
  try {
    const payload = validateCreateOrder(req.body);
    logger.info('Creating order shipment', {
      order_id: payload.order_id,
      courier_partner: payload.courier_partner,
    });

    const order = await orderService.createOrder(payload);
    logger.info('Order shipment created', {
      order_id: order.order_id,
      courier_partner: order.courier_partner,
      awb_number: order.awb_number,
      status: order.status,
    });

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
    logger.warn('Create order request failed', { error });

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
    logger.info('Bulk order creation started', {
      total_orders: payload.orders.length,
    });

    const result = await orderService.bulkCreateOrders(payload);
    logger.info('Bulk order creation completed', {
      total_orders: result.total,
      success: result.success,
      failed: result.failed,
    });

    return successResponse(res, result);
  } catch (error) {
    logger.warn('Bulk order creation failed', { error });

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
    logger.info('Tracking order shipment', { order_id: orderId });

    const tracking = await orderService.trackOrder(orderId);
    logger.info('Order shipment tracked', {
      order_id: tracking.order_id,
      status: tracking.status,
      history_events: tracking.history.length,
    });

    return successResponse(res, tracking);
  } catch (error) {
    logger.warn('Track order request failed', { error });

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
    logger.info('Fetching stored tracking history', { order_id: orderId });

    const history = await orderService.getTrackingHistory(orderId);
    logger.info('Stored tracking history fetched', {
      order_id: history.order_id,
      history_events: history.history.length,
    });

    return successResponse(res, history);
  } catch (error) {
    logger.warn('Get tracking history request failed', { error });

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
    logger.info('Cancelling order shipment', { order_id: orderId });

    const cancellation = await orderService.cancelOrder(orderId);
    logger.info('Order shipment cancellation completed', {
      order_id: cancellation.order_id,
      status: cancellation.status,
      cancelled: cancellation.cancelled,
    });

    return successResponse(res, cancellation);
  } catch (error) {
    logger.warn('Cancel order request failed', { error });

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
