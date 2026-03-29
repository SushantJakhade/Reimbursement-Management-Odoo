import app from './app';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import prisma from './config/database';
import fs from 'fs';
import path from 'path';

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), env.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info(`Created upload directory: ${uploadDir}`);
}

// Start server
const server = app.listen(env.port, () => {
  logger.info(`🚀 Server running on http://localhost:${env.port}`);
  logger.info(`📋 API Docs: http://localhost:${env.port}/api/v1`);
  logger.info(`💚 Health: http://localhost:${env.port}/health`);
  logger.info(`🌍 Environment: ${env.nodeEnv}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    logger.info('Database connection closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after 10s');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { error: err });
});
