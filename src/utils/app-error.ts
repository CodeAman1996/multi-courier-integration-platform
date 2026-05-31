type AppErrorInput = {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
};

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(input: AppErrorInput) {
    super(input.message);

    this.name = 'AppError';
    this.statusCode = input.statusCode;
    this.code = input.code;
    this.details = input.details;
  }
}
