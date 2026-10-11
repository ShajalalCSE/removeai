import { useState } from 'react';
import type { CameraExifFields, CleanMode, CleanResult, ExifWriteResult, UploadedImage } from '../types/metadata';
import ImagePreview from './ImagePreview';
import MetadataViewer from './MetadataViewer';
import ExifEditor from './ExifEditor';
import DownloadButton from './DownloadButton';
import ProcessingStatus from './ProcessingStatus';
import { getImageWorkerClient } from '../lib/worker-client';
import { buildOutputFilename, cleanModeSuffix } from '../lib/image-export';
import { PIXEL_7_PRESET, nowAsExifDateTime } from '../lib/presets';

interface ImageCardProps {
  image: UploadedImage;
  onRemove: (id: string) => void;
  onResultReady?: (id: string, blob: Blob, filename: string) => void;
}

type Tab = 'clean' | 'exif';

export default function ImageCard({ image, onRemove, onResultReady }: ImageCardProps) {
  const [tab, setTab] = useState<Tab>('clean');
  const [processingMode, setProcessingMode] = useState<CleanMode | 'exif' | 'pixel-preset' | null>(null);
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

  const runExifWrite = async (fields: CameraExifFields, mode: 'exif' | 'pixel-preset' = 'exif') => {
    setError(null);
    setProcessingMode(mode);
    try {
      const client = getImageWorkerClient();
      const result = await client.writeExif(image.file, fields);
      setExifResult(result);
      onResultReady?.(image.id, result.blob, buildOutputFilename(image.file.name, result.format, 'exif-edited'));
      if (mode === 'pixel-preset') setTab('exif');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'এই ছবিতে EXIF ডেটা লেখা যায়নি।');
    } finally {
      setProcessingMode(null);
    }
  };

  const runPixelPreset = () =>
    runExifWrite({ ...PIXEL_7_PRESET.fields, dateTimeOriginal: nowAsExifDateTime() }, 'pixel-preset');

  const downloadableBlob = cleanResult?.blob ?? exifResult?.blob ?? null;
  const downloadFilename = cleanResult
    ? buildOutputFilename(image.file.name, cleanResult.format, cleanModeSuffix(cleanResult.mode))
    : exifResult
      ? buildOutputFilename(image.file.name, exifResult.format, 'exif-edited')
      : '';

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card dark:border-ink-800 dark:bg-ink-900">
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
          className="focus-ring flex-shrink-0 rounded-md p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {image.originalReport.aiSignals.length > 0 && (
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
          {image.originalReport.aiSignals.length}টি মেটাডেটা সিগন্যাল পাওয়া গেছে - নিচে বিস্তারিত দেখুন
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <button
          type="button"
          disabled={busy}
          onClick={() => runClean('ai')}
          className="focus-ring relative flex flex-col items-start gap-0.5 rounded-lg bg-ink-900 p-3 text-left shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 dark:bg-accent-600"
        >
          <span className="absolute -top-2 right-2 rounded-full bg-accent-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            রেকমেন্ডেড
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
              <path d="M12 3v3m0 12v3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M3 12h3m12 0h3M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" fill="currentColor" />
            </svg>
            AI মেটাডেটা রিমুভ করুন
          </span>
          <span className="text-xs text-white/70">AI ট্যাগ মুছে দেয়, ক্যামেরার তথ্য রাখে</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => runClean('all')}
          className="focus-ring flex flex-col items-start gap-0.5 rounded-lg border border-red-200 bg-red-50 p-3 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 dark:border-red-900/50 dark:bg-red-950/30"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 dark:text-red-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
              <path d="M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7m2 0 -.7 12.3A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.7L7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            সব মেটাডেটা রিমুভ করুন
          </span>
          <span className="text-xs text-red-700/70 dark:text-red-300/70">ক্যামেরার তথ্যসহ সবকিছু মুছে দেয়</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={runPixelPreset}
          className="focus-ring flex flex-col items-start gap-0.5 rounded-lg border border-accent-300 bg-accent-50 p-3 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 dark:border-accent-700 dark:bg-accent-950/30"
        >
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-800 dark:text-accent-200">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="flex-shrink-0">
              <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1-1.5h7l1 1.5h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            ক্যামেরা ডেটা যোগ করুন
          </span>
          <span className="text-xs text-accent-800/70 dark:text-accent-200/70">1-ক্লিকে Pixel 7-এর তথ্য, টাইপ করার দরকার নেই</span>
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={() => setTab(tab === 'exif' ? 'clean' : 'exif')}
          className="focus-ring flex flex-col items-start gap-0.5 rounded-lg border border-ink-200 bg-white p-3 text-left transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:bg-ink-900"
        >
          <span className="text-sm font-semibold text-ink-700 dark:text-ink-200">
            {tab === 'exif' ? 'ম্যানুয়াল এডিটর লুকান' : 'ম্যানুয়াল EXIF এডিটর'}
          </span>
          <span className="text-xs text-ink-500 dark:text-ink-400">নিজের ক্যামেরার তথ্য টাইপ করুন</span>
        </button>
      </div>

      {downloadableBlob && (
        <div className="mt-3">
          <DownloadButton blob={downloadableBlob} filename={downloadFilename} />
        </div>
      )}

      {busy && (
        <div className="mt-3">
          <ProcessingStatus
            label={
              processingMode === 'exif'
                ? 'EXIF ডেটা লেখা হচ্ছে…'
                : processingMode === 'pixel-preset'
                  ? 'Pixel 7 ক্যামেরা ডেটা যোগ হচ্ছে…'
                  : 'ছবি প্রসেস হচ্ছে…'
            }
          />
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {tab === 'exif' && (
        <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800">
          <ExifEditor onApply={runExifWrite} busy={processingMode === 'exif'} />

          {exifResult && (
            <div className="mt-4 space-y-2 rounded-lg border border-ink-100 p-3 dark:border-ink-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                লেখা হয়েছে ({exifResult.written.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exifResult.written.map((w, i) => (
                  <span key={i} className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
                    {w}
                  </span>
                ))}
              </div>
              {exifResult.skipped.length > 0 && (
                <>
                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">স্কিপড</p>
                  <ul className="space-y-1 text-sm text-ink-600 dark:text-ink-300">
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
        <div className="mt-4 border-t border-ink-100 pt-4 dark:border-ink-800">
          <MetadataViewer original={image.originalReport} result={cleanResult ?? undefined} />
        </div>
      )}
    </div>
  );
}
