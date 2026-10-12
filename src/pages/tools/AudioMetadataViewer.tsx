import { useState } from 'react';
import { Music } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import GenericFileUploader from '../../components/platform/GenericFileUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';
import type { AudioMetadataReport } from '../../lib/audio-metadata';

export default function AudioMetadataViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<AudioMetadataReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setReport(null);
    setError(null);
    setBusy(true);
    try {
      const result = await getDocumentWorkerClient().readAudio(f);
      setReport(result);
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
      icon={Music}
      pageTitle="অডিও মেটাডেটা ভিউয়ার"
      headline="DECODE AUDIO TAGS"
      description="সাপোর্টেড অডিও ট্যাগ (ID3v1/ID3v2) পরীক্ষা করুন। এই মুহূর্তে শুধু MP3 ভালোভাবে সাপোর্টেড - FLAC, WAV, OGG এখনো সাপোর্টেড না।"
      howToUse={['একটি MP3 ফাইল আপলোড করুন।', 'টুলটি ID3v2 (ফাইলের শুরুতে) ও ID3v1 (ফাইলের শেষে) ট্যাগ স্ক্যান করবে।', 'পাওয়া ট্যাগ ফিল্ড নিচে দেখুন।']}
      faq={[
        ['এটি কি WAV বা FLAC সাপোর্ট করে?', 'এই মুহূর্তে না - শুধু MP3-এর ID3v1 ও ID3v2 ট্যাগ সাপোর্টেড। অন্য ফরম্যাট আপলোড করলে একটি স্পষ্ট এরর দেখানো হবে।'],
        ['ID3v1 আর ID3v2-এর মধ্যে পার্থক্য কী?', 'ID3v1 একটি সাধারণ, সীমিত ট্যাগ যা ফাইলের একদম শেষে ১২৮ বাইটে থাকে। ID3v2 ফাইলের শুরুতে থাকে এবং অনেক বেশি ফিল্ড ও ইউনিকোড টেক্সট সাপোর্ট করে - বেশিরভাগ আধুনিক MP3-তে ID3v2 ব্যবহৃত হয়।'],
      ]}
      relatedToolIds={['mp3-tag-cleaner', 'audio-metadata-remover']}
    >
      <GenericFileUploader
        accept="audio/mpeg,.mp3"
        acceptLabel="MP3"
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        onFileSelected={handleFile}
        selectedFile={file}
        onClear={clear}
        disabled={busy}
      />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="অডিও ট্যাগ স্ক্যান করা হচ্ছে…" />
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
          <p className="mt-2 text-sm text-cyber-200">
            ID3v2: {report.hasId3v2 ? 'উপস্থিত' : 'নেই'} · ID3v1: {report.hasId3v1 ? 'উপস্থিত' : 'নেই'}
          </p>
          {report.fields.length > 0 ? (
            <table className="mt-3 w-full text-sm">
              <tbody>
                {report.fields.map((f, i) => (
                  <tr key={i} className="border-b border-cyber-700 last:border-0">
                    <td className="whitespace-nowrap py-1.5 pr-3 align-top font-medium text-cyber-100">{f.label}</td>
                    <td className="break-words py-1.5 align-top text-cyber-200">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-2 text-sm text-cyber-400">কোনো সাপোর্টেড ট্যাগ ফিল্ড পাওয়া যায়নি।</p>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
