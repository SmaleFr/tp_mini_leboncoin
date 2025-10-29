import env from '../config/env.js';

function isEnabled() {
  return Boolean(env.mediaServiceUrl);
}

export async function saveImagesRemote(images, { subdir = 'ads' } = {}) {
  if (!isEnabled()) return null;
  const list = Array.isArray(images) ? images : [images];
  const res = await fetch(`${env.mediaServiceUrl.replace(/\/$/, '')}/images`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images: list, subdir }),
  });
  if (!res.ok) {
    throw new Error(`Media service save failed: ${res.status}`);
  }
  const payload = await res.json();
  return Array.isArray(payload?.images) ? payload.images : [];
}

export async function deleteImagesRemote(paths) {
  if (!isEnabled()) return null;
  const list = Array.isArray(paths) ? paths : [paths];
  await fetch(`${env.mediaServiceUrl.replace(/\/$/, '')}/images/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paths: list }),
  }).catch(() => {});
  return true;
}

export function mediaEnabled() {
  return isEnabled();
}

