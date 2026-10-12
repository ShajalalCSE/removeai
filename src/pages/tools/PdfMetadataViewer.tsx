import { useState } from 'react';
import { FileSearch } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import GenericFileUploader from '../../components/platform/GenericFileUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';
import type { PdfMetadataReport } from '../../lib/pdf-metadata';

const FIELD_LABELS: { key: keyof PdfMetadataReport; label: string }[] = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'subject', label: 'Subject' },
  { key: 'keywords', label: 'Keywords' },
  { key: 'creator', label: 'Creator' },
  { key: 'producer', label: 'Producer' },
  { key: 'creationDate', label: 'তৈরির তারিখ' },
  { key: 'modificationDate', label: 'পরিবর্তনের তারিখ' },
];

export default function PdfMetadataViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<PdfMetadataReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setReport(null);
    setError(null);
    setBusy(true);
    try {
      const result = await getDocumentWorkerClient().readPdf(f);
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
      icon={FileSearch}
      pageTitle="PDF মেটাডেটা ভিউয়ার"
      headline="INSPECT PDF SECRETS"
      description="উপলব্ধ PDF প্রোপার্টি, ডকুমেন্ট তথ্য ও সাপোর্টেড মেটাডেটা ফিল্ড পরীক্ষা করুন - শুধু দেখার জন্য, কিছু পরিবর্তন করা হয় না।"
      howToUse={['একটি PDF ফাইল আপলোড করুন।', 'টুলটি স্বয়ংক্রিয়ভাবে PDF-এর Info ডিকশনারি ও XMP মেটাডেটার উপস্থিতি স্ক্যান করবে।', 'নিচে প্রতিটি ফিল্ড ও তার ভ্যালু দেখুন।']}
      faq={[
        ['এটি কি এনক্রিপ্টেড PDF খুলতে পারে?', 'কিছু এনক্রিপ্টেড PDF খোলা যেতে পারে, তবে পাসওয়ার্ড-প্রোটেক্টেড ফাইলের জন্য সাপোর্ট সীমিত। পাসওয়ার্ড দিয়ে আনলক করার কোনো অপশন এই টুলে নেই।'],
        ['PDF-এ কী ধরনের মেটাডেটা থাকতে পারে?', 'Info ডিকশনারিতে Title, Author, Subject, Keywords, Creator, Producer ও তারিখ থাকতে পারে। এছাড়া অনেক PDF-এ একটি আলাদা XMP মেটাডেটা স্ট্রিমও থাকে।'],
      ]}
      relatedToolIds={['pdf-metadata-remover', 'document-inspector']}
    >
      <GenericFileUploader
        accept="application/pdf"
        acceptLabel="PDF"
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        onFileSelected={handleFile}
        selectedFile={file}
        onClear={clear}
        disabled={busy}
      />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="PDF স্ক্যান করা হচ্ছে…" />
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
          <table className="mt-3 w-full text-sm">
            <tbody>
              <tr className="border-b border-cyber-700">
                <td className="py-1.5 pr-3 font-medium text-cyber-100">পৃষ্ঠা সংখ্যা</td>
                <td className="py-1.5 text-cyber-200">{report.pageCount}</td>
              </tr>
              {FIELD_LABELS.map((f) => {
                const value = report[f.key];
                if (!value) return null;
                return (
                  <tr key={f.key} className="border-b border-cyber-700 last:border-0">
                    <td className="whitespace-nowrap py-1.5 pr-3 align-top font-medium text-cyber-100">{f.label}</td>
                    <td className="break-words py-1.5 align-top text-cyber-200">{String(value)}</td>
                  </tr>
                );
              })}
              <tr>
                <td className="py-1.5 pr-3 font-medium text-cyber-100">XMP মেটাডেটা স্ট্রিম</td>
                <td className="py-1.5 text-cyber-200">{report.hasXmpMetadata ? 'উপস্থিত' : 'নেই'}</td>
              </tr>
            </tbody>
          </table>
          {!FIELD_LABELS.some((f) => report[f.key]) && !report.hasXmpMetadata && (
            <p className="mt-2 text-sm text-cyber-400">এই PDF-এ কোনো সাপোর্টেড মেটাডেটা ফিল্ড পাওয়া যায়নি।</p>
          )}
        </div>
      )}
    </ToolPageShell>
  );
}
