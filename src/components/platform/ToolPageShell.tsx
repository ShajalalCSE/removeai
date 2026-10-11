import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TOOLS } from '../../lib/tools-catalog';
import { useDocumentMeta } from '../../lib/use-document-meta';
import ToolCard from './ToolCard';

interface ToolPageShellProps {
  icon: LucideIcon;
  pageTitle: string; // used for document.title and breadcrumb, Bengali
  headline: string; // English hacker-style headline
  description: string; // Bengali one/two-line description
  children: ReactNode; // the actual upload/result interaction area
  howToUse: string[];
  faq: [string, string][];
  relatedToolIds: string[];
}

export default function ToolPageShell({ icon: Icon, pageTitle, headline, description, children, howToUse, faq, relatedToolIds }: ToolPageShellProps) {
  const location = useLocation();
  useDocumentMeta(`${pageTitle} — Mission Hackers Bangladesh`, description, location.pathname);

  const related = TOOLS.filter((t) => relatedToolIds.includes(t.id));

  return (
    <div className="bg-cyber-950 text-cyber-100">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 font-mono text-xs text-cyber-300">
          <Link to="/" className="hover:text-neon-400">
            হোম
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link to="/tools" className="hover:text-neon-400">
            সব টুল
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-cyber-100">{pageTitle}</span>
        </nav>

        <div className="mt-6 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border border-neon-500/30 bg-neon-500/10 text-neon-400">
            <Icon size={24} aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-mono text-2xl font-bold uppercase tracking-wide text-white sm:text-3xl">{headline}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-cyber-200">{description}</p>
          </div>
        </div>

        <div className="mt-8">{children}</div>

        <section className="mt-12 rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
          <div className="flex items-start gap-3">
            <Lock size={18} className="mt-0.5 flex-shrink-0 text-neon-400" aria-hidden="true" />
            <div>
              <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">প্রাইভেসি</h2>
              <p className="mt-1.5 text-sm text-cyber-200">
                এই টুলের প্রসেসিং সম্পূর্ণ আপনার ব্রাউজারে হয় - কোনো ফাইল সার্ভারে আপলোড করা হয় না। আরও বিস্তারিত জানতে{' '}
                <Link to="/privacy" className="text-neon-400 underline hover:text-neon-300">
                  প্রাইভেসি পলিসি
                </Link>{' '}
                দেখুন।
              </p>
            </div>
          </div>
        </section>

        {howToUse.length > 0 && (
          <section className="mt-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">কীভাবে ব্যবহার করবেন</h2>
            <ol className="mt-3 space-y-2">
              {howToUse.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-cyber-200">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border border-neon-500/40 font-mono text-[11px] font-bold text-neon-400">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>
        )}

        {faq.length > 0 && (
          <section className="mt-8">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">FAQ</h2>
            <div className="mt-3 divide-y divide-cyber-700">
              {faq.map(([q, a], i) => (
                <details key={i} className="group py-3">
                  <summary className="focus-ring-neon flex cursor-pointer list-none items-center justify-between gap-3 rounded text-sm font-semibold text-white">
                    {q}
                    <ChevronRight size={14} className="flex-shrink-0 text-cyber-300 transition-transform group-open:rotate-90" aria-hidden="true" />
                  </summary>
                  <p className="mt-2 text-sm leading-relaxed text-cyber-200">{a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">সম্পর্কিত টুল</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {related.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
