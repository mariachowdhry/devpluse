import { Router } from 'express';
import { signup, login } from './auth.controller';

const router = Router();

// POST /api/auth/signup - Public
router.post('/signup', signup);

// POST /api/auth/login - Public
router.post('/login', login);

export default router;
