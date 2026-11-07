import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { supportsTransactions } from './config/db.js';
import { AppError } from './utils/AppError.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Allow non-browser clients (Postman, curl, tests) that send no Origin header.
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new AppError(403, 'CORS_NOT_ALLOWED', `Origin ${origin} is not allowed`));
      },
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    })
  );
  app.use(express.json({ limit: '10kb' }));
  if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'nimba-stay-api',
        transactions: supportsTransactions() ? 'enabled' : 'fallback',
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
