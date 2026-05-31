import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().integer().positive().default(3000),
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  DATABASE_URL: Joi.string().optional(),
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  URBANEBOLT_BASE_URL: Joi.string().uri().default('https://uat.urbanebolt.in'),
  URBANEBOLT_USERNAME: Joi.string().allow('').optional(),
  URBANEBOLT_PASSWORD: Joi.string().allow('').optional(),
  URBANEBOLT_CUSTOMER_CODE: Joi.string().allow('').optional(),
}).unknown(true);

export function validateEnv(source: NodeJS.ProcessEnv) {
  const { value, error } = envSchema.validate(source, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Environment validation failed: ${error.message}`);
  }

  return value as {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
    DATABASE_URL?: string;
    REDIS_URL: string;
    URBANEBOLT_BASE_URL: string;
    URBANEBOLT_USERNAME?: string;
    URBANEBOLT_PASSWORD?: string;
    URBANEBOLT_CUSTOMER_CODE?: string;
  };
}
