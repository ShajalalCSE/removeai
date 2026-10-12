import { useState } from 'react';
import { Sparkles, Trash2, SlidersHorizontal, Loader2 } from 'lucide-react';
import type { CameraExifFields, CleanMode, CleanResult, ExifWriteResult, UploadedImage } from '../types/metadata';
import ImagePreview from './ImagePreview';
import MetadataViewer from './MetadataViewer';
import ExifEditor from './ExifEditor';
import DownloadButton from './DownloadButton';
import ProcessingStatus from './ProcessingStatus';
import { getImageWorkerClient } from '../lib/worker-client';
import { buildOutputFilename, cleanModeSuffix } from '../lib/image-export';

interface ImageCardProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onResultReady?: (id: string, blob: Blob, filename: string) => void;
}

type Tab = 'clean' | 'exif';

export default function ImageCard({ image, onRemove, onResultReady }: ImageCardProps) {
  const [tab, setTab] = useState<Tab>('clean');
  const [processingMode, setProcessingMode] = useState<CleanMode | 'exif' | null>(null);
  const [cleanResult, setCleanResult] = useState<CleanResult | null>(null);
  const [exifResult, setExifResult] = useState<ExifWriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const busy = processingMode !== null;

  const runClean = async (mode: CleanMode) => {
    setError(null);
    setProcessingMode(mode);
    try {
      const client = getImageWorkerClient();
      const result = await client.clean(image.file, mode);
      setCleanResult(result);
      onResultReady?.(image.id, result.blob, buildOutputFilename(image.file.name, result.format, cleanModeSuffix(result.mode)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'এই ছবিটি প্রসেস করার সময় কিছু একটা সমস্যা হয়েছে।');
    } finally {
      setProcessingMode(null);
    }
  };

  const runExifWrite = async (fields: CameraExifFields) => {
    setError(null);
    setProcessingMode('exif');
    try {
      const client = getImageWorkerClient();
      const result = await client.writeExif(image.file, fields);
      setExifResult(result);
      onResultReady?.(image.id, result.blob, buildOutputFilename(image.file.name, result.format, 'exif-edited'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'এই ছবিতে EXIF ডেটা লেখা যায়নি।');
    } finally {
      setProcessingMode(null);
    }
  };

  const downloadableBlob = cleanResult?.blob ?? exifResult?.blob ?? null;
  const downloadFilename = cleanResult
    ? buildOutputFilename(image.file.name, cleanResult.format, cleanModeSuffix(cleanResult.mode))
    : exifResult
      ? buildOutputFilename(image.file.name, exifResult.format, 'exif-edited')
      : '';

  return (
    <div className="rounded-2xl border border-cyber-700 bg-cyber-900/70 p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <ImagePreview
          previewUrl={image.previewUrl}
          filename={image.file.name}
          width={image.width}
          height={image.height}
          byteSize={image.file.size}
          format={image.format}
        />
        <button
          type="button"
          onClick={() => onRemove(image.id)}
          aria-label={`${image.file.name} সরান`}
          className="focus-ring flex-shrink-0 rounded-md p-1.5 text-cyber-400 hover:bg-cyber-800 hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {image.originalReport.aiSignals.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-950/40 px-2.5 py-1 text-xs font-medium text-amber-300">
          {image.originalReport.aiSignals.length}টি মেটাডেটা সিগন্যাল পাওয়া গেছে - নিচে বিস্তারিত দেখুন
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="relative">
          <span className="absolute -top-2 right-3 z-10 rounded-full bg-neon-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyber-950">
            রেকমেন্ডেড
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => runClean('ai')}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-neon-500/50 bg-neon-500/10 px-4 py-2.5 text-sm font-semibold text-neon-400 transition-all hover:-translate-y-0.5 hover:shadow-glow-green disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 disabled:hover:shadow-none"
          >
            {processingMode === 'ai' ? (
              <Loader2 size={16} className="flex-shrink-0 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={16} className="flex-shrink-0" aria-hidden="true" />
            )}
            AI মেটাডেটা রিমুভ করুন
          </button>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => runClean('all')}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-red-900/60 bg-red-950/20 px-4 py-2.5 text-sm font-semibold text-red-400 transition-all hover:-translate-y-0.5 hover:border-red-500/70 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0"
        >
          {processingMode === 'all' ? (
            <Loader2 size={16} className="flex-shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 size={16} className="flex-shrink-0" aria-hidden="true" />
          )}
          সব মেটাডেটা রিমুভ করুন
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => setTab(tab === 'exif' ? 'clean' : 'exif')}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-cyber-600 bg-cyber-900/60 px-4 py-2.5 text-sm font-semibold text-cyber-100 transition-all hover:-translate-y-0.5 hover:border-cyber-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0"
        >
          <SlidersHorizontal size={16} className="flex-shrink-0" aria-hidden="true" />
          {tab === 'exif' ? 'ম্যানুয়াল এডিটর লুকান' : 'ম্যানুয়াল EXIF এডিটর'}
        </button>
      </div>

      {downloadableBlob && (
        <div className="mt-3">
          <DownloadButton blob={downloadableBlob} filename={downloadFilename} highlight />
        </div>
      )}

      {busy && (
        <div className="mt-3">
          <ProcessingStatus label={processingMode === 'exif' ? 'EXIF ডেটা লেখা হচ্ছে…' : 'ছবি প্রসেস হচ্ছে…'} />
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{error}</div>
      )}

      {tab === 'exif' && (
        <div className="mt-4 border-t border-cyber-700 pt-4">
          <ExifEditor onApply={runExifWrite} busy={processingMode === 'exif'} />

          {exifResult && (
            <div className="mt-4 space-y-2 rounded-lg border border-cyber-700 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyber-400">
                লেখা হয়েছে ({exifResult.written.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exifResult.written.map((w, i) => (
                  <span key={i} className="rounded-full bg-neon-500/10 px-2.5 py-0.5 text-xs font-medium text-neon-400">
                    {w}
                  </span>
                ))}
              </div>
              {exifResult.skipped.length > 0 && (
                <>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-cyber-400">স্কিপড</p>
                  <ul className="space-y-1 text-sm text-cyber-200">
                    {exifResult.skipped.map((s, i) => (
                      <li key={i}>
                        <strong>{s.field}:</strong> {s.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {tab === 'clean' && (cleanResult || image.originalReport.fields.length > 0 || image.originalReport.aiSignals.length > 0) && (
        <div className="mt-4 border-t border-cyber-700 pt-4">
          <MetadataViewer original={image.originalReport} result={cleanResult ?? undefined} />
        </div>
      )}
    </div>
  );
}
