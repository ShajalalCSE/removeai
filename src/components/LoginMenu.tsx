import { useEffect, useRef, useState } from 'react';

// This site has no accounts system of its own - it delegates entirely to
// Mission Hackers Bangladesh's existing login/signup. The `redirect` query
// param is a best-effort guess at the convention their Next.js app might
// read to bounce back here after auth; if their app doesn't honor it, the
// links still work, they just land on missionhacker.com instead of back here.
const SITE_URL = 'https://removeai.missionhacker.com';
const LOGIN_URL = `https://www.missionhacker.com/login?redirect=${encodeURIComponent(SITE_URL)}`;
const REGISTER_URL = `https://www.missionhacker.com/register?redirect=${encodeURIComponent(SITE_URL)}`;

export default function LoginMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="focus-ring rounded-lg border border-cyber-600 px-3 py-1.5 text-xs font-medium text-cyber-200 transition-colors hover:border-neon-500/60 hover:text-white sm:text-sm"
      >
        লগইন
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-cyber-700 bg-cyber-900 p-3 shadow-card"
        >
          <div className="flex items-center gap-2 border-b border-cyber-700 pb-3">
            <img src="/mission-hackers-logo.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-white">Mission Hackers অ্যাকাউন্ট</p>
              <p className="text-xs text-cyber-400">আপনার missionhacker.com লগইন দিয়ে সাইন ইন করুন</p>
            </div>
          </div>
          <a
            href={LOGIN_URL}
            className="focus-ring mt-3 block rounded-lg border border-neon-500/50 bg-neon-500/10 px-3.5 py-2 text-center text-sm font-semibold text-neon-400 transition-all hover:-translate-y-0.5 hover:shadow-glow-green"
          >
            Mission Hacker দিয়ে লগইন করুন
          </a>
          <p className="mt-3 text-center text-xs text-cyber-400">
            অ্যাকাউন্ট নেই?{' '}
            <a href={REGISTER_URL} className="font-medium text-neon-400 underline hover:text-neon-300">
              একটি তৈরি করুন
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
