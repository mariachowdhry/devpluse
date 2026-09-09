import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from '../types/models';

export interface JwtPayload {
  id: number;
  name: string;
  role: UserRole;
}

/**
 * Signs a JWT containing the fields needed downstream to identify
 * the requester and enforce role-based permissions (id, name, role).
 */
export function signToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.jwtSecret, options);
}

/**
 * Verifies a JWT's signature and expiry, returning the decoded payload.
 * Throws if the token is invalid or expired.
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
