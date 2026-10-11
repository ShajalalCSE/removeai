import type { CleanMode, ImageFormat } from '../types/metadata';
import { EXTENSION_BY_FORMAT } from './format';

export function buildOutputFilename(originalName: string, format: ImageFormat, suffix: string): string {
  const base = originalName.replace(/\.[^./\\]+$/, '') || 'image';
  const ext = EXTENSION_BY_FORMAT[format];
  return `${base}-${suffix}.${ext}`;
}

export function cleanModeSuffix(mode: CleanMode): string {
  return mode === 'ai' ? 'ai-metadata-removed' : 'metadata-removed';
}

/** Triggers a browser download for a Blob and revokes the temporary URL shortly after. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
