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

export function errorResponse(res: Response, input: unknown) {
  const error = normalizeError(input);

  return res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  });
}

function normalizeError(input: unknown): ErrorResponseInput {
  if (input instanceof Error) {
    const error = input as Error & {
      statusCode?: number;
      code?: string;
      details?: unknown;
      supportedCouriers?: string[];
    };

    return {
      statusCode: error.statusCode ?? 500,
      code: error.code ?? 'INTERNAL_SERVER_ERROR',
      message: error.statusCode ? error.message : 'Something went wrong',
      details:
        error.details ??
        (error.supportedCouriers ? { supported_couriers: error.supportedCouriers } : undefined),
    };
  }

  if (isErrorResponseInput(input)) {
    return input;
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Something went wrong',
  };
}

function isErrorResponseInput(input: unknown): input is ErrorResponseInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    'statusCode' in input &&
    'code' in input &&
    'message' in input
  );
}

function isSuccessResponseInput<T>(value: T | SuccessResponseInput<T>): value is SuccessResponseInput<T> {
  return typeof value === 'object' && value !== null && 'data' in value;
}
