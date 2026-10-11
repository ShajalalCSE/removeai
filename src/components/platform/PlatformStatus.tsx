import { Loader2 } from 'lucide-react';

export function PlatformProcessingStatus({ label }: { label: string }) {
  return (
    <div role="status" className="flex items-center gap-2 font-mono text-sm font-medium text-neon-400">
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function PlatformErrorBox({ message }: { message: string }) {
  return <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">{message}</div>;
}
