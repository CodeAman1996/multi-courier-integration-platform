import type { Request, Response } from 'express';

import { successResponse } from '../helpers/response.helper.js';

export function getHealth(_req: Request, res: Response) {
  return successResponse(res, {
    status: 'ok',
    service: 'multi-courier-integration-platform',
    timestamp: new Date().toISOString(),
  });
}
