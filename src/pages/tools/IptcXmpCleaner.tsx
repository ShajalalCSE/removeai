import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import HackerButton from '../../components/platform/HackerButton';
import { getImageWorkerClient } from '../../lib/worker-client';
import { buildOutputFilename, downloadBlob } from '../../lib/image-export';
import type { CleanResult } from '../../types/metadata';

export default function IptcXmpCleaner() {
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
      // 'ai' mode removes XMP/IPTC/C2PA while keeping camera EXIF - exactly
      // what an "IPTC & XMP cleaner" should do for JPEG. PNG/WebP have no
      // separate IPTC/camera-EXIF concept, so both modes behave the same
      // there (explained to the user below, same as the main tool's FAQ).
      const result = await getImageWorkerClient().clean(file, 'ai');
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'মেটাডেটা রিমুভ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    downloadBlob(result.blob, buildOutputFilename(file.name, result.format, 'iptc-xmp-cleaned'));
  };

  return (
    <ToolPageShell
      icon={Trash2}
      pageTitle="IPTC ও XMP মেটাডেটা ক্লিনার"
      headline="PURGE IMAGE FOOTPRINTS"
      description="সাপোর্টেড IPTC ও XMP মেটাডেটা ফিল্ড রিমুভ করুন - ক্যামেরা EXIF (make, model, exposure) সংরক্ষিত থাকে।"
      howToUse={['একটি JPEG, PNG বা WebP ছবি আপলোড করুন।', '"CLEAN METADATA" বাটনে ক্লিক করুন।', 'ফলাফল পর্যালোচনা করে ডাউনলোড করুন।']}
      faq={[
        [
          'এটি কি ক্যামেরা EXIF-ও মুছে দেয়?',
          'JPEG-এর ক্ষেত্রে না - ক্যামেরা EXIF (make, model, exposure, GPS) সংরক্ষিত থাকে, শুধু XMP, IPTC/Photoshop ও C2PA ডেটা রিমুভ হয়। PNG ও WebP-তে আলাদা "camera EXIF" ধারণা না থাকায় এই দুই ফরম্যাটে সব মেটাডেটা চাংক রিমুভ হয়।',
        ],
        ['IPTC মেটাডেটা কী?', 'IPTC হলো একটি পুরনো স্ট্যান্ডার্ড যা মূলত সংবাদ ও স্টক ফটোগ্রাফি ইন্ডাস্ট্রিতে ক্যাপশন, ক্রেডিট ও কপিরাইট তথ্য সংরক্ষণে ব্যবহৃত হয়।'],
      ]}
      relatedToolIds={['exif-metadata-remover', 'image-privacy-checker', 'bulk-metadata-remover']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {file && !result && (
        <div className="mt-4">
          <HackerButton icon={<Trash2 size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="রিমুভ করা হচ্ছে…">
            CLEAN METADATA
          </HackerButton>
        </div>
      )}

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="প্রসেস করা হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
          <p className="font-mono text-sm font-semibold text-neon-400">{result.removed.length}টি সেগমেন্ট/চাংক রিমুভ করা হয়েছে।</p>
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
