export class ApiError extends Error {
  statusCode: number;
  success: boolean;
  errors: unknown[];

  constructor(statusCode: number, message = 'Something went wrong', errors: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
