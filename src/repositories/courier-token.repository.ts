import { prisma } from '../prisma/client.js';

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
  clear(): Promise<void> | void;
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

export class PrismaCourierTokenRepository implements CourierTokenRepository {
  constructor(private readonly client = prisma) {}

  async findByCourierPartner(courierPartner: string) {
    const token = await this.client.courierToken.findUnique({
      where: {
        courierPartner,
      },
    });

    return token ? mapPrismaCourierToken(token) : null;
  }

  async upsert(input: { courierPartner: string; accessToken: string; expiresAt: Date }) {
    const token = await this.client.courierToken.upsert({
      where: {
        courierPartner: input.courierPartner,
      },
      create: {
        courierPartner: input.courierPartner,
        accessToken: input.accessToken,
        expiresAt: input.expiresAt,
      },
      update: {
        accessToken: input.accessToken,
        expiresAt: input.expiresAt,
      },
    });

    return mapPrismaCourierToken(token);
  }

  async clear() {
    await this.client.courierToken.deleteMany();
  }
}

type PrismaCourierTokenRecord = Awaited<ReturnType<typeof prisma.courierToken.findUnique>>;

function mapPrismaCourierToken(token: NonNullable<PrismaCourierTokenRecord>): StoredCourierToken {
  return {
    courier_partner: token.courierPartner,
    access_token: token.accessToken,
    expires_at: token.expiresAt.toISOString(),
    created_at: token.createdAt.toISOString(),
    updated_at: token.updatedAt.toISOString(),
  };
}

export const courierTokenRepository =
  process.env.NODE_ENV === 'test'
    ? new InMemoryCourierTokenRepository()
    : new PrismaCourierTokenRepository();
