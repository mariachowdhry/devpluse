import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../../utils/errors.util';
import { sendSuccess } from '../../utils/response.util';
import { registerUser, loginUser } from './auth.service';
import {
  validateEmail,
  validateName,
  validatePassword,
  validateRole,
} from '../../utils/validation.util';
import { SignupRequestBody, LoginRequestBody } from './auth.types';

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<SignupRequestBody>;

  const errors: Record<string, string> = {};
  const nameErr = validateName(body.name);
  const emailErr = validateEmail(body.email);
  const passwordErr = validatePassword(body.password);
  const roleErr = validateRole(body.role);
  if (nameErr) errors.name = nameErr;
  if (emailErr) errors.email = emailErr;
  if (passwordErr) errors.password = passwordErr;
  if (roleErr) errors.role = roleErr;

  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest('Validation failed', errors);
  }

  const user = await registerUser({
    name: body.name!.trim(),
    email: body.email!.trim().toLowerCase(),
    password: body.password!,
    role: body.role,
  });

  sendSuccess(res, 201, 'User registered successfully', user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as Partial<LoginRequestBody>;

  const errors: Record<string, string> = {};
  const emailErr = validateEmail(body.email);
  if (emailErr) errors.email = emailErr;
  if (!body.password) errors.password = 'password is required';

  if (Object.keys(errors).length > 0) {
    throw AppError.badRequest('Validation failed', errors);
  }

  const { token, user } = await loginUser({
    email: body.email!.trim().toLowerCase(),
    password: body.password!,
  });

  sendSuccess(res, 200, 'Login successful', { token, user });
});
