import { useCallback, useState } from 'react';
import { Layers, X, CheckCircle2 } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import HackerButton from '../../components/platform/HackerButton';
import { PlatformProcessingStatus } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import { buildOutputFilename, cleanModeSuffix, downloadBlob } from '../../lib/image-export';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/format';
import { formatBytes } from '../../lib/binary';
import type { CleanMode } from '../../types/metadata';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  blob?: Blob;
  filename?: string;
  error?: string;
}

let counter = 0;

export default function BulkMetadataRemover() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [mode, setMode] = useState<CleanMode>('ai');
  const [running, setRunning] = useState(false);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const items: QueueItem[] = Array.from(fileList)
      .filter((f) => ACCEPTED_MIME_TYPES.includes(f.type) && f.size > 0 && f.size <= MAX_FILE_SIZE_BYTES)
      .map((f) => {
        counter += 1;
        return { id: `bulk-${counter}`, file: f, status: 'pending' as const };
      });
    setQueue((prev) => [...prev, ...items]);
  }, []);

  const removeItem = (id: string) => setQueue((prev) => prev.filter((i) => i.id !== id));

  const runAll = async () => {
    setRunning(true);
    const client = getImageWorkerClient();
    for (const item of queue) {
      if (item.status === 'done') continue;
      setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'processing' } : i)));
      try {
        const result = await client.clean(item.file, mode);
        const filename = buildOutputFilename(item.file.name, result.format, cleanModeSuffix(result.mode));
        setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'done', blob: result.blob, filename } : i)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'প্রসেস করা যায়নি।';
        setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'error', error: message } : i)));
      }
    }
    setRunning(false);
  };

  const downloadAll = () => {
    queue
      .filter((i) => i.status === 'done' && i.blob && i.filename)
      .forEach((i, idx) => {
        setTimeout(() => downloadBlob(i.blob!, i.filename!), idx * 250);
      });
  };

  const doneCount = queue.filter((i) => i.status === 'done').length;

  return (
    <ToolPageShell
      icon={Layers}
      pageTitle="বাল্ক ইমেজ মেটাডেটা রিমুভার"
      headline="CLEAN FILES IN BULK"
      description="একসাথে একাধিক সাপোর্টেড ছবি প্রসেস করুন এবং পরিষ্কার করা ফাইলগুলো একসাথে ডাউনলোড করুন।"
      howToUse={['একাধিক JPEG, PNG বা WebP ছবি বেছে নিন।', 'AI মেটাডেটা বা সব মেটাডেটা রিমুভাল মোড বেছে নিন।', '"START BULK CLEANUP" ক্লিক করুন, তারপর সবগুলো ডাউনলোড করুন।']}
      faq={[
        ['একসাথে কতগুলো ফাইল প্রসেস করা যায়?', 'কোনো হার্ড লিমিট নেই, তবে অনেকগুলো বড় ফাইল একসাথে প্রসেস করলে আপনার ব্রাউজারের মেমোরির উপর নির্ভর করে সময় বেশি লাগতে পারে। প্রতিটি ফাইল আলাদাভাবে, একে একে প্রসেস হয়।'],
        ['"ডাউনলোড অল" ক্লিক করলে কি একটি ZIP ফাইল হয়?', 'না, প্রতিটি ফাইল আলাদাভাবে ডাউনলোড হয় (সামান্য বিলম্বে একটির পর একটি) - এজন্য আপনার ব্রাউজার একাধিক ডাউনলোডের অনুমতি চাইতে পারে।'],
      ]}
      relatedToolIds={['exif-metadata-remover', 'iptc-xmp-cleaner', 'metadata-comparison']}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => document.getElementById('bulk-file-input')?.click()}
        className="focus-ring-neon flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-cyber-600 bg-cyber-900/40 px-6 py-10 text-center hover:border-neon-500/60"
      >
        <Layers size={28} className="mb-3 text-neon-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-white">একাধিক ছবি বেছে নিতে ক্লিক করুন</p>
        <p className="mt-1 text-xs text-cyber-300">JPEG, PNG বা WebP · সর্বোচ্চ {formatBytes(MAX_FILE_SIZE_BYTES)} প্রতি ফাইল</p>
        <input
          id="bulk-file-input"
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES.join(',')}
          className="sr-only"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {queue.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-2">
              {(['ai', 'all'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={running}
                  onClick={() => setMode(m)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-semibold uppercase transition-colors disabled:opacity-50 ${
                    mode === m ? 'border-neon-500 bg-neon-500/10 text-neon-400' : 'border-cyber-600 text-cyber-300 hover:border-cyber-400'
                  }`}
                >
                  {m === 'ai' ? 'AI মেটাডেটা' : 'সব মেটাডেটা'}
                </button>
              ))}
            </div>
            <HackerButton icon={<Layers size={15} aria-hidden="true" />} onClick={runAll} busy={running} busyLabel="প্রসেস হচ্ছে…">
              START BULK CLEANUP
            </HackerButton>
            {doneCount > 0 && (
              <HackerButton accent="blue" onClick={downloadAll}>
                DOWNLOAD ALL ({doneCount})
              </HackerButton>
            )}
          </div>

          <ul className="mt-4 space-y-2">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-cyber-700 bg-cyber-900/50 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.file.name}</p>
                  <p className="text-xs text-cyber-400">
                    {formatBytes(item.file.size)}
                    {item.status === 'error' && <span className="text-red-400"> · {item.error}</span>}
                  </p>
                </div>
                {item.status === 'processing' && <PlatformProcessingStatus label="" />}
                {item.status === 'done' && <CheckCircle2 size={18} className="flex-shrink-0 text-neon-400" aria-hidden="true" />}
                {item.status !== 'processing' && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`${item.file.name} সরান`}
                    className="focus-ring-neon flex-shrink-0 rounded-md p-1 text-cyber-400 hover:bg-cyber-800 hover:text-white"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ToolPageShell>
  );
}
