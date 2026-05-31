import type { TrackShipmentResult } from '../couriers/courier.types.js';

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

export const trackingHistoryRepository = new InMemoryTrackingHistoryRepository();
