import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & {
  requestId?: string;
};

export function requestIdHandler(req: RequestWithId, res: Response, next: NextFunction) {
  req.requestId = getHeaderValue(req.headers['x-request-id']) ?? randomUUID();
  res.setHeader('x-request-id', req.requestId);
  next();
}

export function getRequestId(req: Request) {
  return (req as RequestWithId).requestId;
}

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
