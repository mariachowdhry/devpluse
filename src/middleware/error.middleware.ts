
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.util';
import { sendError } from '../utils/response.util';

export function notFoundHandler(req:Request , res: Response): void {
  sendError(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

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

  console.error('Unhandled error:', err);
  sendError(res, 500, 'Internal server error');
}
