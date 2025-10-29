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
  tokenExpiresIn: Number.parseInt(process.env.TOKEN_EXPIRES_IN ?? '604800', 10), // 7 days default
  imageUploadDir: process.env.IMAGE_UPLOAD_DIR ?? 'uploads',
  mediaServiceUrl: process.env.MEDIA_SERVICE_URL,
};

export default config;
