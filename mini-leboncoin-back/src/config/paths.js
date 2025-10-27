import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import env from './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const projectRoot = path.resolve(__dirname, '..', '..');
export const uploadDir = path.resolve(projectRoot, env.imageUploadDir);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
