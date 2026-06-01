import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger.js';
import { errorResponse } from './helpers/response.helper.js';
import { courierRouter } from './routes/courier.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { orderRouter } from './routes/order.routes.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.use('/health', healthRouter);
  app.use('/api/v1/health', healthRouter);
  app.use('/api/v1/couriers', courierRouter);
  app.use('/api/v1/orders', orderRouter);

  app.use((req, res) => {
    return errorResponse(res, {
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    });
  });

  return app;
}
