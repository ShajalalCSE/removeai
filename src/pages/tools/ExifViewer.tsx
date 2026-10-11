import { useState } from 'react';
import { ScanSearch } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import PlatformFieldTable from '../../components/platform/PlatformFieldTable';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import type { MetadataReport } from '../../types/metadata';

export default function ExifViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<MetadataReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setReport(null);
    setError(null);
    setBusy(true);
    try {
      const { report } = await getImageWorkerClient().read(f);
      setReport(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setReport(null);
    setError(null);
  };

  return (
    <ToolPageShell
      icon={ScanSearch}
      pageTitle="EXIF মেটাডেটা ভিউয়ার"
      headline="REVEAL HIDDEN PHOTO DATA"
      description="ক্যামেরার তথ্য, টাইমস্ট্যাম্প, GPS ফিল্ড ও অন্যান্য সাপোর্টেড মেটাডেটা পরীক্ষা করুন - শুধু দেখার জন্য, কিছু পরিবর্তন করা হয় না।"
      howToUse={[
        'একটি JPEG, PNG বা WebP ছবি আপলোড করুন।',
        'টুলটি স্বয়ংক্রিয়ভাবে ছবির সাপোর্টেড মেটাডেটা স্ক্যান করে রিপোর্ট দেখাবে।',
        'নিচে ক্যাটাগরি অনুযায়ী প্রতিটি ফিল্ড ও তার ভ্যালু দেখুন।',
      ]}
      faq={[
        ['এই টুল কি আমার ছবি পরিবর্তন করে?', 'না। এটি শুধু বিদ্যমান মেটাডেটা পড়ে ও দেখায় - কোনো ডাউনলোড বা ফাইল পরিবর্তন নেই। ছবি মুছতে চাইলে EXIF মেটাডেটা রিমুভার ব্যবহার করুন।'],
        ['সব ফিল্ড কি সব ছবিতে দেখা যায়?', 'না। একটি ছবিতে ঠিক কোন ফিল্ড থাকবে তা নির্ভর করে কোন ডিভাইস বা সফটওয়্যার দিয়ে এটি তৈরি হয়েছে তার উপর। এই টুল শুধু যা আসলেই উপস্থিত আছে তা দেখায়।'],
      ]}
      relatedToolIds={['gps-location-checker', 'image-privacy-checker', 'exif-metadata-remover']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="স্ক্যান করা হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {report && (
        <div className="mt-6 rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">মেটাডেটা রিপোর্ট</h2>
          <div className="mt-3">
            <PlatformFieldTable fields={report.fields} />
          </div>
          {report.aiSignals.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-900/50 bg-amber-950/30 p-3">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wide text-amber-400">সিগন্যাল পাওয়া গেছে</p>
              <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-200">
                {report.aiSignals.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
