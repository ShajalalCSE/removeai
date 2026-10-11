import { useEffect, useRef, useState } from 'react';

// ClearFrame has no accounts system of its own - it delegates entirely to
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
        className="focus-ring rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-700 transition-colors hover:border-accent-400 dark:border-ink-700 dark:text-ink-200"
      >
        Login
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-ink-100 bg-white p-3 shadow-card dark:border-ink-800 dark:bg-ink-900"
        >
          <div className="flex items-center gap-2 border-b border-ink-100 pb-3 dark:border-ink-800">
            <img src="/mission-hackers-logo.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-full" />
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-white">Mission Hackers account</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">Sign in with your missionhacker.com login</p>
            </div>
          </div>
          <a
            href={LOGIN_URL}
            className="focus-ring mt-3 block rounded-lg bg-ink-900 px-3.5 py-2 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-accent-600"
          >
            Log in with Mission Hacker
          </a>
          <p className="mt-3 text-center text-xs text-ink-500 dark:text-ink-400">
            Don't have an account?{' '}
            <a href={REGISTER_URL} className="font-medium text-accent-600 underline hover:text-accent-700 dark:text-accent-400">
              Create one
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
