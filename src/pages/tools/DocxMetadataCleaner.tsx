import { useState } from 'react';
import { FileText } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import GenericFileUploader from '../../components/platform/GenericFileUploader';
import { PlatformErrorBox } from '../../components/platform/PlatformStatus';
import HackerButton from '../../components/platform/HackerButton';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';
import { downloadBlob } from '../../lib/image-export';
import { formatBytes } from '../../lib/binary';
import type { DocxMetadataReport, DocxRemovalResult } from '../../lib/docx-metadata';

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export default function DocxMetadataCleaner() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<DocxMetadataReport | null>(null);
  const [result, setResult] = useState<DocxRemovalResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setPreview(null);
    setError(null);
    setBusy(true);
    try {
      const report = await getDocumentWorkerClient().readDocx(f);
      setPreview(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const run = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getDocumentWorkerClient().removeDocx(file);
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
    downloadBlob(result.blob, `${base}-cleaned.docx`);
  };

  return (
    <ToolPageShell
      icon={FileText}
      pageTitle="DOCX মেটাডেটা ক্লিনার"
      headline="PURGE DOCUMENT DATA"
      description="DOCX ফাইলে সাপোর্টেড ডকুমেন্ট প্রোপার্টি (Title, Author, Company ইত্যাদি) পরীক্ষা ও পরিষ্কার করুন।"
      howToUse={['একটি DOCX ফাইল আপলোড করুন (Word-এর পুরনো .doc ফরম্যাট সাপোর্টেড না)।', 'প্রিভিউতে বিদ্যমান প্রোপার্টি দেখুন।', '"CLEAN DOCUMENT" ক্লিক করে ডাউনলোড করুন।']}
      faq={[
        ['এটি কি .doc (পুরনো Word) ফাইল সাপোর্ট করে?', 'না। শুধু .docx (Office Open XML) ফরম্যাট সাপোর্টেড, যা Word 2007 ও তার পরের ভার্সনে ব্যবহৃত হয়।'],
        ['এটি কি ডকুমেন্টের টেক্সট কন্টেন্ট পরিবর্তন করে?', 'না। শুধু docProps/core.xml ও docProps/app.xml-এ থাকা মেটাডেটা প্রোপার্টি রিমুভ করা হয় - ডকুমেন্টের মূল কন্টেন্ট অপরিবর্তিত থাকে।'],
      ]}
      relatedToolIds={['document-inspector', 'pdf-metadata-remover', 'pdf-metadata-viewer']}
    >
      <GenericFileUploader
        accept={DOCX_MIME}
        acceptLabel="DOCX"
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        onFileSelected={handleFile}
        selectedFile={file}
        onClear={clear}
        disabled={busy}
      />

      {preview && !result && (
        <div className="mt-4 rounded-lg border border-cyber-700 bg-cyber-900/40 p-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">বিদ্যমান প্রোপার্টি</h2>
          <ul className="mt-2 space-y-1 text-sm text-cyber-200">
            {Object.entries(preview)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <li key={k}>
                  <strong className="text-white">{k}:</strong> {v}
                </li>
              ))}
            {Object.values(preview).every((v) => !v) && <li className="text-cyber-400">কোনো সাপোর্টেড প্রোপার্টি পাওয়া যায়নি।</li>}
          </ul>
          <div className="mt-3">
            <HackerButton icon={<FileText size={15} aria-hidden="true" />} onClick={run} busy={busy} busyLabel="মেটাডেটা রিমুভ করা হচ্ছে…">
              CLEAN DOCUMENT
            </HackerButton>
          </div>
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
            {result.removed.length}টি প্রোপার্টি রিমুভ করা হয়েছে · {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)}
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
          <div className="mt-4">
            <HackerButton accent="blue" onClick={download}>
              DOWNLOAD DOCX
            </HackerButton>
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
