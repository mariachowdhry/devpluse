import { Response } from 'express';

interface SuccessBody<T> {
  success: true;
  message: string;
  data: T;
}

interface ErrorBody {
  success: false;
  message: string;
  errors?: unknown;
}

/**
 * Sends a standardized success response.
 */
export function sendSuccess<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T
): Response<SuccessBody<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Sends a standardized error response.
 */
export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown
): Response<ErrorBody> {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== undefined ? { errors } : {}),
  });
}
