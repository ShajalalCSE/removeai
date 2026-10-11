import { useState } from 'react';
import { Eraser } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import HackerButton from '../../components/platform/HackerButton';
import { getImageWorkerClient } from '../../lib/worker-client';
import { buildOutputFilename, cleanModeSuffix, downloadBlob } from '../../lib/image-export';
import type { CleanResult } from '../../types/metadata';

export default function ExifRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CleanResult | null>(null);
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
      const result = await getImageWorkerClient().clean(file, 'all');
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'মেটাডেটা রিমুভ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, buildOutputFilename(file.name, result.format, cleanModeSuffix(result.mode)));
  };

  return (
    <ToolPageShell
      icon={Eraser}
      pageTitle="EXIF মেটাডেটা রিমুভার"
      headline="WIPE HIDDEN METADATA"
      description="প্রসেসিং পদ্ধতি যতটা সম্ভব নির্ভুলভাবে ছবির দৃশ্যমান অংশ অক্ষুণ্ণ রেখে সাপোর্টেড EXIF, XMP, IPTC ও C2PA মেটাডেটা রিমুভ করুন - কোনো রি-কম্প্রেশন ছাড়াই।"
      howToUse={[
        'একটি JPEG, PNG বা WebP ছবি আপলোড করুন।',
        '"CLEAN IMAGE" বাটনে ক্লিক করুন।',
        'ফলাফল পর্যালোচনা করে পরিষ্কার করা ছবি ডাউনলোড করুন।',
      ]}
      faq={[
        ['এটি কি ছবির মান খারাপ করে?', 'না। মেটাডেটা সরাসরি ফাইল স্ট্রাকচার থেকে রিমুভ করা হয়, পিক্সেল ডেটা কখনো ক্যানভাসের মাধ্যমে রি-এনকোড করা হয় না।'],
        [
          'শুধু ক্যামেরা তথ্য রেখে AI-নির্দিষ্ট মেটাডেটা মুছতে চাইলে?',
          'হোমপেজের মূল টুলে গিয়ে "AI মেটাডেটা রিমুভ করুন" অপশনটি ব্যবহার করুন, যা ক্যামেরা EXIF (মেক, মডেল, এক্সপোজার) সংরক্ষণ করে শুধু AI-নির্দিষ্ট মেটাডেটা রিমুভ করে।',
        ],
      ]}
      relatedToolIds={['gps-metadata-remover', 'image-privacy-checker', 'metadata-comparison']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {file && !result && (
        <div className="mt-4">
          <HackerButton icon={<Eraser size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="মেটাডেটা রিমুভ করা হচ্ছে…">
            CLEAN IMAGE
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
            {result.removed.length}টি মেটাডেটা সেগমেন্ট/চাংক রিমুভ করা হয়েছে।
          </p>
          {result.removed.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {result.removed.map((r, i) => (
                <li key={i} className="rounded-full bg-cyber-800 px-2.5 py-0.5 text-xs font-medium text-cyber-200">
                  {r}
                </li>
              ))}
            </ul>
          )}
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
