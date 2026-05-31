import type { NormalizedOrder } from '../couriers/courier.types.js';
import { UnknownCourierError } from '../couriers/courier-registry.js';
import { courierRegistry } from '../couriers/courier-registry.instance.js';
import type { BulkCreateOrdersRequest, CreateOrderRequest } from '../helpers/validation.helper.js';
import { orderRepository, type OrderRepository } from '../repositories/order.repository.js';

export class DuplicateOrderError extends Error {
  readonly statusCode = 409;
  readonly code = 'ORDER_ALREADY_EXISTS';

  constructor(orderId: string) {
    super(`Order already exists: ${orderId}`);
    this.name = 'DuplicateOrderError';
  }
}

export class OrderNotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = 'ORDER_NOT_FOUND';

  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
  }
}

export class OrderService {
  constructor(private readonly repository: OrderRepository) {}

  async createOrder(payload: CreateOrderRequest) {
    const existingOrder = await this.repository.findByOrderId(payload.order_id);

    if (existingOrder) {
      throw new DuplicateOrderError(payload.order_id);
    }

    const courier = courierRegistry.get(payload.courier_partner);
    const shipment = await courier.createShipment(toNormalizedOrder(payload));

    return this.repository.create({
      payload,
      shipment,
    });
  }

  async bulkCreateOrders(payload: BulkCreateOrdersRequest) {
    const seenOrderIds = new Set<string>();
    const results = await Promise.all(
      payload.orders.map(async (orderPayload) => {
        if (seenOrderIds.has(orderPayload.order_id)) {
          return buildBulkFailure(orderPayload.order_id, {
            code: 'DUPLICATE_ORDER_IN_BATCH',
            message: `Duplicate order in batch: ${orderPayload.order_id}`,
          });
        }

        seenOrderIds.add(orderPayload.order_id);

        try {
          const order = await this.createOrder(orderPayload);

          return {
            order_id: order.order_id,
            success: true,
            data: {
              courier_partner: order.courier_partner,
              courier_order_id: order.courier_order_id,
              awb_number: order.awb_number,
              status: order.status,
            },
          };
        } catch (error) {
          return buildBulkFailure(orderPayload.order_id, normalizeBulkError(error));
        }
      }),
    );

    const success = results.filter((result) => result.success).length;

    return {
      total: results.length,
      success,
      failed: results.length - success,
      results,
    };
  }

  async trackOrder(orderId: string) {
    const order = await this.repository.findByOrderId(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const courier = courierRegistry.get(order.courier_partner);
    const tracking = await courier.trackShipment({
      orderId: order.order_id,
      awbNumber: order.awb_number,
    });

    return {
      order_id: order.order_id,
      courier_partner: order.courier_partner,
      awb_number: order.awb_number,
      status: tracking.status,
      history: tracking.history,
    };
  }

  async cancelOrder(orderId: string) {
    const order = await this.repository.findByOrderId(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    const courier = courierRegistry.get(order.courier_partner);
    const cancellation = await courier.cancelShipment({
      orderId: order.order_id,
      awbNumber: order.awb_number,
    });

    const updatedOrder = await this.repository.updateStatus({
      orderId: order.order_id,
      status: cancellation.status,
      courierResponsePayload: cancellation.rawResponse,
    });

    return {
      order_id: order.order_id,
      courier_partner: order.courier_partner,
      awb_number: order.awb_number,
      status: updatedOrder?.status ?? cancellation.status,
      cancelled: cancellation.cancelled,
    };
  }
}

function toNormalizedOrder(payload: CreateOrderRequest): NormalizedOrder {
  return {
    orderId: payload.order_id,
    courierPartner: payload.courier_partner,
    paymentMode: payload.payment_mode,
    declaredValue: payload.declared_value,
    collectableValue: payload.collectable_value,
    rawPayload: payload,
  };
}

export const orderService = new OrderService(orderRepository);

function buildBulkFailure(orderId: string, error: { code: string; message: string; details?: unknown }) {
  return {
    order_id: orderId,
    success: false,
    error,
  };
}

function normalizeBulkError(error: unknown) {
  if (error instanceof DuplicateOrderError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (error instanceof UnknownCourierError) {
    return {
      code: error.code,
      message: error.message,
      details: {
        supported_couriers: error.supportedCouriers,
      },
    };
  }

  return {
    code: 'ORDER_CREATE_FAILED',
    message: 'Order could not be created',
  };
}
