import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <div className="text-base font-bold text-ink-900 dark:text-white">ClearFrame</div>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              A client-side image metadata tool. Every image is read, cleaned and edited entirely inside your
              browser - nothing is ever uploaded to a server.
            </p>
          </div>
          <div className="flex gap-10">
            <div>
              <div className="text-sm font-semibold text-ink-900 dark:text-white">Tool</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>
                  <Link to="/" className="hover:text-accent-600 dark:hover:text-accent-400">
                    Remove metadata
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-accent-600 dark:hover:text-accent-400">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-900 dark:text-white">Legal</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>
                  <Link to="/privacy" className="hover:text-accent-600 dark:hover:text-accent-400">
                    Privacy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t border-ink-100 pt-6 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400 dark:text-ink-500">
            © {new Date().getFullYear()} ClearFrame. All processing happens locally in your browser.
          </p>
          <a
            href="https://missionhacker.com"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-2 rounded-lg text-xs text-ink-500 transition-colors hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
          >
            <img src="/mission-hackers-logo.png" alt="" aria-hidden="true" className="h-7 w-7 rounded-full" />
            <span>
              A project by <span className="font-semibold text-ink-700 dark:text-ink-200">Mission Hackers Bangladesh</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
