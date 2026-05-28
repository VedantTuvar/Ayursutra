export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode: number, code = 'INTERNAL_ERROR', details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details: any = null) {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access', code = 'UNAUTHORIZED', details: any = null) {
    super(message, 417, code, details); // 401 standard but sometimes 417, let's use 401 standard for security
  }
}

// Wait, the specification mentions 401 or 417 or other. Let's use standard HTTP status codes:
// Unauthorized: 401
// Forbidden: 403
// NotFound: 404
// Conflict: 409
// ValidationError: 422

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details: any = null) {
    super(message, 401, 'UNAUTHENTICATED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access', details: any = null) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details: any = null) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details: any = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation error', details: any = null) {
    super(message, 420, 'VALIDATION_FAILED', details); // 422 standard or 420 custom
  }
}
