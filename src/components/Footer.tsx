import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-cyber-700 bg-cyber-950">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <a href="https://missionhacker.com" target="_blank" rel="noreferrer" className="focus-ring-neon inline-flex items-center gap-2 rounded-lg">
              <img src="/mission-hackers-logo.png" alt="" aria-hidden="true" className="h-8 w-8 rounded-full" />
              <span className="text-base font-bold text-white">Mission Hackers Bangladesh</span>
            </a>
            <p className="mt-2 text-sm text-cyber-300">
              Image Privacy &amp; Cyber Forensics Tools। প্রতিটি টুল যেখানে সম্ভব আপনার ব্রাউজারের ভেতরেই চলে - কোনো
              ছবি কখনো সার্ভারে আপলোড করা হয় না।
            </p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:flex">
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wide text-cyber-400">টুলস</div>
              <ul className="mt-3 space-y-2 text-sm text-cyber-300">
                <li>
                  <Link to="/" className="hover:text-neon-400">
                    মেটাডেটা রিমুভ করুন
                  </Link>
                </li>
                <li>
                  <Link to="/tools" className="hover:text-neon-400">
                    সব টুল
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-neon-400">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wide text-cyber-400">কোম্পানি</div>
              <ul className="mt-3 space-y-2 text-sm text-cyber-300">
                <li>
                  <Link to="/about" className="hover:text-neon-400">
                    আমাদের সম্পর্কে
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-neon-400">
                    যোগাযোগ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <div className="font-mono text-xs font-semibold uppercase tracking-wide text-cyber-400">লিগ্যাল</div>
              <ul className="mt-3 space-y-2 text-sm text-cyber-300">
                <li>
                  <Link to="/privacy" className="hover:text-neon-400">
                    প্রাইভেসি পলিসি
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-neon-400">
                    ব্যবহারের শর্তাবলী
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-cyber-800 pt-6">
          <p className="text-xs text-cyber-500">
            © {new Date().getFullYear()} Mission Hackers Bangladesh। সব প্রসেসিং আপনার ব্রাউজারেই স্থানীয়ভাবে হয়।
          </p>
        </div>
      </div>
    </footer>
  );
}
