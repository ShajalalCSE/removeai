import { Link } from 'react-router-dom';
import type { ToolDef } from '../../lib/tools-catalog';
import { CATEGORY_LABELS } from '../../lib/tools-catalog';
import CtaLabel from './CtaLabel';

export default function ToolCard({ tool }: { tool: ToolDef }) {
  const Icon = tool.icon;
  const isAvailable = tool.status === 'available';

  const inner = (
    <div
      className={`group relative flex h-full flex-col gap-3 rounded-lg border p-5 transition-all duration-200 ${
        isAvailable
          ? 'border-cyber-600 bg-cyber-900/60 hover:-translate-y-0.5 hover:border-neon-500/60 hover:shadow-glow-green'
          : 'border-cyber-700 bg-cyber-900/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full border border-cyber-500 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-cyber-200">
          {CATEGORY_LABELS[tool.category]}
        </span>
        {!isAvailable && (
          <span className="flex-shrink-0 rounded-full bg-cyber-700 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-cyber-200">
            COMING SOON
          </span>
        )}
      </div>

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-md border ${
          isAvailable ? 'border-neon-500/30 bg-neon-500/10 text-neon-400' : 'border-cyber-600 bg-cyber-800 text-cyber-300'
        }`}
      >
        <Icon size={20} aria-hidden="true" />
      </div>

      <div>
        <h3 className={`font-mono text-sm font-bold uppercase tracking-wide ${isAvailable ? 'text-white' : 'text-cyber-200'}`}>
          {tool.headline}
        </h3>
        <p className="mt-1 text-xs text-cyber-300">{tool.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-cyber-200">{tool.description}</p>
      </div>

      <div className="mt-auto pt-2">
        {isAvailable ? (
          <CtaLabel>{tool.cta}</CtaLabel>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-md border border-cyber-600 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-cyber-400">
            {tool.cta}
          </span>
        )}
      </div>
    </div>
  );

  if (!isAvailable) {
    return (
      <div aria-disabled="true" className="h-full cursor-not-allowed">
        {inner}
      </div>
    );
  }

  return (
    <Link to={tool.route} className="focus-ring-neon block h-full rounded-lg">
      {inner}
    </Link>
  );
}
