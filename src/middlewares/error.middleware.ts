import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/app-error.js';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} was not found`,
    }),
  );
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        request_id: res.locals.requestId,
        details: error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        request_id: res.locals.requestId,
        details: error.details,
      },
    });
  }

  req.log.error({ error }, 'Unhandled application error');

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong',
      request_id: res.locals.requestId,
    },
  });
};
