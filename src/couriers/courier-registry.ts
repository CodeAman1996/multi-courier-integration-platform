import type { CourierAdapter } from './courier-adapter.js';

export class UnknownCourierError extends Error {
  readonly statusCode = 400;
  readonly code = 'UNKNOWN_COURIER';

  constructor(
    readonly courierPartner: string,
    readonly supportedCouriers: string[],
  ) {
    super(`Unsupported courier partner: ${courierPartner}`);
    this.name = 'UnknownCourierError';
  }
}

export class CourierRegistry {
  private readonly adapters = new Map<string, CourierAdapter>();

  register(adapter: CourierAdapter) {
    const partnerCode = normalizePartnerCode(adapter.partnerCode);

    this.adapters.set(partnerCode, {
      ...adapter,
      partnerCode,
    });
  }

  get(courierPartner: string) {
    const partnerCode = normalizePartnerCode(courierPartner);
    const adapter = this.adapters.get(partnerCode);

    if (!adapter) {
      throw new UnknownCourierError(partnerCode, this.listSupportedCouriers());
    }

    return adapter;
  }

  has(courierPartner: string) {
    return this.adapters.has(normalizePartnerCode(courierPartner));
  }

  listSupportedCouriers() {
    return [...this.adapters.keys()].sort();
  }
}

export function normalizePartnerCode(courierPartner: string) {
  return courierPartner.trim().toLowerCase();
}
