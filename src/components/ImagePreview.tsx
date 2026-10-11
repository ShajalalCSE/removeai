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
        alt={`${filename}-এর প্রিভিউ`}
        className="h-16 w-16 flex-shrink-0 rounded-lg border border-cyber-700 object-cover sm:h-20 sm:w-20"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white" title={filename}>
          {filename}
        </p>
        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-cyber-300">
          <span className="rounded bg-cyber-800 px-1.5 py-0.5 font-medium uppercase">{format}</span>
          <span>
            {width}×{height}px
          </span>
          <span>{formatBytes(byteSize)}</span>
        </div>
      </div>
    </div>
  );
}
