export class ApiError extends Error {
  statusCode: number;
  errors: string[] | undefined;
  payload: null;
  success: boolean;

  constructor(
    statusCode: number,
    message: string = "Something went wrong!",
    errors?: string[],
    stack?: string,
  ) {
    super(message); // Call the parent constructor with the message
    this.name = this.constructor.name; // Set the name of the error class
    this.statusCode = statusCode;
    this.errors = errors;
    this.payload = null;
    this.success = false;

    // Preserve the stack trace if provided; otherwise, capture it
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message, // Ensure the `message` property is included
      errors: this.errors || null,
      payload: this.payload,
    };
  }
}
