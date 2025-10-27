import process from 'node:process';
import app from './app.js';
import env from './config/env.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';
import { ensureIndexes } from './config/indexes.js';

async function bootstrap() {
  try {
    await connectMongo();
    await ensureIndexes();
    const server = app.listen(env.port, () => {
      console.log(`Server listening on port ${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`Received ${signal}, shutting down...`);
      server.close(async () => {
        await disconnectMongo();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
