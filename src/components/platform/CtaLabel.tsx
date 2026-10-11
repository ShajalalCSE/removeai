import { ArrowRight } from 'lucide-react';

/** Visual twin of HackerButton for use *inside* an already-clickable card
 * (the whole card is a <Link>, so this renders as a <span> - nesting a real
 * <button>/<a> inside a <Link> would be invalid HTML and break a11y). */
export default function CtaLabel({ children, accent = 'green' }: { children: string; accent?: 'green' | 'blue' }) {
  const accentClasses = accent === 'green' ? 'border-neon-500/50 text-neon-400 group-hover:border-neon-400 group-hover:shadow-glow-green' : 'border-wire-500/50 text-wire-400 group-hover:border-wire-400 group-hover:shadow-glow-blue';

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border bg-cyber-900/80 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 ${accentClasses}`}
    >
      {children}
      <ArrowRight size={13} className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
    </span>
  );
}
