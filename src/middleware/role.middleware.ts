import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/errors.util';
import { UserRole } from '../types/models';

/**
 * Restricts a route to one or more roles. Must run after `authenticate`
 * so req.user is populated. Role verification happens before any
 * privileged operation is performed.
 */
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
