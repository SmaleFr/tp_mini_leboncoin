import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';

const ROOT = path.resolve(process.cwd(), 'media-uploads');

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
  if (!Array.isArray(images) || images.length === 0) return [];

  const targetDir = path.join(ROOT, subdir);
  await fs.mkdir(targetDir, { recursive: true });

  const saved = [];
  for (const input of images) {
    if (typeof input !== 'string' || !input.trim()) continue;
    let mime = 'image/jpeg';
    let base64 = input.trim();
    const match = DATA_URL_REGEX.exec(base64);
    if (match) { mime = match.groups.mime; base64 = match.groups.data; }
    try {
      const buffer = Buffer.from(base64, 'base64');
      if (!buffer || buffer.length === 0) continue;
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
    } catch (_) { /* ignore bad entries */ }
  }
  return saved;
}

export async function deleteImages(paths) {
  const list = Array.isArray(paths) ? paths : [paths];
  await Promise.all(list.map(async (p) => {
    if (!p) return;
    const filePath = path.join(ROOT, String(p));
    try { await fs.unlink(filePath); } catch (_) { /* ignore */ }
  }));
}

export function staticRouter() {
  // Serve files from the root media directory
  return express.static(ROOT);
}

