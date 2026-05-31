import type { NormalizedOrder } from '../couriers/courier.types.js';
import { courierRegistry } from '../couriers/courier-registry.instance.js';
import type { CreateOrderRequest } from '../helpers/validation.helper.js';
import { orderRepository, type OrderRepository } from '../repositories/order.repository.js';

export class DuplicateOrderError extends Error {
  readonly statusCode = 409;
  readonly code = 'ORDER_ALREADY_EXISTS';

  constructor(orderId: string) {
    super(`Order already exists: ${orderId}`);
    this.name = 'DuplicateOrderError';
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
