import { downloadBlob } from '../lib/image-export';

interface DownloadButtonProps {
  blob: Blob;
  filename: string;
  label?: string;
  variant?: 'primary' | 'secondary';
}

export default function DownloadButton({ blob, filename, label = 'Download', variant = 'primary' }: DownloadButtonProps) {
  const base = 'focus-ring inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-soft transition-transform hover:-translate-y-0.5';
  const styles =
    variant === 'primary'
      ? 'bg-accent-600 text-white hover:bg-accent-700'
      : 'border border-ink-200 bg-white text-ink-700 hover:border-accent-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200';

  return (
    <button type="button" onClick={() => downloadBlob(blob, filename)} className={`${base} ${styles}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </button>
  );
}
