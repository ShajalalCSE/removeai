import { useState } from 'react';
import { FileSearch2, ShieldAlert, ShieldCheck } from 'lucide-react';
import ToolPageShell from '../../components/platform/ToolPageShell';
import GenericFileUploader from '../../components/platform/GenericFileUploader';
import { PlatformProcessingStatus, PlatformErrorBox } from '../../components/platform/PlatformStatus';
import { getDocumentWorkerClient } from '../../lib/document-worker-client';
import { MAX_FILE_SIZE_BYTES } from '../../lib/format';

type Kind = 'pdf' | 'docx';

interface UnifiedField {
  label: string;
  value: string;
  sensitive: boolean;
}

const SENSITIVE_LABELS = new Set(['Author', 'author', 'creator', 'Creator', 'company', 'manager', 'lastModifiedBy']);

export default function DocumentInspector() {
  const [file, setFile] = useState<File | null>(null);
  const [kind, setKind] = useState<Kind | null>(null);
  const [fields, setFields] = useState<UnifiedField[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (f: File) => {
    setFile(f);
    setFields(null);
    setKind(null);
    setError(null);
    setBusy(true);
    try {
      const client = getDocumentWorkerClient();
      if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
        const report = await client.readPdf(f);
        setKind('pdf');
        setFields(
          (
            [
              ['Title', report.title],
              ['Author', report.author],
              ['Subject', report.subject],
              ['Keywords', report.keywords],
              ['Creator', report.creator],
              ['Producer', report.producer],
            ] as const
          )
            .filter(([, v]) => v)
            .map(([label, value]) => ({ label, value: value as string, sensitive: SENSITIVE_LABELS.has(label) })),
        );
      } else {
        const report = await client.readDocx(f);
        setKind('docx');
        setFields(
          Object.entries(report)
            .filter(([, v]) => v)
            .map(([label, value]) => ({ label, value: value as string, sensitive: SENSITIVE_LABELS.has(label) })),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ফাইলটি পড়া যায়নি।');
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setFile(null);
    setFields(null);
    setKind(null);
    setError(null);
  };

  const hasSensitive = fields?.some((f) => f.sensitive) ?? false;

  return (
    <ToolPageShell
      icon={FileSearch2}
      pageTitle="ডকুমেন্ট প্রোপার্টিজ ইন্সপেক্টর"
      headline="INVESTIGATE DOCUMENT"
      description="PDF বা DOCX ফাইলের সাপোর্টেড ডকুমেন্ট প্রোপার্টি পরীক্ষা করুন এবং সম্ভাব্য সংবেদনশীল তথ্য (লেখকের নাম, কোম্পানি) শনাক্ত করুন।"
      howToUse={['একটি PDF বা DOCX ফাইল আপলোড করুন।', 'টুলটি ফরম্যাট শনাক্ত করে সাপোর্টেড প্রোপার্টি দেখাবে।', 'সম্ভাব্য সংবেদনশীল ফিল্ড (যেমন Author, Company) হাইলাইট করা থাকবে।']}
      faq={[
        ['কোন কোন ফাইল ফরম্যাট সাপোর্টেড?', 'PDF এবং DOCX (Office Open XML)। পুরনো .doc বা অন্যান্য ফরম্যাট সাপোর্টেড না।'],
        ['"সংবেদনশীল" বলতে কী বোঝানো হয়েছে?', 'যেসব ফিল্ডে ব্যক্তির নাম বা প্রতিষ্ঠানের নাম থাকতে পারে (Author, Creator, Company, Manager, Last Modified By) সেগুলো হাইলাইট করা হয় - এটি একটি হিউরিস্টিক, নিশ্চিত শ্রেণীবিভাগ নয়।'],
      ]}
      relatedToolIds={['pdf-metadata-viewer', 'docx-metadata-cleaner', 'pdf-metadata-remover']}
    >
      <GenericFileUploader
        accept="application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        acceptLabel="PDF বা DOCX"
        maxSizeBytes={MAX_FILE_SIZE_BYTES}
        onFileSelected={handleFile}
        selectedFile={file}
        onClear={clear}
        disabled={busy}
      />

      {busy && (
        <div className="mt-4">
          <PlatformProcessingStatus label="ডকুমেন্ট পরীক্ষা করা হচ্ছে…" />
        </div>
      )}
      {error && (
        <div className="mt-4">
          <PlatformErrorBox message={error} />
        </div>
      )}

      {fields && (
        <div className="mt-6 space-y-4">
          <div className={`flex items-start gap-3 rounded-lg border p-4 ${hasSensitive ? 'border-amber-900/50 bg-amber-950/20' : 'border-neon-700/40 bg-neon-950/10'}`}>
            {hasSensitive ? (
              <ShieldAlert size={20} className="mt-0.5 flex-shrink-0 text-amber-400" aria-hidden="true" />
            ) : (
              <ShieldCheck size={20} className="mt-0.5 flex-shrink-0 text-neon-400" aria-hidden="true" />
            )}
            <p className={`font-mono text-sm font-bold ${hasSensitive ? 'text-amber-300' : 'text-neon-400'}`}>
              {hasSensitive ? 'সম্ভাব্য সংবেদনশীল তথ্য পাওয়া গেছে' : 'কোনো সম্ভাব্য সংবেদনশীল তথ্য পাওয়া যায়নি'}
            </p>
          </div>

          <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-4">
            <h2 className="font-mono text-xs font-bold uppercase tracking-wide text-cyber-300">
              {kind === 'pdf' ? 'PDF প্রোপার্টি' : 'DOCX প্রোপার্টি'}
            </h2>
            {fields.length === 0 ? (
              <p className="mt-2 text-sm text-cyber-400">কোনো সাপোর্টেড প্রোপার্টি পাওয়া যায়নি।</p>
            ) : (
              <table className="mt-3 w-full text-sm">
                <tbody>
                  {fields.map((f, i) => (
                    <tr key={i} className="border-b border-cyber-700 last:border-0">
                      <td className="whitespace-nowrap py-1.5 pr-3 align-top font-medium text-cyber-100">
                        {f.label}
                        {f.sensitive && <span className="ml-1.5 rounded-full bg-amber-950/50 px-1.5 py-0.5 text-[10px] text-amber-300">সংবেদনশীল?</span>}
                      </td>
                      <td className="break-words py-1.5 align-top text-cyber-200">{f.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
