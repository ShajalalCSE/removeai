import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import type { MetadataReport } from '../../types/metadata';
import type { C2paInfo } from '../../lib/c2pa';

export default function AiProvenanceInspector() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<MetadataReport | null>(null);
  const [c2pa, setC2pa] = useState<C2paInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setReport(null);
    setC2pa(null);
    setError(null);
    setBusy(true);
    try {
      const client = getImageWorkerClient();
      const [readResult, c2paResult] = await Promise.all([client.read(f), client.readC2pa(f)]);
      setReport(readResult.report);
      setC2pa(c2paResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setReport(null);
    setC2pa(null);
    setError(null);
  };

  const hasAnySignal = (report && (report.aiSignals.length > 0 || !!report.software)) || c2pa?.present;

  return (
    <ToolPageShell
      icon={Crosshair}
      pageTitle="AI প্রোভেন্যান্স ইন্সপেক্টর"
      headline="TRACE IMAGE ORIGIN"
      description="একটি ছবির সাথে যুক্ত উপলব্ধ প্রোভেন্যান্স রেকর্ড ও সাপোর্টেড ইন্ডিকেটর (EXIF Software ট্যাগ, XMP, C2PA) একসাথে পরীক্ষা করুন।"
      howToUse={['একটি ছবি আপলোড করুন।', 'টুলটি EXIF/XMP সিগন্যাল ও C2PA ম্যানিফেস্ট একসাথে স্ক্যান করবে।', 'ফলাফল পর্যালোচনা করুন - এটি একটি তদন্ত রিপোর্ট, চূড়ান্ত রায় নয়।']}
      faq={[
        ['এই টুল কি নিশ্চিতভাবে বলতে পারে ছবিটি AI দিয়ে তৈরি?', 'না। এটি শুধু মেটাডেটায় যা পাওয়া যায় তা রিপোর্ট করে - কোনো সিগন্যাল না পাওয়া মানে এই না যে ছবিটি AI-জেনারেটেড না, কারণ মেটাডেটা সহজেই রিমুভ করা যায়। একইভাবে, সিগন্যাল পাওয়া গেলেও তা জাল/পরিবর্তিত হতে পারে, যেহেতু মেটাডেটা ভেরিফাই করা আরেকটি ধাপ।'],
        ['এটি Image Privacy Checker থেকে কীভাবে আলাদা?', 'Image Privacy Checker আপনার নিজের প্রাইভেসি রিস্ক (GPS, ক্যামেরা তথ্য ইত্যাদি) এর উপর ফোকাস করে। এই টুল বিশেষভাবে AI/প্রোভেন্যান্স-সম্পর্কিত সিগন্যাল (জেনারেটর নাম, C2PA, digitalSourceType) এর উপর ফোকাস করে।'],
      ]}
      relatedToolIds={['c2pa-checker', 'exif-viewer', 'image-privacy-checker']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="প্রোভেন্যান্স তদন্ত চলছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {report && c2pa && (
        <div className="mt-6 space-y-4">
          <div className={`rounded-lg border p-4 ${hasAnySignal ? 'border-amber-900/50 bg-amber-950/20' : 'border-neon-700/40 bg-neon-950/10'}`}>
            <p className={`font-mono text-sm font-bold ${hasAnySignal ? 'text-amber-300' : 'text-neon-400'}`}>
              {hasAnySignal ? 'প্রোভেন্যান্স সিগন্যাল পাওয়া গেছে' : 'কোনো প্রোভেন্যান্স সিগন্যাল পাওয়া যায়নি'}
            </p>
            {report.software && <p className="mt-1 text-sm text-amber-200">EXIF Software: {report.software}</p>}
            {report.aiSignals.map((s, i) => (
              <p key={i} className="mt-1 text-sm text-amber-200">
                {s}
              </p>
            ))}
            {c2pa.present && (
              <p className="mt-1 text-sm text-amber-200">
                C2PA/JUMBF ম্যানিফেস্ট উপস্থিত ({c2pa.byteLength} বাইট){c2pa.digitalSourceType ? ` · digitalSourceType: ${c2pa.digitalSourceType}` : ''}
              </p>
            )}
          </div>
          <p className="text-xs text-cyber-400">
            এটি একটি স্বয়ংক্রিয় তদন্ত রিপোর্ট, চূড়ান্ত সিদ্ধান্ত নয়। গভীর বিশ্লেষণের জন্য C2PA কন্টেন্ট ক্রেডেনশিয়ালস
            চেকার বা EXIF মেটাডেটা ভিউয়ার আলাদাভাবে ব্যবহার করুন।
          </p>
        </div>
      )}
    </ToolPageShell>
  );
}
