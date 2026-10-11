import { NavLink } from 'react-router-dom';
import LoginMenu from './LoginMenu';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors focus-ring rounded-md px-2 py-1 ${
    isActive ? 'text-accent-700 dark:text-accent-300' : 'text-ink-600 hover:text-ink-900 dark:text-ink-300 dark:hover:text-white'
  }`;

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100/80 bg-white/90 backdrop-blur-md dark:border-ink-800/80 dark:bg-ink-950/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 focus-ring rounded-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-600 text-white shadow-soft">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M8 20.5 13 10l4 7 3-4.5 4 8" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="22.5" cy="9.5" r="2.2" fill="white" />
            </svg>
          </span>
          <span className="text-lg font-bold tracking-tight text-ink-900 dark:text-white">ClearFrame</span>
        </NavLink>
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink to="/" className={navLinkClass} end>
            Tool
          </NavLink>
          <NavLink to="/faq" className={navLinkClass}>
            FAQ
          </NavLink>
          <NavLink to="/privacy" className={navLinkClass}>
            Privacy
          </NavLink>
          <a
            href="#upload"
            className="ml-2 hidden rounded-lg bg-ink-900 px-3.5 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 dark:bg-accent-600 sm:inline-block"
          >
            Open Tool
          </a>
          <LoginMenu />
        </nav>
      </div>
    </header>
  );
}
