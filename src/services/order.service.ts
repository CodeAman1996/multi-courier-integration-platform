import type { NormalizedOrder } from '../couriers/courier.types.js';
import { courierRegistry } from '../couriers/courier-registry.instance.js';
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
