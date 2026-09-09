import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import authRoutes from './modules/auth/auth.routes';
import issuesRoutes from './modules/issues/issues.routes';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';
import { sendSuccess } from './utils/response.util';

const app: Application = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, 200, 'DevPulse API is running', { status: 'ok' });
});
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, 200, 'Healthy', { status: 'ok' });
});

// Modular routers
app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);

// 404 + centralized error handler (must be registered last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
