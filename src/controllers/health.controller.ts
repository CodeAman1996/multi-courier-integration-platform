import type { Request, Response } from 'express';

import { successResponse } from '../helpers/response.helper.js';
import { logger } from '../utils/logger.js';

export function getHealth(_req: Request, res: Response) {
  logger.info('Health check requested');

  return successResponse(res, {
    status: 'ok',
    service: 'multi-courier-integration-platform',
    timestamp: new Date().toISOString(),
  });
}
