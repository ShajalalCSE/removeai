import { useState } from 'react';
import { FileX } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import GenericFileUploader from '../../components/platform/GenericFileUploader';
import { PlatformErrorBox } from '../../components/platform/PlatformStatus';
import HackerButton from '../../components/platform/HackerButton';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';
import { downloadBlob } from '../../lib/image-export';
import { formatBytes } from '../../lib/binary';
import type { PdfRemovalResult } from '../../lib/pdf-metadata';

export default function PdfMetadataRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<PdfRemovalResult | null>(null);
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
      const result = await getDocumentWorkerClient().removePdf(file);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'মেটাডেটা রিমুভ করা যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!result || !file) return;
    const base = file.name.replace(/\.[^./\\]+$/, '') || 'document';
    downloadBlob(result.blob, `${base}-cleaned.pdf`);
  };

  const hasRemainingMetadata =
    result && (result.verification.title || result.verification.author || result.verification.hasXmpMetadata);

  return (
    <ToolPageShell
      icon={FileX}
      pageTitle="PDF মেটাডেটা রিমুভার"
      headline="CLEAN PDF FOOTPRINTS"
      description="কম্প্যাটিবল PDF ফাইল থেকে সাপোর্টেড ডকুমেন্ট মেটাডেটা (Title, Author, Producer, XMP ইত্যাদি) রিমুভ করুন।"
      howToUse={['একটি PDF ফাইল আপলোড করুন।', '"CLEAN PDF" বাটনে ক্লিক করুন।', 'ফলাফল পর্যালোচনা করে পরিষ্কার করা PDF ডাউনলোড করুন।']}
      faq={[
        ['এটি কি PDF-এর কন্টেন্ট (টেক্সট/ছবি) পরিবর্তন করে?', 'না। শুধু Info ডিকশনারির মেটাডেটা ফিল্ড ও XMP মেটাডেটা স্ট্রিম রিমুভ করা হয় - পৃষ্ঠার কন্টেন্ট অপরিবর্তিত থাকে।'],
        ['আমি কি ফিল্ড সত্যিই রিমুভ হয়েছে কিনা যাচাই করতে পারি?', 'হ্যাঁ, ফলাফলে একটি ভেরিফিকেশন সেকশন থাকে যা আউটপুট ফাইল পুনরায় পড়ে নিশ্চিত করে কোন ফিল্ড আসলেই আর নেই।'],
      ]}
      relatedToolIds={['pdf-metadata-viewer', 'document-inspector', 'docx-metadata-cleaner']}
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

      {file && !result && (
        <div className="mt-4">
          <HackerButton icon={<FileX size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="মেটাডেটা রিমুভ করা হচ্ছে…">
            CLEAN PDF
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
          <p className="font-mono text-sm font-semibold text-neon-400">
            {result.removed.length}টি ফিল্ড রিমুভ করা হয়েছে · {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)}
          </p>
          {result.removed.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {result.removed.map((r, i) => (
                <li key={i} className="rounded-full bg-cyber-800 px-2.5 py-0.5 text-xs font-medium text-cyber-200">
                  {r}
                </li>
              ))}
            </ul>
          )}
          <p className={`mt-2 text-xs ${hasRemainingMetadata ? 'text-amber-400' : 'text-cyber-400'}`}>
            {hasRemainingMetadata ? 'ভেরিফিকেশন: আউটপুটে এখনো কিছু মেটাডেটা পাওয়া যাচ্ছে।' : 'ভেরিফিকেশন: আউটপুট ফাইলে আর কোনো সাপোর্টেড মেটাডেটা পাওয়া যায়নি।'}
          </p>
          <div className="mt-4">
            <HackerButton accent="blue" onClick={download}>
              DOWNLOAD PDF
            </HackerButton>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
