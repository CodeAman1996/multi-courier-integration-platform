import type { Request, Response } from 'express';

import { errorResponse, successResponse } from '../helpers/response.helper.js';
import { getRequestId } from '../helpers/request-id.helper.js';
import {
  validateBatchIdParam,
  validateBulkCreateOrders,
  validateCreateOrder,
  validateOrderIdParam,
} from '../helpers/validation.helper.js';
import { bulkOrderService } from '../services/bulk-order.service.js';
import { orderService } from '../services/order.service.js';

export async function createOrder(req: Request, res: Response) {
  try {
    const payload = validateCreateOrder(req.body);
    const order = await orderService.createOrder(payload, { requestId: getRequestId(req) });

    return successResponse(res, {
      statusCode: 201,
      message: 'Order shipment created successfully',
      data: order,
    });
  } catch (error) {
    return errorResponse(res, error, req);
  }
}

export async function bulkCreateOrders(req: Request, res: Response) {
  try {
    const payload = validateBulkCreateOrders(req.body);
    const batch = await bulkOrderService.enqueueBulkCreate(payload, { requestId: getRequestId(req) });

    return successResponse(res, {
      statusCode: 202,
      data: batch,
    });
  } catch (error) {
    return errorResponse(res, error, req);
  }
}

export async function getBulkOrderBatch(req: Request, res: Response) {
  try {
    const { batchId } = validateBatchIdParam(req.params);
    const batch = await bulkOrderService.getBatch(batchId);

    return successResponse(res, batch);
  } catch (error) {
    return errorResponse(res, error, req);
  }
}

export async function trackOrder(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const tracking = await orderService.trackOrder(orderId);

    return successResponse(res, tracking);
  } catch (error) {
    return errorResponse(res, error, req);
  }
}

export async function getTrackingHistory(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const history = await orderService.getTrackingHistory(orderId);

    return successResponse(res, history);
  } catch (error) {
    return errorResponse(res, error, req);
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { orderId } = validateOrderIdParam(req.params);
    const cancellation = await orderService.cancelOrder(orderId);

    return successResponse(res, cancellation);
  } catch (error) {
    return errorResponse(res, error, req);
  }
}
