import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Basic security and parsing middlewares
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // In non-production, permit all localhost / 127.0.0.1 ports (5173, 5174, 5175, etc.)
        if (
          config.nodeEnv !== 'production' &&
          (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin))
        ) {
          return callback(null, true);
        }

        // Production configured origin
        if (origin === config.clientOrigin || origin === 'http://localhost:5173') {
          return callback(null, true);
        }

        callback(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Request logger
  if (config.nodeEnv !== 'test') {
    app.use(requestLogger);
  }

  // Root welcome route for quick browser ping
  app.get('/', (_req, res) => {
    res.json({
      name: 'NexHire API',
      description: 'Internship & Placement Management System API',
      status: 'active',
      healthCheck: '/api/health',
    });
  });

  // Main API Router
  app.use('/api', apiRouter);

  // Catch 404 and forward to error handler
  app.use(notFoundHandler);

  // Central error handler
  app.use(errorHandler);

  return app;
}
