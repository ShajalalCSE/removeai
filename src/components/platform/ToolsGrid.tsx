import { useState } from 'react';
import { CATEGORY_LABELS, TOOLS, type ToolCategory } from '../../lib/tools-catalog';
import ToolCard from './ToolCard';

const FILTERS: ('all' | ToolCategory)[] = [
  'all',
  'image-forensics',
  'image-privacy',
  'image-optimization',
  'document-forensics',
  'video',
  'audio',
];

export default function ToolsGrid() {
  const [active, setActive] = useState<'all' | ToolCategory>('all');
  const filtered = active === 'all' ? TOOLS : TOOLS.filter((t) => t.category === active);

  return (
    <div>
      <div role="tablist" aria-label="টুল ক্যাটাগরি" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={active === f}
            onClick={() => setActive(f)}
            className={`focus-ring-neon rounded-full border px-3.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wide transition-colors ${
              active === f
                ? 'border-neon-500 bg-neon-500/10 text-neon-400'
                : 'border-cyber-600 text-cyber-200 hover:border-cyber-400 hover:text-white'
            }`}
          >
            {CATEGORY_LABELS[f]}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </div>
  );
}
