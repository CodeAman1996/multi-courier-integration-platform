import type { NormalizedOrder } from '../couriers/courier.types.js';
import { courierRegistry } from '../couriers/courier-registry.instance.js';
import { UnknownCourierError } from '../couriers/courier-registry.js';
import { CourierApiError } from '../couriers/urbanebolt/urbanebolt.error-mapper.js';
import { logFailure } from '../helpers/error-log.helper.js';
import type { CreateOrderRequest } from '../helpers/validation.helper.js';
import { orderRepository, type OrderRepository } from '../repositories/order.repository.js';
import {
  trackingHistoryRepository,
  type TrackingHistoryRepository,
} from '../repositories/tracking-history.repository.js';

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
  constructor(
    private readonly repository: OrderRepository,
    private readonly trackingHistory: TrackingHistoryRepository,
  ) {}

  async createOrder(payload: CreateOrderRequest, options: { requestId?: string } = {}) {
    const existingOrder = await this.repository.findByOrderId(payload.order_id);

    if (existingOrder) {
      throw new DuplicateOrderError(payload.order_id);
    }

    const courier = courierRegistry.get(payload.courier_partner);
    const normalizedOrder = toNormalizedOrder(payload);
    const courierRequestPayload = courier.getCreateShipmentRequestPayload?.(normalizedOrder);
    let shipment;

    try {
      shipment = await courier.createShipment(normalizedOrder);
    } catch (error) {
      if (!(error instanceof UnknownCourierError)) {
        await this.repository.createFailed({
          payload,
          courierRequestPayload,
          failureReason: normalizeFailureReason(error),
        });
      }

      logFailure('Order shipment failed', error, {
        orderId: payload.order_id,
        courierPartner: payload.courier_partner,
        requestId: options.requestId,
      });

      throw error;
    }

    return this.repository.create({
      payload,
      shipment: {
        ...shipment,
        courierRequestPayload: shipment.courierRequestPayload ?? courierRequestPayload,
      },
    });
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

    await this.trackingHistory.append({
      orderId: order.order_id,
      awbNumber: order.awb_number,
      tracking,
    });

    return {
      order_id: order.order_id,
      courier_partner: order.courier_partner,
      awb_number: order.awb_number,
      status: tracking.status,
      history: tracking.history,
    };
  }

  async getTrackingHistory(orderId: string) {
    const order = await this.repository.findByOrderId(orderId);

    if (!order) {
      throw new OrderNotFoundError(orderId);
    }

    return {
      order_id: order.order_id,
      courier_partner: order.courier_partner,
      awb_number: order.awb_number,
      history: await this.trackingHistory.findByOrderId(order.order_id),
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

function normalizeFailureReason(error: unknown) {
  if (error instanceof CourierApiError) {
    return `${error.code}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Order shipment failed';
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

export const orderService = new OrderService(orderRepository, trackingHistoryRepository);
