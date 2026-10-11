import { useState } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';

interface GpsResult {
  found: boolean;
  lat?: number;
  lon?: number;
}

export default function GpsChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<GpsResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setBusy(true);
    try {
      const { report } = await getImageWorkerClient().read(f);
      if (report.gps) {
        setResult({ found: true, lat: report.gps.lat, lon: report.gps.lon });
      } else {
        setResult({ found: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <ToolPageShell
      icon={MapPin}
      pageTitle="ফটো GPS লোকেশন চেকার"
      headline="FIND PHOTO LOCATION"
      description="একটি ছবিতে GPS কোঅর্ডিনেট আছে কিনা যাচাই করুন, যা ছবিটি কোথায় তোলা হয়েছে তা প্রকাশ করতে পারে।"
      howToUse={[
        'একটি JPEG, PNG বা WebP ছবি আপলোড করুন।',
        'টুলটি ছবির EXIF ডেটায় GPS কোঅর্ডিনেট খুঁজবে।',
        'GPS তথ্য পাওয়া গেলে কোঅর্ডিনেট ও একটি ম্যাপ লিংক দেখানো হবে।',
      ]}
      faq={[
        ['GPS না পাওয়া মানে কি ছবিটি নিরাপদ?', 'শুধু এটুকু বলা যায় যে এই টুলের সাপোর্টেড GPS ফিল্ডে কোনো কোঅর্ডিনেট পাওয়া যায়নি। এর মানে এই নয় যে ছবিতে অন্য কোনোভাবে অবস্থান-সম্পর্কিত তথ্য নেই।'],
        ['GPS তথ্য কীভাবে একটি ছবিতে আসে?', 'বেশিরভাগ স্মার্টফোন ও কিছু ক্যামেরা ছবি তোলার সময় লোকেশন সার্ভিস চালু থাকলে স্বয়ংক্রিয়ভাবে GPS কোঅর্ডিনেট EXIF ডেটায় যোগ করে।'],
      ]}
      relatedToolIds={['gps-metadata-remover', 'exif-viewer', 'image-privacy-checker']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="লোকেশন স্ক্যান করা হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
          {result.found ? (
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-wide text-amber-400">GPS কোঅর্ডিনেট পাওয়া গেছে</p>
              <p className="mt-2 font-mono text-lg text-white">
                {result.lat?.toFixed(5)}, {result.lon?.toFixed(5)}
              </p>
              <a
                href={`https://www.google.com/maps?q=${result.lat},${result.lon}`}
                target="_blank"
                rel="noreferrer"
                className="focus-ring-neon mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-wire-400 hover:text-wire-300"
              >
                Google Maps-এ দেখুন <ExternalLink size={14} aria-hidden="true" />
              </a>
              <p className="mt-3 text-sm text-cyber-300">
                লোকেশন লুকাতে চাইলে GPS মেটাডেটা রিমুভার ব্যবহার করুন।
              </p>
            </div>
          ) : (
            <p className="font-mono text-sm font-semibold text-neon-400">কোনো GPS কোঅর্ডিনেট পাওয়া যায়নি।</p>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
