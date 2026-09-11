import { pool } from '../../config/db';
import { AppError } from '../../utils/errors.util';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { signToken } from '../../utils/jwt.util';
import type { PublicUser, UserRecord, UserRole } from '../../types/models';
import type { SignupRequestBody, LoginRequestBody } from './auth.types';

function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

export async function registerUser(body: SignupRequestBody): Promise<PublicUser> {
  const { name, email, password } = body;
  const role: UserRole = body.role ?? 'contributor';

  const existing = await pool.query<{ id: number }>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existing.rows.length > 0) {
    throw AppError.badRequest('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(password);

  const result = await pool.query<UserRecord>(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, password, role, created_at, updated_at`,
    [name, email, hashedPassword, role]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.internal('Failed to create user');
  }

  return toPublicUser(user);
}

export async function loginUser(
  body: LoginRequestBody
): Promise<{ token: string; user: PublicUser }> {
  const { email, password } = body;

  const result = await pool.query<UserRecord>(
    'SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await comparePassword(password, user.password);
  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: user.id, name: user.name, role: user.role });

  return { token, user: toPublicUser(user) };
}