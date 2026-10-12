import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import ToolPageShell from './ToolPageShell';
import GenericFileUploader from './GenericFileUploader';
import { PlatformErrorBox } from './PlatformStatus';
import HackerButton from './HackerButton';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';
import { downloadBlob } from '../../lib/image-export';
import { formatBytes } from '../../lib/binary';
import type { AudioRemovalResult } from '../../lib/audio-metadata';

interface AudioRemoverToolProps {
  icon: LucideIcon;
  pageTitle: string;
  headline: string;
  description: string;
  ctaLabel: string;
  howToUse: string[];
  faq: [string, string][];
  relatedToolIds: string[];
}

/** Shared engine behind both "MP3 ID3 Tag Cleaner" and "Audio Metadata Remover" -
 * they're the same operation under different branding/copy, since MP3/ID3 is
 * currently the only well-supported audio format. */
export default function AudioRemoverTool({ icon: Icon, pageTitle, headline, description, ctaLabel, howToUse, faq, relatedToolIds }: AudioRemoverToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AudioRemovalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
  };

  const clear = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getDocumentWorkerClient().removeAudio(file);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ট্যাগ রিমুভ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^./\\]+$/, '') || 'audio';
    downloadBlob(result.blob, `${base}-cleaned.mp3`);
  };

  return (
    <ToolPageShell icon={Icon} pageTitle={pageTitle} headline={headline} description={description} howToUse={howToUse} faq={faq} relatedToolIds={relatedToolIds}>
      <GenericFileUploader
        accept="audio/mpeg,.mp3"
        acceptLabel="MP3"
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        onFileSelected={handleFile}
        selectedFile={file}
        onClear={clear}
        disabled={busy}
      />

      {file && !result && (
        <div className="mt-4">
          <HackerButton icon={<Icon size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="ট্যাগ রিমুভ করা হচ্ছে…">
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
            {result.removed.length > 0 ? result.removed.join(' ও ') + ' রিমুভ করা হয়েছে' : 'কোনো ট্যাগ পাওয়া যায়নি'} ·{' '}
            {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)}
          </p>
          <p className="mt-1 text-xs text-cyber-400">অডিও ফ্রেম ডেটা বাইট-ফর-বাইট অপরিবর্তিত থাকে - শুধু ট্যাগ ব্লক রিমুভ করা হয়েছে, কোনো রি-এনকোডিং হয়নি।</p>
          <div className="mt-4">
            <HackerButton accent="blue" onClick={download}>
              DOWNLOAD AUDIO
            </HackerButton>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
