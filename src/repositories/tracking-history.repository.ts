import type { TrackShipmentResult } from '../couriers/courier.types.js';
import { prisma } from '../prisma/client.js';

export type StoredTrackingHistory = {
  id: string;
  order_id: string;
  awb_number?: string;
  status: string;
  location?: string;
  event_time?: string;
  raw_payload: unknown;
  created_at: string;
};

export interface TrackingHistoryRepository {
  append(input: {
    orderId: string;
    awbNumber?: string;
    tracking: TrackShipmentResult;
  }): Promise<StoredTrackingHistory[]>;
  findByOrderId(orderId: string): Promise<StoredTrackingHistory[]>;
  clear(): Promise<void> | void;
}

export class InMemoryTrackingHistoryRepository implements TrackingHistoryRepository {
  private readonly history = new Map<string, StoredTrackingHistory[]>();

  async append(input: { orderId: string; awbNumber?: string; tracking: TrackShipmentResult }) {
    const existingHistory = await this.findByOrderId(input.orderId);
    const createdAt = new Date().toISOString();
    const newHistory = input.tracking.history.map((event) => ({
      id: crypto.randomUUID(),
      order_id: input.orderId,
      awb_number: input.awbNumber,
      status: event.status,
      location: event.location,
      event_time: event.eventTime,
      raw_payload: event.rawPayload,
      created_at: createdAt,
    }));

    this.history.set(input.orderId, [...existingHistory, ...newHistory]);

    return newHistory;
  }

  async findByOrderId(orderId: string) {
    return this.history.get(orderId) ?? [];
  }

  clear() {
    this.history.clear();
  }
}

export class PrismaTrackingHistoryRepository implements TrackingHistoryRepository {
  constructor(private readonly client = prisma) {}

  async append(input: { orderId: string; awbNumber?: string; tracking: TrackShipmentResult }) {
    const order = await this.client.order.findUnique({
      where: {
        internalOrderId: input.orderId,
      },
    });

    if (!order) {
      return [];
    }

    const createdHistory = await Promise.all(
      input.tracking.history.map((event) =>
        this.client.trackingHistory.create({
          data: {
            orderId: order.id,
            awbNumber: input.awbNumber,
            status: event.status as never,
            location: event.location,
            eventTime: event.eventTime ? new Date(event.eventTime) : undefined,
            rawPayload: event.rawPayload as never,
          },
        }),
      ),
    );

    return createdHistory.map((history) => mapPrismaTrackingHistory(history, input.orderId));
  }

  async findByOrderId(orderId: string) {
    const order = await this.client.order.findUnique({
      where: {
        internalOrderId: orderId,
      },
      include: {
        trackingHistory: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!order) {
      return [];
    }

    return order.trackingHistory.map((history) => mapPrismaTrackingHistory(history, order.internalOrderId));
  }

  async clear() {
    await this.client.trackingHistory.deleteMany();
  }
}

type PrismaTrackingHistoryRecord = Awaited<ReturnType<typeof prisma.trackingHistory.create>>;

function mapPrismaTrackingHistory(
  history: PrismaTrackingHistoryRecord,
  internalOrderId: string,
): StoredTrackingHistory {
  return {
    id: history.id,
    order_id: internalOrderId,
    awb_number: history.awbNumber ?? undefined,
    status: history.status,
    location: history.location ?? undefined,
    event_time: history.eventTime?.toISOString(),
    raw_payload: history.rawPayload,
    created_at: history.createdAt.toISOString(),
  };
}

export const trackingHistoryRepository =
  process.env.NODE_ENV === 'test'
    ? new InMemoryTrackingHistoryRepository()
    : new PrismaTrackingHistoryRepository();
