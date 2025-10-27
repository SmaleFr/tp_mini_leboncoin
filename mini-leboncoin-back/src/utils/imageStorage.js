import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { uploadDir } from '../config/paths.js';

const DATA_URL_REGEX = /^data:(?<mime>image\/[a-zA-Z0-9.+-]+);base64,(?<data>[A-Za-z0-9+/=]+)$/;

const MIME_EXTENSION = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function getExtension(mime) {
  return MIME_EXTENSION[mime] ?? 'bin';
}

export async function saveBase64Images(images, { subdir = 'ads' } = {}) {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  const targetDir = path.join(uploadDir, subdir);
  await fs.mkdir(targetDir, { recursive: true });

  const saved = [];

  for (const input of images) {
    if (typeof input !== 'string' || !input.trim()) {
      // skip invalid entries silently
      // eslint-disable-next-line no-continue
      continue;
    }

    let mime = 'image/jpeg';
    let base64 = input.trim();
    const match = DATA_URL_REGEX.exec(base64);
    if (match) {
      mime = match.groups.mime;
      base64 = match.groups.data;
    }

    try {
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer || buffer.length === 0) {
        // eslint-disable-next-line no-continue
        continue;
      }
      const extension = getExtension(mime);
      const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const filePath = path.join(targetDir, filename);
      await fs.writeFile(filePath, buffer);
      saved.push({
        filename,
        mime,
        path: path.join(subdir, filename).replace(/\\/g, '/'),
        size: buffer.length,
      });
    } catch (error) {
      // skip invalid base64 entries
    }
  }

  return saved;
}

export async function deleteImages(imageEntries) {
  if (!imageEntries) return;
  const entries = Array.isArray(imageEntries) ? imageEntries : [imageEntries];
  await Promise.all(
    entries.map(async (entry) => {
      const relativePath = typeof entry === 'string' ? entry : entry.path;
      if (!relativePath) return;
      const filePath = path.join(uploadDir, relativePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // ignore missing files
      }
    }),
  );
}
