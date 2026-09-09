import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.util';
import { sendError } from '../utils/response.util';

/**
 * Catches requests to routes that don't exist.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

/**
 * Centralized error-handling middleware. Because every async route
 * handler is wrapped with `asyncHandler` (utils/errors.util.ts), both
 * synchronous throws and rejected promises end up here via next(err).
 * This must be registered LAST, after all routes, with 4 arguments so
 * Express recognizes it as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.errors);
    return;
  }

  // Unexpected/unhandled errors - log full detail server-side,
  // but never leak internals (like stack traces) to the client.
  console.error('Unhandled error:', err);
  sendError(res, 500, 'Internal server error');
}
