import type {
  CancelShipmentInput,
  CancelShipmentResult,
  CourierPartnerCode,
  CreateShipmentResult,
  NormalizedOrder,
  TrackShipmentInput,
  TrackShipmentResult,
} from './courier.types.js';

export interface CourierAdapter {
  readonly partnerCode: CourierPartnerCode;

  createShipment(order: NormalizedOrder): Promise<CreateShipmentResult>;

  trackShipment(input: TrackShipmentInput): Promise<TrackShipmentResult>;

  cancelShipment(input: CancelShipmentInput): Promise<CancelShipmentResult>;
}
