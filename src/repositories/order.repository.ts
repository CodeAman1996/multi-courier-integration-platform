import type { CreateShipmentResult } from '../couriers/courier.types.js';
import type { CreateOrderRequest } from '../helpers/validation.helper.js';
import { prisma } from '../prisma/client.js';

export type StoredOrder = {
  id: string;
  order_id: string;
  courier_partner: string;
  courier_order_id?: string;
  awb_number?: string;
  status: string;
  payment_mode?: 'COD' | 'PREPAID';
  original_request_payload: CreateOrderRequest;
  courier_request_payload?: unknown;
  courier_response_payload: unknown;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
};

export interface OrderRepository {
  findByOrderId(orderId: string): Promise<StoredOrder | null>;
  create(input: {
    payload: CreateOrderRequest;
    shipment: CreateShipmentResult;
  }): Promise<StoredOrder>;
  createFailed(input: {
    payload: CreateOrderRequest;
    courierRequestPayload?: unknown;
    failureReason: string;
  }): Promise<StoredOrder>;
  updateStatus(input: {
    orderId: string;
    status: string;
    courierResponsePayload: unknown;
  }): Promise<StoredOrder | null>;
  clear(): Promise<void> | void;
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
      courier_request_payload: input.shipment.courierRequestPayload,
      courier_response_payload: input.shipment.rawResponse,
      created_at: now,
      updated_at: now,
    };

    this.orders.set(order.order_id, order);

    return order;
  }

  async createFailed(input: {
    payload: CreateOrderRequest;
    courierRequestPayload?: unknown;
    failureReason: string;
  }) {
    const now = new Date().toISOString();
    const order: StoredOrder = {
      id: crypto.randomUUID(),
      order_id: input.payload.order_id,
      courier_partner: input.payload.courier_partner,
      status: 'FAILED',
      payment_mode: input.payload.payment_mode,
      original_request_payload: input.payload,
      courier_request_payload: input.courierRequestPayload,
      courier_response_payload: undefined,
      failure_reason: input.failureReason,
      created_at: now,
      updated_at: now,
    };

    this.orders.set(order.order_id, order);

    return order;
  }

  async updateStatus(input: {
    orderId: string;
    status: string;
    courierResponsePayload: unknown;
  }) {
    const order = await this.findByOrderId(input.orderId);

    if (!order) {
      return null;
    }

    const updatedOrder: StoredOrder = {
      ...order,
      status: input.status,
      courier_response_payload: input.courierResponsePayload,
      updated_at: new Date().toISOString(),
    };

    this.orders.set(updatedOrder.order_id, updatedOrder);

    return updatedOrder;
  }

  clear() {
    this.orders.clear();
  }
}

export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly client = prisma) {}

  async findByOrderId(orderId: string) {
    const order = await this.client.order.findUnique({
      where: {
        internalOrderId: orderId,
      },
    });

    return order ? mapPrismaOrder(order) : null;
  }

  async create(input: { payload: CreateOrderRequest; shipment: CreateShipmentResult }) {
    const order = await this.client.order.create({
      data: {
        internalOrderId: input.payload.order_id,
        courierPartner: input.shipment.courierPartner,
        courierOrderId: input.shipment.courierOrderId,
        awbNumber: input.shipment.awbNumber,
        status: input.shipment.status as never,
        paymentMode: input.payload.payment_mode,
        originalRequestPayload: input.payload as never,
        courierRequestPayload: input.shipment.courierRequestPayload as never,
        courierResponsePayload: input.shipment.rawResponse as never,
      },
    });

    return mapPrismaOrder(order);
  }

  async createFailed(input: {
    payload: CreateOrderRequest;
    courierRequestPayload?: unknown;
    failureReason: string;
  }) {
    const order = await this.client.order.create({
      data: {
        internalOrderId: input.payload.order_id,
        courierPartner: input.payload.courier_partner,
        status: 'FAILED',
        paymentMode: input.payload.payment_mode,
        originalRequestPayload: input.payload as never,
        courierRequestPayload: input.courierRequestPayload as never,
        failureReason: input.failureReason,
      },
    });

    return mapPrismaOrder(order);
  }

  async updateStatus(input: {
    orderId: string;
    status: string;
    courierResponsePayload: unknown;
  }) {
    const existingOrder = await this.findByOrderId(input.orderId);

    if (!existingOrder) {
      return null;
    }

    const order = await this.client.order.update({
      where: {
        internalOrderId: input.orderId,
      },
      data: {
        status: input.status as never,
        courierResponsePayload: input.courierResponsePayload as never,
      },
    });

    return mapPrismaOrder(order);
  }

  async clear() {
    await this.client.order.deleteMany();
  }
}

type PrismaOrderRecord = Awaited<ReturnType<typeof prisma.order.findUnique>>;

function mapPrismaOrder(order: NonNullable<PrismaOrderRecord>): StoredOrder {
  return {
    id: order.id,
    order_id: order.internalOrderId,
    courier_partner: order.courierPartner,
    courier_order_id: order.courierOrderId ?? undefined,
    awb_number: order.awbNumber ?? undefined,
    status: order.status,
    payment_mode: order.paymentMode ?? undefined,
    original_request_payload: order.originalRequestPayload as CreateOrderRequest,
    courier_request_payload: order.courierRequestPayload,
    courier_response_payload: order.courierResponsePayload,
    failure_reason: order.failureReason ?? undefined,
    created_at: order.createdAt.toISOString(),
    updated_at: order.updatedAt.toISOString(),
  };
}

export const orderRepository =
  process.env.NODE_ENV === 'test' ? new InMemoryOrderRepository() : new PrismaOrderRepository();
