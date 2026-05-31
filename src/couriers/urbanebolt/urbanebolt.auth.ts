import { env } from '../../config/env.js';
import {
  courierTokenRepository,
  type CourierTokenRepository,
} from '../../repositories/courier-token.repository.js';
import { CourierApiError } from './urbanebolt.error-mapper.js';
import type { UrbaneBoltClient } from './urbanebolt.client.js';

const TOKEN_TTL_MS = 55 * 60 * 1000;

export class UrbaneBoltAuthService {
  constructor(
    private readonly client: UrbaneBoltClient,
    private readonly tokenRepository: CourierTokenRepository = courierTokenRepository,
  ) {}

  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh) {
      const token = await this.tokenRepository.findByCourierPartner('urbanebolt');

      if (token && new Date(token.expires_at).getTime() > Date.now()) {
        return token.access_token;
      }
    }

    if (!env.URBANEBOLT_USERNAME || !env.URBANEBOLT_PASSWORD) {
      throw new CourierApiError(
        'COURIER_AUTH_NOT_CONFIGURED',
        'UrbaneBolt credentials are not configured',
        500,
      );
    }

    const response = await this.client.getToken(env.URBANEBOLT_USERNAME, env.URBANEBOLT_PASSWORD);
    const accessToken = response.access_token ?? response.access ?? response.token;

    if (!accessToken) {
      throw new CourierApiError('COURIER_AUTH_FAILED', 'UrbaneBolt token response is invalid', 502, response);
    }

    await this.tokenRepository.upsert({
      courierPartner: 'urbanebolt',
      accessToken,
      expiresAt: new Date(Date.now() + (response.expires_in ? response.expires_in * 1000 : TOKEN_TTL_MS)),
    });

    return accessToken;
  }
}
