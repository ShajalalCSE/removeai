import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import ToolPageShell from './ToolPageShell';
import PlatformUploader from './PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from './PlatformStatus';
import HackerButton from './HackerButton';
import { getImageWorkerClient } from '../../lib/worker-client';
import { downloadBlob } from '../../lib/image-export';
import { EXTENSION_BY_FORMAT, getImageDimensions } from '../../lib/format';
import { formatBytes } from '../../lib/binary';
import type { ImageFormat } from '../../types/metadata';
import type { TransformResult } from '../../lib/image-transform';

interface ImageTransformToolProps {
  icon: LucideIcon;
  pageTitle: string;
  headline: string;
  description: string;
  howToUse: string[];
  faq: [string, string][];
  relatedToolIds: string[];
  fixedFormat?: ImageFormat;
  showQuality?: boolean;
  showDimensions?: boolean;
  ctaLabel: string;
  busyLabel: string;
  suffix: string;
}

const FORMAT_OPTIONS: { value: ImageFormat; label: string }[] = [
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
];

export default function ImageTransformTool({
  icon,
  pageTitle,
  headline,
  description,
  howToUse,
  faq,
  relatedToolIds,
  fixedFormat,
  showQuality,
  showDimensions,
  ctaLabel,
  busyLabel,
  suffix,
}: ImageTransformToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceDims, setSourceDims] = useState<{ width: number; height: number } | null>(null);
  const [format, setFormat] = useState<ImageFormat>(fixedFormat ?? 'jpeg');
  const [quality, setQuality] = useState(80);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TransformResult | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setWidth('');
    setHeight('');
    try {
      const dims = await getImageDimensions(f);
      setSourceDims(dims);
    } catch {
      setSourceDims(null);
    }
  };

  const clear = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setSourceDims(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const w = width.trim() ? Number(width) : undefined;
      const h = height.trim() ? Number(height) : undefined;
      const result = await getImageWorkerClient().transform(file, {
        format,
        quality: quality / 100,
        width: w,
        height: h,
      });
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ছবি প্রসেস করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^./\\]+$/, '') || 'image';
    downloadBlob(result.blob, `${base}-${suffix}.${EXTENSION_BY_FORMAT[result.format]}`);
  };

  return (
    <ToolPageShell
      icon={icon}
      pageTitle={pageTitle}
      headline={headline}
      description={description}
      howToUse={howToUse}
      faq={faq}
      relatedToolIds={relatedToolIds}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {file && (
        <div className="mt-4 space-y-4 rounded-lg border border-cyber-700 bg-cyber-900/40 p-4">
          {!fixedFormat && (
            <div>
              <label className="mb-1 block text-xs font-medium text-cyber-300">আউটপুট ফরম্যাট</label>
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormat(opt.value)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase transition-colors ${
                      format === opt.value ? 'border-neon-500 bg-neon-500/10 text-neon-400' : 'border-cyber-600 text-cyber-300 hover:border-cyber-400'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showQuality && format !== 'png' && (
            <div>
              <label htmlFor="quality" className="mb-1 block text-xs font-medium text-cyber-300">
                কোয়ালিটি: {quality}%
              </label>
              <input
                id="quality"
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full accent-neon-500"
              />
            </div>
          )}

          {showDimensions && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="width" className="mb-1 block text-xs font-medium text-cyber-300">
                  প্রস্থ (px){sourceDims ? ` - অরিজিনাল ${sourceDims.width}` : ''}
                </label>
                <input
                  id="width"
                  type="number"
                  min={1}
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder={sourceDims ? String(sourceDims.width) : ''}
                  className="focus-ring w-full rounded-md border border-cyber-600 bg-cyber-900 px-2.5 py-1.5 text-sm text-white placeholder:text-cyber-500"
                />
              </div>
              <div>
                <label htmlFor="height" className="mb-1 block text-xs font-medium text-cyber-300">
                  উচ্চতা (px){sourceDims ? ` - অরিজিনাল ${sourceDims.height}` : ''}
                </label>
                <input
                  id="height"
                  type="number"
                  min={1}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={sourceDims ? String(sourceDims.height) : ''}
                  className="focus-ring w-full rounded-md border border-cyber-600 bg-cyber-900 px-2.5 py-1.5 text-sm text-white placeholder:text-cyber-500"
                />
              </div>
            </div>
          )}

          <HackerButton onClick={run} busy={busy} busyLabel={busyLabel}>
            {ctaLabel}
          </HackerButton>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
          <p className="font-mono text-sm font-semibold text-neon-400">
            {result.width}×{result.height}px · {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)}
          </p>
          <p className="mt-1 text-xs text-cyber-400">
            এই অপারেশন পিক্সেল রি-এনকোড করে (ফরম্যাট/সাইজ/কোয়ালিটি পরিবর্তনের জন্য প্রয়োজনীয়) - এটি মেটাডেটা রিমুভাল
            টুলগুলোর মতো লসলেস না।
          </p>
          <div className="mt-4">
            <HackerButton accent="blue" onClick={download}>
              DOWNLOAD IMAGE
            </HackerButton>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
