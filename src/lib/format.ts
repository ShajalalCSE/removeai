import type { ImageFormat } from '../types/metadata';
import { isJpeg } from './jpeg';
import { isPng } from './png';
import { isWebp } from './webp';

export function sniffFormat(bytes: Uint8Array): ImageFormat | null {
  if (isJpeg(bytes)) return 'jpeg';
  if (isPng(bytes)) return 'png';
  if (isWebp(bytes)) return 'webp';
  return null;
}

export const MIME_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

export const EXTENSION_BY_FORMAT: Record<ImageFormat, string> = {
  jpeg: 'jpg',
  png: 'png',
  webp: 'webp',
};

export const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB per image

/** Uses createImageBitmap rather than an <img> element so this also works inside a Web Worker. */
export async function getImageDimensions(file: Blob): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}
