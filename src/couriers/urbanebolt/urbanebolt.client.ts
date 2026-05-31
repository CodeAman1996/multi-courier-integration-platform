import axios, { AxiosError, type AxiosInstance } from 'axios';

import { retry } from '../../utils/retry.js';
import { mapUrbaneBoltError } from './urbanebolt.error-mapper.js';
import type {
  UrbaneBoltCancelResponse,
  UrbaneBoltManifestPayload,
  UrbaneBoltManifestResponse,
  UrbaneBoltTokenResponse,
  UrbaneBoltTrackingResponse,
} from './urbanebolt.types.js';

export class UrbaneBoltClient {
  private readonly http: AxiosInstance;

  constructor(baseURL: string) {
    this.http = axios.create({
      baseURL,
      timeout: 10_000,
    });
  }

  getToken(username: string, password: string) {
    return this.request<UrbaneBoltTokenResponse>(() =>
      this.http.post('/api/v1/auth/getToken/', {
        username,
        password,
      }),
    );
  }

  createShipment(token: string, payload: UrbaneBoltManifestPayload[]) {
    return this.request<UrbaneBoltManifestResponse[]>(() =>
      this.http.post('/api/v1/services/manifest/', payload, this.authHeader(token)),
    );
  }

  trackShipment(token: string, awbNumber: string) {
    return this.request<UrbaneBoltTrackingResponse>(() =>
      this.http.get('/api/v1/services/tracking-pub/', {
        ...this.authHeader(token),
        params: {
          awb: awbNumber,
        },
      }),
    );
  }

  cancelShipment(token: string, awbNumber: string) {
    return this.request<UrbaneBoltCancelResponse>(() =>
      this.http.post('/api/v1/services/cancel/', { awbs: awbNumber }, this.authHeader(token)),
    );
  }

  private authHeader(token: string) {
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  private async request<T>(operation: () => Promise<{ data: T }>) {
    return retry({
      retries: 2,
      delayMs: 250,
      operation: async () => {
        try {
          const response = await operation();
          return response.data;
        } catch (error) {
          throw normalizeAxiosError(error);
        }
      },
    });
  }
}

function normalizeAxiosError(error: unknown) {
  if (error instanceof AxiosError) {
    return mapUrbaneBoltError(error.response?.status ?? 503, error.response?.data ?? error.message);
  }

  return mapUrbaneBoltError(503, error);
}
