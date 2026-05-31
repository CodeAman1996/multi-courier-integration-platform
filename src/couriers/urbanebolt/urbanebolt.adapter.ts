import { env } from '../../config/env.js';
import type { CourierAdapter } from '../courier-adapter.js';
import type { CancelShipmentInput, NormalizedOrder, TrackShipmentInput } from '../courier.types.js';
import { CourierApiError } from './urbanebolt.error-mapper.js';
import { UrbaneBoltAuthService } from './urbanebolt.auth.js';
import { UrbaneBoltClient } from './urbanebolt.client.js';
import {
  mapOrderToUrbaneBoltManifest,
  mapUrbaneBoltCancelResponse,
  mapUrbaneBoltManifestResponse,
  mapUrbaneBoltTrackingResponse,
} from './urbanebolt.mapper.js';

export class UrbaneBoltAdapter implements CourierAdapter {
  readonly partnerCode = 'urbanebolt';

  constructor(
    private readonly client: UrbaneBoltClient,
    private readonly auth: UrbaneBoltAuthService,
  ) {}

  async createShipment(order: NormalizedOrder) {
    const token = await this.auth.getAccessToken();
    const payload = mapOrderToUrbaneBoltManifest(order, requiredCustomerCode());
    const response = await this.client.createShipment(token, [payload]);
    const firstShipment = Array.isArray(response) ? response[0] : response;

    return mapUrbaneBoltManifestResponse(firstShipment ?? {});
  }

  async trackShipment(input: TrackShipmentInput) {
    if (!input.awbNumber) {
      throw new CourierApiError('AWB_REQUIRED', 'AWB number is required for UrbaneBolt tracking', 400);
    }

    const token = await this.auth.getAccessToken();
    const response = await this.client.trackShipment(token, input.awbNumber);

    return mapUrbaneBoltTrackingResponse(response);
  }

  async cancelShipment(input: CancelShipmentInput) {
    if (!input.awbNumber) {
      throw new CourierApiError('AWB_REQUIRED', 'AWB number is required for UrbaneBolt cancellation', 400);
    }

    const token = await this.auth.getAccessToken();
    const response = await this.client.cancelShipment(token, input.awbNumber);

    return mapUrbaneBoltCancelResponse(response);
  }
}

export function createUrbaneBoltAdapter() {
  const client = new UrbaneBoltClient(env.URBANEBOLT_BASE_URL);
  const auth = new UrbaneBoltAuthService(client);

  return new UrbaneBoltAdapter(client, auth);
}

function requiredCustomerCode() {
  if (!env.URBANEBOLT_CUSTOMER_CODE) {
    throw new CourierApiError(
      'COURIER_CONFIG_MISSING',
      'UrbaneBolt customer code is not configured',
      500,
    );
  }

  return env.URBANEBOLT_CUSTOMER_CODE;
}
