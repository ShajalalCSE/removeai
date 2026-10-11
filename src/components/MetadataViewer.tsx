import type { CleanResult, MetadataReport } from '../types/metadata';
import { formatBytes } from '../lib/binary';
import { describeFormatLimitations } from '../lib/metadata-cleaner';

interface MetadataViewerProps {
  original: MetadataReport;
  result?: CleanResult;
}

function FieldTable({ report }: { report: MetadataReport }) {
  if (report.fields.length === 0) {
    return <p className="text-sm text-cyber-400">পড়ার মতো কোনো মেটাডেটা ফিল্ড পাওয়া যায়নি।</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <tbody>
          {report.fields.map((f, i) => (
            <tr key={i} className="border-b border-cyber-700 last:border-0">
              <td className="whitespace-nowrap py-1.5 pr-3 align-top text-xs font-medium uppercase tracking-wide text-cyber-400">
                {f.category}
              </td>
              <td className="whitespace-nowrap py-1.5 pr-3 align-top font-medium text-cyber-100">{f.label}</td>
              <td className="break-words py-1.5 align-top text-cyber-200">{f.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MetadataViewer({ original, result }: MetadataViewerProps) {
  const after = result?.verification;
  const notes = result ? describeFormatLimitations(result.format, result.mode) : [];

  return (
    <div className="space-y-5">
      {original.aiSignals.length > 0 && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">অরিজিনাল মেটাডেটায় পাওয়া সিগন্যাল</p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-200">
            {original.aiSignals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-300/80">
            এর মানে শুধু এটুকুই যে মেটাডেটায় পরিচিত কোনো টুল বা প্রোভেন্যান্স স্কিমের উল্লেখ আছে - এটি কোনো দাবি নয় যে
            পিক্সেল বিশ্লেষণ করে ছবিটি AI-জেনারেটেড বলে শনাক্ত করা হয়েছে।
          </p>
        </div>
      )}

      <div className={`grid gap-5 ${result ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-white">অরিজিনাল মেটাডেটা</h4>
          <div className="rounded-lg border border-cyber-700 bg-cyber-900/60 p-3">
            <FieldTable report={original} />
          </div>
        </div>

        {result && after && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-white">প্রসেসিং-এর পর</h4>
            <div className="rounded-lg border border-neon-700/40 bg-neon-950/10 p-3">
              <FieldTable report={after} />
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyber-400">রিমুভ হয়েছে ({result.removed.length})</p>
            {result.removed.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {result.removed.map((r, i) => (
                  <li key={i} className="rounded-full bg-red-950/40 px-2.5 py-0.5 text-xs font-medium text-red-300">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-cyber-400">কিছু মেলেনি - ফাইলে রিমুভ করার মতো কোনো মেটাডেটা ছিল না।</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyber-400">সংরক্ষিত আছে ({result.kept.length})</p>
            {result.kept.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {result.kept.map((k, i) => (
                  <li key={i} className="rounded-full bg-neon-500/10 px-2.5 py-0.5 text-xs font-medium text-neon-400">
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-cyber-400">কিছুই না - সাপোর্টেড সব সেগমেন্ট রিমুভ করা হয়েছে।</p>
            )}
          </div>
        </div>
      )}

      {result && after && (
        <div className="rounded-lg border border-cyber-700 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-cyber-100">ভেরিফিকেশন</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                !after.hasExif && !after.hasXmp && !after.hasIptc && !after.hasC2pa
                  ? 'bg-neon-500/10 text-neon-400'
                  : 'bg-amber-950/40 text-amber-300'
              }`}
            >
              {!after.hasExif && !after.hasXmp && !after.hasIptc && !after.hasC2pa
                ? 'আউটপুটে কোনো EXIF, XMP, IPTC বা C2PA ডেটা পাওয়া যায়নি'
                : 'কিছু মেটাডেটা এখনো আছে (উপরে সংরক্ষিত তালিকা দেখুন)'}
            </span>
          </div>
          <p className="mt-2 text-cyber-300">
            সাইজ: {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)} · কোনো মোডেই পিক্সেল ডেটা
            রি-কম্প্রেস করা হয়নি।
          </p>
          {notes.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-cyber-300">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
