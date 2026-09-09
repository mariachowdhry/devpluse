/**
 * Custom application error carrying an HTTP status code.
 * Thrown from services/controllers and caught by the centralized
 * error-handling middleware (see middleware/error.middleware.ts).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, errors?: unknown): AppError {
    return new AppError(400, message, errors);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(401, message);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(403, message);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(404, message);
  }

  static conflict(message: string): AppError {
    return new AppError(409, message);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(500, message);
  }
}

/**
 * Wraps an async Express route handler so any rejected promise
 * is forwarded to next(), letting the centralized error middleware
 * handle it instead of requiring try/catch in every controller.
 */
import { NextFunction, Request, Response } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}
