// Shared engine behind the image-optimization tools (Compressor, Resizer,
// Format Converter, PNG<->JPG, WebP Converter). Unlike the metadata tools,
// this one genuinely re-encodes pixels through a canvas - that's the whole
// point here (changing format/quality/dimensions), so it's the one place in
// the app where "no recompression" does not apply, and the UI says so.
//
// Uses OffscreenCanvas so this runs identically on the main thread and
// inside the Web Worker (a plain HTMLCanvasElement can't be used off-thread).

import type { ImageFormat } from '../types/metadata';
import { MIME_BY_FORMAT } from './format';

export interface TransformOptions {
  format: ImageFormat;
  quality?: number; // 0-1, used for jpeg/webp output; ignored for png
  width?: number; // exact output dimensions; if omitted, source size (or maxWidth/maxHeight-scaled) is used
  height?: number;
  maxWidth?: number; // scale down (never up) to fit within these bounds, preserving aspect ratio
  maxHeight?: number;
}

export interface TransformResult {
  blob: Blob;
  format: ImageFormat;
  width: number;
  height: number;
  bytesBefore: number;
  bytesAfter: number;
}

export async function transformImage(file: File, options: TransformOptions): Promise<TransformResult> {
  const bitmap = await createImageBitmap(file);

  let targetWidth = options.width ?? bitmap.width;
  let targetHeight = options.height ?? bitmap.height;

  if (!options.width && !options.height && (options.maxWidth || options.maxHeight)) {
    const scale = Math.min(
      options.maxWidth ? options.maxWidth / bitmap.width : 1,
      options.maxHeight ? options.maxHeight / bitmap.height : 1,
      1,
    );
    targetWidth = Math.max(1, Math.round(bitmap.width * scale));
    targetHeight = Math.max(1, Math.round(bitmap.height * scale));
  }

  const canvas = new OffscreenCanvas(targetWidth, targetHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('এই ব্রাউজারে ক্যানভাস প্রসেসিং সাপোর্টেড না।');

  // JPEG has no alpha channel - fill white first so transparent areas don't turn black.
  if (options.format === 'jpeg') {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  }
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  bitmap.close();

  const mime = MIME_BY_FORMAT[options.format];
  const blob = await canvas.convertToBlob({ type: mime, quality: options.format === 'png' ? undefined : options.quality });

  return {
    blob,
    format: options.format,
    width: targetWidth,
    height: targetHeight,
    bytesBefore: file.size,
    bytesAfter: blob.size,
  };
}
