import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.util';
import type { UserRole } from '../types/models';


export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('You do not have permission to perform this action'));
    }

    return next();
  };
}