import { useState } from 'react';
import { Fingerprint, ShieldAlert } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import PlatformUploader from '../../components/platform/PlatformUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getImageWorkerClient } from '../../lib/worker-client';
import type { C2paInfo } from '../../lib/c2pa';

export default function C2paChecker() {
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<C2paInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setInfo(null);
    setError(null);
    setBusy(true);
    try {
      const result = await getImageWorkerClient().readC2pa(f);
      setInfo(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setInfo(null);
    setError(null);
  };

  return (
    <ToolPageShell
      icon={Fingerprint}
      pageTitle="C2PA কন্টেন্ট ক্রেডেনশিয়ালস চেকার"
      headline="SCAN AI FOOTPRINTS"
      description="একটি ছবিতে C2PA/JUMBF ম্যানিফেস্ট আছে কিনা এবং এতে কোন কোন বক্স/সিগন্যাল আছে তা পরীক্ষা করুন।"
      howToUse={['একটি JPEG, PNG বা WebP ছবি আপলোড করুন।', 'টুলটি C2PA/JUMBF ম্যানিফেস্টের জন্য ফাইল স্ক্যান করবে।', 'পাওয়া গেলে, এর বক্স স্ট্রাকচার ও শনাক্তকৃত সিগন্যাল দেখুন।']}
      faq={[
        [
          'এটি কি সিগনেচার ভেরিফাই করে?',
          'না। এই টুল শুধু C2PA/JUMBF ম্যানিফেস্টের বাইনারি স্ট্রাকচার পড়ে কোন বক্স/সেকশন আছে তা দেখায় (Claim, Assertions, Signature ইত্যাদি), এবং পরিচিত টুলের নাম বা digitalSourceType-এর জন্য টেক্সট স্ক্যান করে। এটি ক্রিপ্টোগ্রাফিক সিগনেচার ভেরিফিকেশন করে না, তাই ম্যানিফেস্টটি সত্যিই বৈধ কিনা তা এই টুল নিশ্চিত করে না।',
        ],
        ['C2PA ডেটা না থাকলে কি ছবিটি নিশ্চিতভাবে AI-জেনারেটেড না?', 'না, এই দাবি করা যায় না। অনেক AI টুল C2PA ডেটা যোগ করে না, এবং C2PA ডেটা সহজেই রিমুভ করা যায় (যেমন এই সাইটের মেটাডেটা রিমুভাল টুল দিয়ে)। C2PA-এর অনুপস্থিতি কোনো প্রমাণ নয়।'],
      ]}
      relatedToolIds={['ai-provenance-inspector', 'exif-viewer', 'image-privacy-checker']}
    >
      <PlatformUploader onFileSelected={handleFile} selectedFile={file} onClear={clear} disabled={busy} />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="C2PA ম্যানিফেস্ট স্ক্যান করা হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {info && (
        <div className="mt-6 space-y-4">
          <div className={`rounded-lg border p-4 ${info.present ? 'border-amber-900/50 bg-amber-950/20' : 'border-neon-700/40 bg-neon-950/10'}`}>
            {info.present ? (
              <div className="flex items-start gap-3">
                <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-400" aria-hidden="true" />
                <div>
                  <p className="font-mono text-sm font-bold text-amber-300">C2PA/JUMBF ম্যানিফেস্ট পাওয়া গেছে</p>
                  <p className="mt-1 text-sm text-amber-200">সাইজ: {info.byteLength} বাইট</p>
                  {info.digitalSourceType && (
                    <p className="mt-1 text-sm text-amber-200">digitalSourceType: {info.digitalSourceType}</p>
                  )}
                  {info.detectedTools.length > 0 && (
                    <p className="mt-1 text-sm text-amber-200">শনাক্তকৃত টুল/জেনারেটর: {info.detectedTools.join(', ')}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="font-mono text-sm font-semibold text-neon-400">কোনো C2PA/JUMBF ম্যানিফেস্ট পাওয়া যায়নি।</p>
            )}
          </div>

          {info.present && info.boxes.length > 0 && (
            <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
              <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">বক্স স্ট্রাকচার</h2>
              <ul className="mt-3 space-y-1 font-mono text-xs text-cyber-200">
                {info.boxes.map((b, i) => (
                  <li key={i} style={{ paddingLeft: `${b.depth * 16}px` }}>
                    <span className="text-wire-400">{b.type}</span>
                    {b.label && <span className="text-cyber-400"> · {b.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
