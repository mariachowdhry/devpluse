import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hashes a plaintext password using bcrypt with the configured salt rounds (8-12).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, env.bcryptSaltRounds);
}

/**
 * Compares a plaintext password against a bcrypt hash.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
