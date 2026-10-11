import { NavLink } from 'react-router-dom';
import LoginMenu from './LoginMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `focus-ring rounded-md px-1.5 py-1 text-xs font-medium transition-colors sm:px-2 sm:text-sm ${
    isActive ? 'text-neon-400' : 'text-cyber-200 hover:text-white'
  }`;

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-cyber-700 bg-cyber-950/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-6">
        <NavLink to="/" className="focus-ring flex min-w-0 items-center gap-2 rounded-md">
          <img src="/mission-hackers-logo.png" alt="Mission Hackers Bangladesh" className="h-8 w-8 flex-shrink-0 rounded-full sm:h-9 sm:w-9" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-xs font-bold tracking-tight text-white sm:text-base">Mission Hackers Bangladesh</span>
            <span className="hidden text-[11px] font-medium text-neon-400 xs:block">AI মেটাডেটা রিমুভাল</span>
          </span>
        </NavLink>
        <nav className="flex flex-shrink-0 items-center gap-0.5 sm:gap-2">
          <NavLink to="/" className={navLinkClass} end>
            টুল
          </NavLink>
          <NavLink to="/faq" className={navLinkClass}>
            FAQ
          </NavLink>
          <NavLink to="/privacy" className={navLinkClass}>
            প্রাইভেসি
          </NavLink>
          <a
            href="#upload"
            className="focus-ring ml-1 hidden rounded-lg border border-neon-500/50 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wide text-neon-400 transition-colors hover:border-neon-400 hover:shadow-glow-green md:inline-block"
          >
            টুল ওপেন করুন
          </a>
          <LoginMenu />
        </nav>
      </div>
    </header>
  );
}
