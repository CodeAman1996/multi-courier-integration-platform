import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { randomUUID } from 'node:crypto';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware.js';
import { requestIdMiddleware } from './middlewares/request-id.middleware.js';
import { healthRouter } from './routes/health.routes.js';
import { logger } from './utils/logger.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      level: env.LOG_LEVEL,
      genReqId: (req) => req.headers['x-request-id']?.toString() ?? randomUUID(),
    }),
  );
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
