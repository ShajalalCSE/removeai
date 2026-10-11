import { useState } from 'react';
import { MapPinOff } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import HackerButton from '../../components/platform/HackerButton';
import { getImageWorkerClient } from '../../lib/worker-client';
import { downloadBlob } from '../../lib/image-export';
import { EXTENSION_BY_FORMAT } from '../../lib/format';
import type { GpsRemovalResult } from '../../types/metadata';

export default function GpsRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<GpsRemovalResult | null>(null);
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
      const result = await getImageWorkerClient().removeGps(file);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GPS রিমুভ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^./\\]+$/, '') || 'image';
    downloadBlob(result.blob, `${base}-gps-removed.${EXTENSION_BY_FORMAT[result.format]}`);
  };

  return (
    <ToolPageShell
      icon={MapPinOff}
      pageTitle="GPS মেটাডেটা রিমুভার"
      headline="HIDE MY LOCATION"
      description="আপনার ছবি থেকে সাপোর্টেড GPS লোকেশন ফিল্ড রিমুভ করুন - ক্যামেরা মেক/মডেলসহ বাকি সব EXIF তথ্য অক্ষত থাকে।"
      howToUse={[
        'একটি JPEG, PNG বা WebP ছবি আপলোড করুন।',
        '"REMOVE GPS DATA" বাটনে ক্লিক করুন।',
        'ফলাফল পর্যালোচনা করে পরিষ্কার করা ছবি ডাউনলোড করুন।',
      ]}
      faq={[
        ['এটি কি শুধু GPS রিমুভ করে, নাকি সব EXIF মুছে দেয়?', 'শুধু GPS ইনফো IFD পয়েন্টার রিমুভ করা হয় - ক্যামেরা মেক, মডেল, এক্সপোজার ইত্যাদি বাকি সব EXIF ফিল্ড অক্ষত থাকে। সব মেটাডেটা মুছতে চাইলে EXIF মেটাডেটা রিমুভার ব্যবহার করুন।'],
        ['এটি কি ছবির মান পরিবর্তন করে?', 'না। পিক্সেল ডেটা স্পর্শ করা হয় না, শুধু ফাইল স্ট্রাকচার থেকে GPS পয়েন্টার রিমুভ করা হয় - কোনো রি-কম্প্রেশন ছাড়াই।'],
      ]}
      relatedToolIds={['gps-location-checker', 'exif-metadata-remover', 'image-privacy-checker']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {file && !result && (
        <div className="mt-4">
          <HackerButton icon={<MapPinOff size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="GPS রিমুভ করা হচ্ছে…">
            REMOVE GPS DATA
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
          <p className={`font-mono text-sm font-semibold ${result.hadGps ? 'text-neon-400' : 'text-cyber-300'}`}>
            {result.hadGps ? 'GPS ডেটা পাওয়া গিয়েছিল এবং রিমুভ করা হয়েছে।' : 'এই ছবিতে কোনো GPS ডেটা পাওয়া যায়নি - কিছু রিমুভ করার দরকার ছিল না।'}
          </p>
          {result.verification.gps ? (
            <p className="mt-2 text-sm text-red-400">সতর্কতা: আউটপুটে এখনো GPS ডেটা শনাক্ত হচ্ছে।</p>
          ) : (
            <p className="mt-2 text-sm text-cyber-300">ভেরিফিকেশন: আউটপুট ফাইলে কোনো GPS ডেটা পাওয়া যায়নি।</p>
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
