export class CourierApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly statusCode: number,
    readonly rawError?: unknown,
  ) {
    super(message);
    this.name = 'CourierApiError';
  }
}

export function mapUrbaneBoltError(statusCode: number, rawError: unknown) {
  if (statusCode === 401 || statusCode === 403) {
    return new CourierApiError('COURIER_AUTH_FAILED', 'Courier authentication failed', statusCode, rawError);
  }

  if (statusCode >= 400 && statusCode < 500) {
    return new CourierApiError('COURIER_VALIDATION_FAILED', 'Courier rejected the request', statusCode, rawError);
  }

  return new CourierApiError('COURIER_UNAVAILABLE', 'Courier service is temporarily unavailable', statusCode, rawError);
}

export function isRetryableCourierError(error: unknown) {
  return error instanceof CourierApiError && error.statusCode >= 500;
}

export function isCourierAuthError(error: unknown) {
  return error instanceof CourierApiError && (error.statusCode === 401 || error.statusCode === 403);
}
