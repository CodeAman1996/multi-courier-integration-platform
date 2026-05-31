import { describe, expect, it } from 'vitest';

import {
  mapOrderToUrbaneBoltManifest,
  mapUrbaneBoltCancelResponse,
  mapUrbaneBoltManifestResponse,
  mapUrbaneBoltTrackingResponse,
} from '../../src/couriers/urbanebolt/urbanebolt.mapper.js';

describe('UrbaneBolt mapper', () => {
  it('maps normalized orders to UrbaneBolt manifest payloads', () => {
    const payload = mapOrderToUrbaneBoltManifest(
      {
        orderId: 'ORD-1001',
        courierPartner: 'urbanebolt',
        paymentMode: 'COD',
        declaredValue: 1200,
        collectableValue: 1200,
        rawPayload: {
          consignee_name: 'Aman',
          consignee_mobile: '9999999999',
          consignee_pincode: '110001',
          shipper_name: 'Warehouse',
          shipper_pincode: '122001',
        },
      },
      'UEBCUS0008',
    );

    expect(payload).toMatchObject({
      customerCode: 'UEBCUS0008',
      orderNumber: 'ORD-1001',
      declaredValue: 1200,
      collectableValue: 1200,
      payMode: 'COD',
      consName: 'Aman',
      consPincode: '110001',
      shprName: 'Warehouse',
      shprPincode: '122001',
    });
  });

  it('maps UrbaneBolt create shipment responses to normalized responses', () => {
    const result = mapUrbaneBoltManifestResponse({
      shipment_id: 'UB-SHIP-1',
      awb_number: 'UB-AWB-1',
      status: 'CREATED',
    });

    expect(result).toEqual({
      courierPartner: 'urbanebolt',
      courierOrderId: 'UB-SHIP-1',
      awbNumber: 'UB-AWB-1',
      status: 'CREATED',
      rawResponse: {
        shipment_id: 'UB-SHIP-1',
        awb_number: 'UB-AWB-1',
        status: 'CREATED',
      },
    });
  });

  it('maps UrbaneBolt tracking and cancellation responses', () => {
    const tracking = mapUrbaneBoltTrackingResponse({
      current_status: 'IN_TRANSIT',
      history: [
        {
          status: 'PICKED_UP',
          location: 'Delhi',
          event_time: '2026-05-31T10:00:00.000Z',
        },
      ],
    });

    expect(tracking).toMatchObject({
      status: 'IN_TRANSIT',
      history: [
        {
          status: 'PICKED_UP',
          location: 'Delhi',
          eventTime: '2026-05-31T10:00:00.000Z',
        },
      ],
    });

    expect(mapUrbaneBoltCancelResponse({ success: true })).toMatchObject({
      status: 'CANCELLED',
      cancelled: true,
    });
  });
});
