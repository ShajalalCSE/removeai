import { formatBytes } from '../lib/binary';
import type { ImageFormat } from '../types/metadata';

interface ImagePreviewProps {
  previewUrl: string;
  filename: string;
  width: number;
  height: number;
  byteSize: number;
  format: ImageFormat;
}

export default function ImagePreview({ previewUrl, filename, width, height, byteSize, format }: ImagePreviewProps) {
  return (
    <div className="flex gap-3">
      <img
        src={previewUrl}
        alt={`Preview of ${filename}`}
        className="h-20 w-20 flex-shrink-0 rounded-lg border border-ink-100 object-cover dark:border-ink-800"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 dark:text-white" title={filename}>
          {filename}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-ink-500 dark:text-ink-400">
          <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium uppercase dark:bg-ink-800">{format}</span>
          <span>
            {width}×{height}px
          </span>
          <span>{formatBytes(byteSize)}</span>
        </div>
      </div>
    </div>
  );
}
