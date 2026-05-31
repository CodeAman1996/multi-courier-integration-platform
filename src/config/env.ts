import 'dotenv/config';

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  URBANEBOLT_BASE_URL: z.string().url().default('https://uat.urbanebolt.in'),
  URBANEBOLT_USERNAME: z.string().optional(),
  URBANEBOLT_PASSWORD: z.string().optional(),
  URBANEBOLT_CUSTOMER_CODE: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type AppEnv = typeof env;
