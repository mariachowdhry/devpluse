import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../types/models';


export interface JwtPayload {
  id: number;
  name: string;
  role: UserRole;
}

export function signToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as NonNullable<SignOptions['expiresIn']>,
  };
  return jwt.sign(payload, env.jwtSecret, options);
}


export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}