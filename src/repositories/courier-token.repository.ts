export type StoredCourierToken = {
  courier_partner: string;
  access_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

export interface CourierTokenRepository {
  findByCourierPartner(courierPartner: string): Promise<StoredCourierToken | null>;
  upsert(input: {
    courierPartner: string;
    accessToken: string;
    expiresAt: Date;
  }): Promise<StoredCourierToken>;
}

export class InMemoryCourierTokenRepository implements CourierTokenRepository {
  private readonly tokens = new Map<string, StoredCourierToken>();

  async findByCourierPartner(courierPartner: string) {
    return this.tokens.get(courierPartner) ?? null;
  }

  async upsert(input: { courierPartner: string; accessToken: string; expiresAt: Date }) {
    const now = new Date().toISOString();
    const existing = await this.findByCourierPartner(input.courierPartner);
    const token: StoredCourierToken = {
      courier_partner: input.courierPartner,
      access_token: input.accessToken,
      expires_at: input.expiresAt.toISOString(),
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    this.tokens.set(input.courierPartner, token);

    return token;
  }

  clear() {
    this.tokens.clear();
  }
}

export const courierTokenRepository = new InMemoryCourierTokenRepository();
