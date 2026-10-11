import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <a
              href="https://missionhacker.com"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex items-center gap-2 rounded-lg"
            >
              <img src="/mission-hackers-logo.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-full" />
              <span className="text-base font-bold text-ink-900 dark:text-white">Mission Hackers Bangladesh</span>
            </a>
            <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
              একটি ক্লায়েন্ট-সাইড ইমেজ মেটাডেটা টুল। প্রতিটি ছবি সম্পূর্ণ আপনার ব্রাউজারের ভেতরেই পড়া, পরিষ্কার ও এডিট করা
              হয় - কোনো ছবি কখনো সার্ভারে আপলোড হয় না।
            </p>
          </div>
          <div className="flex gap-10">
            <div>
              <div className="text-sm font-semibold text-ink-900 dark:text-white">টুল</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>
                  <Link to="/" className="hover:text-accent-600 dark:hover:text-accent-400">
                    মেটাডেটা রিমুভ করুন
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
              <div className="text-sm font-semibold text-ink-900 dark:text-white">লিগ্যাল</div>
              <ul className="mt-3 space-y-2 text-sm text-ink-500 dark:text-ink-400">
                <li>
                  <Link to="/privacy" className="hover:text-accent-600 dark:hover:text-accent-400">
                    প্রাইভেসি
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-ink-100 pt-6 dark:border-ink-800">
          <p className="text-xs text-ink-400 dark:text-ink-500">
            © {new Date().getFullYear()} Mission Hackers Bangladesh। সব প্রসেসিং আপনার ব্রাউজারেই স্থানীয়ভাবে হয়।
          </p>
        </div>
      </div>
    </footer>
  );
}
