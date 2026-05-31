import express from 'express';

import { errorResponse } from './helpers/response.helper.js';
import { courierRouter } from './routes/courier.routes.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/couriers', courierRouter);

  app.use((req, res) => {
    return errorResponse(res, {
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    });
  });

  return app;
}
