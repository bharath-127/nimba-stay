import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// Load server/.env regardless of the directory the process was started from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';
const isTest = nodeEnv === 'test';

const mongoUri = isTest ? process.env.MONGO_URI_TEST : process.env.MONGO_URI;

if (!mongoUri) {
  const key = isTest ? 'MONGO_URI_TEST' : 'MONGO_URI';
  throw new Error(
    `${key} is not set. Copy server/.env.example to server/.env and fill in your MongoDB connection string.`
  );
}

export const env = Object.freeze({
  nodeEnv,
  isTest,
  isProduction: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
});
