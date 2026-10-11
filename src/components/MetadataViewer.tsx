import type { CleanResult, MetadataReport } from '../types/metadata';
import { formatBytes } from '../lib/binary';
import { describeFormatLimitations } from '../lib/metadata-cleaner';

interface MetadataViewerProps {
  original: MetadataReport;
  result?: CleanResult;
}

function FieldTable({ report }: { report: MetadataReport }) {
  if (report.fields.length === 0) {
    return <p className="text-sm text-ink-400 dark:text-ink-500">No readable metadata fields found.</p>;
  }
  return (
    <table className="w-full text-sm">
      <tbody>
        {report.fields.map((f, i) => (
          <tr key={i} className="border-b border-ink-100 last:border-0 dark:border-ink-800">
            <td className="whitespace-nowrap py-1.5 pr-3 align-top text-xs font-medium uppercase tracking-wide text-ink-400 dark:text-ink-500">
              {f.category}
            </td>
            <td className="py-1.5 pr-3 align-top font-medium text-ink-700 dark:text-ink-200">{f.label}</td>
            <td className="py-1.5 align-top text-ink-600 dark:text-ink-300">{f.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function MetadataViewer({ original, result }: MetadataViewerProps) {
  const after = result?.verification;
  const notes = result ? describeFormatLimitations(result.format, result.mode) : [];

  return (
    <div className="space-y-5">
      {original.aiSignals.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
            Signals found in original metadata
          </p>
          <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-sm text-amber-800 dark:text-amber-200">
            {original.aiSignals.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300/80">
            This only means the metadata mentions a known tool or provenance scheme - it is not a claim that the
            pixels themselves were analyzed or found to be AI-generated.
          </p>
        </div>
      )}

      <div className={`grid gap-5 ${result ? 'sm:grid-cols-2' : ''}`}>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Original metadata</h4>
          <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3 dark:border-ink-800 dark:bg-ink-900/40">
            <FieldTable report={original} />
          </div>
        </div>

        {result && after && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">After processing</h4>
            <div className="rounded-lg border border-accent-200 bg-accent-50/50 p-3 dark:border-accent-800 dark:bg-accent-950/20">
              <FieldTable report={after} />
            </div>
          </div>
        )}
      </div>

      {result && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Removed ({result.removed.length})
            </p>
            {result.removed.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {result.removed.map((r, i) => (
                  <li key={i} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/50 dark:text-red-300">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-400 dark:text-ink-500">Nothing matched - the file had no removable metadata.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
              Preserved ({result.kept.length})
            </p>
            {result.kept.length > 0 ? (
              <ul className="mt-1 flex flex-wrap gap-1.5">
                {result.kept.map((k, i) => (
                  <li key={i} className="rounded-full bg-accent-100 px-2.5 py-0.5 text-xs font-medium text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
                    {k}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-400 dark:text-ink-500">Nothing - every supported segment was removed.</p>
            )}
          </div>
        </div>
      )}

      {result && after && (
        <div className="rounded-lg border border-ink-100 p-3 text-sm dark:border-ink-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-medium text-ink-700 dark:text-ink-200">Verification</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                !after.hasExif && !after.hasXmp && !after.hasIptc && !after.hasC2pa
                  ? 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
              }`}
            >
              {!after.hasExif && !after.hasXmp && !after.hasIptc && !after.hasC2pa
                ? 'No EXIF, XMP, IPTC or C2PA data detected in output'
                : 'Some metadata remains (see preserved list above)'}
            </span>
          </div>
          <p className="mt-2 text-ink-500 dark:text-ink-400">
            Size: {formatBytes(result.bytesBefore)} → {formatBytes(result.bytesAfter)} · pixel data was not
            recompressed in either mode.
          </p>
          {notes.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-ink-500 dark:text-ink-400">
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
