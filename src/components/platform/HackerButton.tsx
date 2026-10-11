import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

interface HackerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  accent?: 'green' | 'blue';
  busy?: boolean;
  busyLabel?: string;
  children: ReactNode;
}

/** The cyber-forensics "command" button: bold uppercase, glowing neon border on
 * hover/focus, icon + trailing arrow, genuine loading state. Used across the
 * new tools-platform pages only - the original tool's buttons are untouched. */
export default function HackerButton({
  icon,
  accent = 'green',
  busy,
  busyLabel,
  children,
  className = '',
  disabled,
  ...rest
}: HackerButtonProps) {
  const accentClasses =
    accent === 'green'
      ? 'border-neon-500/50 text-neon-400 hover:border-neon-400 hover:shadow-glow-green hover:text-neon-300'
      : 'border-wire-500/50 text-wire-400 hover:border-wire-400 hover:shadow-glow-blue hover:text-wire-300';

  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`focus-ring-neon group inline-flex items-center gap-2 rounded-md border bg-cyber-900/80 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none ${accentClasses} ${className}`}
      {...rest}
    >
      {busy ? (
        <>
          <Loader2 size={15} className="flex-shrink-0 animate-spin" aria-hidden="true" />
          {busyLabel ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
          <ArrowRight size={14} className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </>
      )}
    </button>
  );
}
