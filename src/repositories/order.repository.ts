import type { CreateShipmentResult } from '../couriers/courier.types.js';
import type { CreateOrderRequest } from '../helpers/validation.helper.js';

export type StoredOrder = {
  id: string;
  order_id: string;
  courier_partner: string;
  courier_order_id?: string;
  awb_number?: string;
  status: string;
  payment_mode?: 'COD' | 'PREPAID';
  original_request_payload: CreateOrderRequest;
  courier_response_payload: unknown;
  created_at: string;
  updated_at: string;
};

export interface OrderRepository {
  findByOrderId(orderId: string): Promise<StoredOrder | null>;
  create(input: {
    payload: CreateOrderRequest;
    shipment: CreateShipmentResult;
  }): Promise<StoredOrder>;
}

export class InMemoryOrderRepository implements OrderRepository {
  private readonly orders = new Map<string, StoredOrder>();

  async findByOrderId(orderId: string) {
    return this.orders.get(orderId) ?? null;
  }

  async create(input: { payload: CreateOrderRequest; shipment: CreateShipmentResult }) {
    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: crypto.randomUUID(),
      order_id: input.payload.order_id,
      courier_partner: input.shipment.courierPartner,
      courier_order_id: input.shipment.courierOrderId,
      awb_number: input.shipment.awbNumber,
      status: input.shipment.status,
      payment_mode: input.payload.payment_mode,
      original_request_payload: input.payload,
      courier_response_payload: input.shipment.rawResponse,
      created_at: now,
      updated_at: now,
    };

    this.orders.set(order.order_id, order);

    return order;
  }

  clear() {
    this.orders.clear();
  }
}

export const orderRepository = new InMemoryOrderRepository();
