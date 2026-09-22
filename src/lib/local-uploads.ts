import { mkdir } from 'fs/promises';
import path from 'path';

/** Persistent upload root (outside `.next`, survives rebuilds). */
export function getUploadsRoot(): string {
  return path.join(process.cwd(), 'uploads');
}

export function getImagesUploadDir(): string {
  return path.join(getUploadsRoot(), 'images');
}

export async function ensureImagesUploadDir(): Promise<string> {
  const dir = getImagesUploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Safe relative URL served by /api/media/images/[filename] */
export function localImagePublicUrl(filename: string): string {
  return `/api/media/images/${encodeURIComponent(filename)}`;
}

/** Reject path traversal / unexpected names. */
export function isSafeUploadFilename(filename: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(filename) && !filename.includes('..');
}
