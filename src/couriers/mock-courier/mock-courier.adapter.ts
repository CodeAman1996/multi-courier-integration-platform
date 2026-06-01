import type { CourierAdapter } from '../courier-adapter.js';
import type {
  CancelShipmentInput,
  CreateShipmentResult,
  NormalizedOrder,
  TrackShipmentInput,
  TrackShipmentResult,
} from '../courier.types.js';

const MOCK_PARTNER_CODE = 'mock_courier';

export const mockCourierAdapter: CourierAdapter = {
  partnerCode: MOCK_PARTNER_CODE,

  getCreateShipmentRequestPayload(order: NormalizedOrder) {
    return {
      order_id: order.orderId,
      courier_partner: order.courierPartner,
      payment_mode: order.paymentMode,
      declared_value: order.declaredValue,
      collectable_value: order.collectableValue,
    };
  },

  async createShipment(order: NormalizedOrder): Promise<CreateShipmentResult> {
    const shipmentId = buildMockShipmentId(order.orderId);
    const courierRequestPayload = this.getCreateShipmentRequestPayload?.(order);

    return {
      courierPartner: MOCK_PARTNER_CODE,
      courierOrderId: shipmentId,
      awbNumber: shipmentId.replace('SHIP', 'AWB'),
      status: 'CREATED',
      courierRequestPayload,
      rawResponse: {
        shipment_id: shipmentId,
        awb_number: shipmentId.replace('SHIP', 'AWB'),
        status: 'CREATED',
      },
    };
  },

  async trackShipment(input: TrackShipmentInput): Promise<TrackShipmentResult> {
    return {
      status: 'IN_TRANSIT',
      history: [
        {
          status: 'CREATED',
          location: 'Mock Fulfillment Center',
          eventTime: new Date(0).toISOString(),
          rawPayload: {
            order_id: input.orderId,
            status: 'CREATED',
          },
        },
        {
          status: 'IN_TRANSIT',
          location: 'Mock Transit Hub',
          eventTime: new Date(60_000).toISOString(),
          rawPayload: {
            order_id: input.orderId,
            awb_number: input.awbNumber,
            status: 'IN_TRANSIT',
          },
        },
      ],
      rawResponse: {
        order_id: input.orderId,
        awb_number: input.awbNumber,
        status: 'IN_TRANSIT',
      },
    };
  },

  async cancelShipment(input: CancelShipmentInput) {
    return {
      status: 'CANCELLED',
      cancelled: true,
      rawResponse: {
        order_id: input.orderId,
        awb_number: input.awbNumber,
        status: 'CANCELLED',
      },
    };
  },
};

function buildMockShipmentId(orderId: string) {
  const normalizedOrderId = orderId.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  return `MOCK-SHIP-${normalizedOrderId || 'ORDER'}`;
}
