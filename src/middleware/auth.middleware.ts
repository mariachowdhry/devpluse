
import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.util';
import { verifyToken } from '../utils/jwt.util';


export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header) {
    return next(AppError.unauthorized('Authentication token is required'));
  }

  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : header.trim();

  if (!token) {
    return next(AppError.unauthorized('Authentication token is required'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    return next();
  } catch (err) {
    return next(AppError.unauthorized('Invalid or expired authentication token'));
  }
}
