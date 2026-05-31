import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'multi-courier-integration-platform',
      timestamp: new Date().toISOString(),
    },
  });
});
