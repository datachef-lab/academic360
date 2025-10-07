export class ApiError extends Error {
  statusCode: number;
  errors: string[] | undefined;
  payload: unknown;
  success: boolean;

  constructor(
    statusCode: number,
    message = "Something went wrong!",
    errors?: string[],
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.payload = null;
    this.success = false;
    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors || null,
      payload: this.payload ?? null,
    };
  }
}
