import { Redis } from 'ioredis';

import { env } from '../config/env.js';

const globalForRedis = globalThis as unknown as {
  redis?: Redis;
};

export const redis =
  process.env.NODE_ENV === 'test'
    ? (null as unknown as Redis)
    : (globalForRedis.redis ??
      new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: null,
      }));

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  globalForRedis.redis = redis;
}

export function getRedisConnectionOptions() {
  const url = new URL(env.REDIS_URL);

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
  };
}
