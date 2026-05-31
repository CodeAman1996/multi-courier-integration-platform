import type { Response } from 'express';

type SuccessResponseInput<T> = {
  statusCode?: number;
  data: T;
  message?: string;
};

type ErrorResponseInput = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

export function successResponse<T>(
  res: Response,
  dataOrInput: T | SuccessResponseInput<T>,
  statusCode = 200,
) {
  const input =
    isSuccessResponseInput(dataOrInput) ? dataOrInput : { data: dataOrInput, statusCode };

  return res.status(input.statusCode ?? statusCode).json({
    success: true,
    message: input.message,
    data: input.data,
  });
}

export function errorResponse(res: Response, input: ErrorResponseInput) {
  return res.status(input.statusCode).json({
    success: false,
    error: {
      code: input.code,
      message: input.message,
      details: input.details,
    },
  });
}

function isSuccessResponseInput<T>(value: T | SuccessResponseInput<T>): value is SuccessResponseInput<T> {
  return typeof value === 'object' && value !== null && 'data' in value;
}
