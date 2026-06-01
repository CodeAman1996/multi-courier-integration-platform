import type { Request } from 'express';

import { getRequestId } from './request-id.helper.js';
import { logger } from '../utils/logger.js';

export type FailureLogContext = {
  orderId?: string;
  courierPartner?: string;
  requestId?: string;
};

export function logFailure(message: string, error: unknown, context: FailureLogContext = {}) {
  const normalizedError = error instanceof Error ? error : undefined;
  const errorWithCode = error as { code?: string; name?: string };

  logger.error(message, {
    order_id: context.orderId,
    courier_partner: context.courierPartner,
    request_id: context.requestId,
    error_type: errorWithCode.code ?? errorWithCode.name ?? typeof error,
    error_message: normalizedError?.message ?? String(error),
    stack: normalizedError?.stack,
  });
}

export function getFailureContextFromRequest(req: Request): FailureLogContext {
  const body = isObject(req.body) ? req.body : {};

  return {
    orderId:
      stringValue(req.params.orderId) ??
      stringValue(body.order_id) ??
      stringValue(firstBulkOrder(body)?.order_id),
    courierPartner:
      stringValue(body.courier_partner) ?? stringValue(firstBulkOrder(body)?.courier_partner),
    requestId: getRequestId(req),
  };
}

function firstBulkOrder(body: Record<string, unknown>) {
  return Array.isArray(body.orders) && isObject(body.orders[0]) ? body.orders[0] : undefined;
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
