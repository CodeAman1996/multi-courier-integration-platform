import winston from 'winston';

import { env } from '../config/env.js';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'multi-courier-integration-platform',
    env: env.NODE_ENV,
  },
  format: logFormat,
  transports: [new winston.transports.Console()],
});
