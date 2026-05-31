import type {
  CancelShipmentResult,
  CreateShipmentResult,
  NormalizedOrder,
  TrackShipmentResult,
} from '../courier.types.js';
import type {
  UrbaneBoltCancelResponse,
  UrbaneBoltManifestPayload,
  UrbaneBoltManifestResponse,
  UrbaneBoltTrackingResponse,
} from './urbanebolt.types.js';

export function mapOrderToUrbaneBoltManifest(
  order: NormalizedOrder,
  customerCode: string,
): UrbaneBoltManifestPayload {
  const raw = order.rawPayload;

  return {
    customerCode,
    orderNumber: order.orderId,
    declaredValue: numberValue(order.declaredValue, raw.declared_value, 0),
    collectableValue: numberValue(order.collectableValue, raw.collectable_value, 0),
    serviceType: stringValue(raw.service_type, 'SDD'),
    payMode: order.paymentMode === 'PREPAID' ? 'PPD' : 'COD',
    itemDescription: stringValue(raw.item_description, 'General Merchandise'),
    pieces: numberValue(raw.pieces, undefined, 1),
    weight: numberValue(raw.weight, undefined, 0.5),
    length: numberValue(raw.length, undefined, 10),
    breadth: numberValue(raw.breadth, undefined, 10),
    height: numberValue(raw.height, undefined, 10),
    consName: stringValue(raw.consignee_name, 'Consignee'),
    consMobile: stringValue(raw.consignee_mobile, '9999999999'),
    consAddress: stringValue(raw.consignee_address, 'Consignee Address'),
    consCity: stringValue(raw.consignee_city, 'Consignee City'),
    consState: stringValue(raw.consignee_state, 'Consignee State'),
    consPincode: stringValue(raw.consignee_pincode, '110001'),
    shprName: stringValue(raw.shipper_name, 'Shipper'),
    shprMobile: stringValue(raw.shipper_mobile, '9999999999'),
    shprAddress: stringValue(raw.shipper_address, 'Shipper Address'),
    shprCity: stringValue(raw.shipper_city, 'Shipper City'),
    shprState: stringValue(raw.shipper_state, 'Shipper State'),
    shprPincode: stringValue(raw.shipper_pincode, '110001'),
    rtnName: stringValue(raw.return_name, raw.shipper_name, 'Return Contact'),
    rtnMobile: stringValue(raw.return_mobile, raw.shipper_mobile, '9999999999'),
    rtnAddress: stringValue(raw.return_address, raw.shipper_address, 'Return Address'),
    rtnCity: stringValue(raw.return_city, raw.shipper_city, 'Return City'),
    rtnState: stringValue(raw.return_state, raw.shipper_state, 'Return State'),
    rtnPincode: stringValue(raw.return_pincode, raw.shipper_pincode, '110001'),
  };
}

export function mapUrbaneBoltManifestResponse(
  response: UrbaneBoltManifestResponse,
): CreateShipmentResult {
  return {
    courierPartner: 'urbanebolt',
    courierOrderId: response.shipmentId ?? response.shipment_id ?? response.orderNumber ?? response.order_number,
    awbNumber: response.awbNumber ?? response.awb_number ?? response.awb,
    status: response.status ?? 'CREATED',
    rawResponse: response,
  };
}

export function mapUrbaneBoltTrackingResponse(
  response: UrbaneBoltTrackingResponse,
): TrackShipmentResult {
  const history = response.history ?? response.scans ?? [];

  return {
    status: response.current_status ?? response.status ?? 'IN_TRANSIT',
    history: history.map((event) => ({
      status: stringValue(event.status, event.current_status, 'IN_TRANSIT'),
      location: optionalString(event.location),
      eventTime: optionalString(event.event_time) ?? optionalString(event.timestamp),
      rawPayload: event,
    })),
    rawResponse: response,
  };
}

export function mapUrbaneBoltCancelResponse(response: UrbaneBoltCancelResponse): CancelShipmentResult {
  return {
    status: response.status ?? 'CANCELLED',
    cancelled: response.cancelled ?? response.success ?? true,
    rawResponse: response,
  };
}

function stringValue(...values: unknown[]) {
  const value = values.find((item) => typeof item === 'string' && item.trim().length > 0);

  return typeof value === 'string' ? value : '';
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function numberValue(...values: unknown[]) {
  const value = values.find((item) => typeof item === 'number' || typeof item === 'string');
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : 0;
}
