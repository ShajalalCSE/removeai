import { useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import PlatformFieldTable from '../../components/platform/PlatformFieldTable';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import type { MetadataReport } from '../../types/metadata';

export default function ImagePrivacyChecker() {
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

  const hasAnyPrivacyField = report ? report.hasExif || report.hasXmp || report.hasIptc || report.hasC2pa || !!report.gps : false;

  return (
    <ToolPageShell
      icon={ShieldCheck}
      pageTitle="ইমেজ প্রাইভেসি চেকার"
      headline="SCAN FOR HIDDEN DATA"
      description="একটি ছবি বা এর নির্মাতা সম্পর্কে তথ্য প্রকাশ করতে পারে এমন সাপোর্টেড মেটাডেটা ফিল্ড যাচাই করুন।"
      howToUse={[
        'একটি JPEG, PNG বা WebP ছবি আপলোড করুন।',
        'টুলটি GPS, ক্যামেরা তথ্য, AI প্রোভেন্যান্স সিগন্যাল ও অন্যান্য সাপোর্টেড ফিল্ডের জন্য স্ক্যান করবে।',
        'ফলাফল পর্যালোচনা করুন এবং প্রয়োজনে একটি রিমুভাল টুল ব্যবহার করুন।',
      ]}
      faq={[
        ['এই স্ক্যান কি ১০০% নিশ্চিত যে কোনো ঝুঁকি নেই?', 'না। এটি শুধু আমাদের সাপোর্টেড পার্সার যে ফিল্ডগুলো শনাক্ত করতে পারে তা রিপোর্ট করে। অসমর্থিত বা অজানা মেটাডেটা স্ট্রাকচার থাকলে তা এই স্ক্যানে ধরা নাও পড়তে পারে।'],
        ['"হিডেন ডেটা" মানে কী?', 'এর মানে এমন মেটাডেটা যা ছবির ভিজুয়াল অংশে দেখা যায় না কিন্তু ফাইলের ভেতরে সংরক্ষিত থাকে - যেমন ক্যামেরা তথ্য, GPS কোঅর্ডিনেট, বা সফটওয়্যার/জেনারেটরের নাম।'],
      ]}
      relatedToolIds={['exif-viewer', 'gps-location-checker', 'exif-metadata-remover']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="প্রাইভেসি স্ক্যান চলছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {report && (
        <div className="mt-6 space-y-4">
          <div className={`flex items-start gap-3 rounded-lg border p-4 ${hasAnyPrivacyField ? 'border-amber-900/50 bg-amber-950/30' : 'border-neon-700/50 bg-neon-950/20'}`}>
            {hasAnyPrivacyField ? (
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-400" aria-hidden="true" />
            ) : (
              <ShieldCheck size={20} className="mt-0.5 flex-shrink-0 text-neon-400" aria-hidden="true" />
            )}
            <div>
              <p className={`font-mono text-sm font-bold ${hasAnyPrivacyField ? 'text-amber-300' : 'text-neon-400'}`}>
                {hasAnyPrivacyField ? 'সাপোর্টেড মেটাডেটা ফিল্ড পাওয়া গেছে' : 'কোনো সাপোর্টেড মেটাডেটা ফিল্ড পাওয়া যায়নি'}
              </p>
              {report.gps && <p className="mt-1 text-sm text-amber-200">এই ছবিতে GPS লোকেশন ডেটা আছে।</p>}
              {report.aiSignals.length > 0 && (
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-200">
                  {report.aiSignals.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">বিস্তারিত মেটাডেটা</h2>
            <div className="mt-3">
              <PlatformFieldTable fields={report.fields} />
            </div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
