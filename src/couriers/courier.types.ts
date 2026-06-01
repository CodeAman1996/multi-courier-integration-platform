export type CourierPartnerCode = string;

export type NormalizedOrder = {
  orderId: string;
  courierPartner: CourierPartnerCode;
  paymentMode?: 'COD' | 'PREPAID';
  declaredValue?: number;
  collectableValue?: number;
  rawPayload: Record<string, unknown>;
};

export type CreateShipmentResult = {
  courierPartner: CourierPartnerCode;
  courierOrderId?: string;
  awbNumber?: string;
  status: string;
  courierRequestPayload?: unknown;
  rawResponse: unknown;
};

export type TrackShipmentInput = {
  orderId: string;
  awbNumber?: string;
};

export type TrackShipmentResult = {
  status: string;
  history: Array<{
    status: string;
    location?: string;
    eventTime?: string;
    rawPayload: unknown;
  }>;
  rawResponse: unknown;
};

export type CancelShipmentInput = {
  orderId: string;
  awbNumber?: string;
};

export type CancelShipmentResult = {
  status: string;
  cancelled: boolean;
  rawResponse: unknown;
};
