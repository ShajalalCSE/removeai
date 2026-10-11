import { useState } from 'react';
import { GitCompare } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import PlatformFieldTable from '../../components/platform/PlatformFieldTable';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import type { MetadataReport } from '../../types/metadata';

export default function MetadataComparison() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [reportA, setReportA] = useState<MetadataReport | null>(null);
  const [reportB, setReportB] = useState<MetadataReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (slot: 'a' | 'b', f: File) => {
    if (slot === 'a') {
      setFileA(f);
      setReportA(null);
    } else {
      setFileB(f);
      setReportB(null);
    }
    setError(null);
    setBusy(true);
    try {
      const { report } = await getImageWorkerClient().read(f);
      if (slot === 'a') setReportA(report);
      else setReportB(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ToolPageShell
      icon={GitCompare}
      pageTitle="ইমেজ মেটাডেটা তুলনা"
      headline="COMPARE BEFORE & AFTER"
      description="অরিজিনাল ও প্রসেস করা ইমেজ ফাইলের মেটাডেটা রিপোর্ট পাশাপাশি তুলনা করুন।"
      howToUse={[
        'বাম পাশে অরিজিনাল ছবি এবং ডান পাশে প্রসেস করা ছবি আপলোড করুন।',
        'দুটি ফাইলের মেটাডেটা রিপোর্ট স্বয়ংক্রিয়ভাবে পাশাপাশি দেখানো হবে।',
        'কোন ফিল্ড রিমুভ বা সংরক্ষিত হয়েছে তা পর্যালোচনা করুন।',
      ]}
      faq={[
        ['দুটি ফাইল কি একই ছবির হতে হবে?', 'না, যেকোনো দুটি ছবি তুলনা করা যায়, তবে এই টুলটি সবচেয়ে বেশি কাজে লাগে যখন একই ছবির অরিজিনাল ও প্রসেস করা ভার্সন তুলনা করা হয়।'],
        ['এটি কি ফাইল দুটি ডাউনলোড বা সংরক্ষণ করে?', 'না। দুটি ফাইলই শুধু আপনার ব্রাউজারে পড়া হয় মেটাডেটা বের করার জন্য - কোথাও আপলোড বা সংরক্ষণ করা হয় না।'],
      ]}
      relatedToolIds={['exif-viewer', 'exif-metadata-remover', 'image-privacy-checker']}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <PlatformUploader
          label="অরিজিনাল ফাইল"
          onFileSelected={(f) => handleFile('a', f)}
          selectedFile={fileA}
          onClear={() => {
            setFileA(null);
            setReportA(null);
          }}
          disabled={busy}
        />
        <PlatformUploader
          label="প্রসেস করা ফাইল"
          onFileSelected={(f) => handleFile('b', f)}
          selectedFile={fileB}
          onClear={() => {
            setFileB(null);
            setReportB(null);
          }}
          disabled={busy}
        />
      </div>

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="পড়া হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {(reportA || reportB) && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">অরিজিনাল</h2>
            <div className="mt-3">{reportA ? <PlatformFieldTable fields={reportA.fields} /> : <p className="text-sm text-cyber-400">ফাইল আপলোড করুন</p>}</div>
          </div>
          <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">প্রসেস করা</h2>
            <div className="mt-3">{reportB ? <PlatformFieldTable fields={reportB.fields} /> : <p className="text-sm text-cyber-400">ফাইল আপলোড করুন</p>}</div>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
