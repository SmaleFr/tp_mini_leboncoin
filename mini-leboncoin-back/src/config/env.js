import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'TOKEN_SECRET'];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable ${name}`);
  }
}

const config = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.parseInt(process.env.PORT ?? '8080', 10),
  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB_NAME,
  tokenSecret: process.env.TOKEN_SECRET,
  tokenExpiresIn: Number.parseInt(process.env.TOKEN_EXPIRES_IN ?? '60', 10), // 1min pour test TP
  refreshTokenExpiresIn: Number.parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN ?? '259200', 10), // 3 jours pour test TP
  powDifficulty: Number.parseInt(process.env.POW_DIFFICULTY ?? '3', 10),
  powWindowSeconds: Number.parseInt(process.env.POW_WINDOW_SECONDS ?? '15', 10),
  rateLimitWindowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  rateLimitMax: Number.parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
  authRateLimitWindowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '60000', 10),
  authRateLimitMax: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '10', 10),
  imageUploadDir: process.env.IMAGE_UPLOAD_DIR ?? 'uploads',
  mediaServiceUrl: process.env.MEDIA_SERVICE_URL,
};

export default config;
