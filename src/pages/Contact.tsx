import { Send, Users, Globe } from 'lucide-react';
import { useDocumentMeta } from '../lib/use-document-meta';

export default function Contact() {
  useDocumentMeta(
    'যোগাযোগ — Mission Hackers Bangladesh',
    'Mission Hackers Bangladesh-এর সাথে যোগাযোগ করুন - ওয়েবসাইট, Telegram ও Facebook চ্যানেলের মাধ্যমে।',
    '/contact',
  );

  const channels = [
    { icon: Globe, label: 'ওয়েবসাইট', href: 'https://missionhacker.com', value: 'missionhacker.com' },
    { icon: Send, label: 'Telegram', href: 'https://t.me/missionhacker', value: 't.me/missionhacker' },
    { icon: Users, label: 'Facebook', href: 'https://www.facebook.com/Missionhackersbangladesh', value: 'Mission Hackers Bangladesh' },
  ];

  return (
    <div className="bg-cyber-950 text-cyber-100">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">যোগাযোগ</h1>
        <p className="mt-3 text-sm leading-relaxed text-cyber-200">
          এই টুলগুলো সম্পর্কে প্রশ্ন, সমস্যার রিপোর্ট, বা পরামর্শ থাকলে Mission Hackers Bangladesh-এর নিচের চ্যানেলগুলোর
          মাধ্যমে যোগাযোগ করুন।
        </p>

        <div className="mt-8 space-y-3">
          {channels.map((c) => (
            <a
              key={c.label}
              href={c.href}
              target="_blank"
              rel="noreferrer"
              className="focus-ring-neon flex items-center gap-3 rounded-lg border border-cyber-700 bg-cyber-900/50 p-4 transition-colors hover:border-neon-500/60"
            >
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-neon-500/30 bg-neon-500/10 text-neon-400">
                <c.icon size={18} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs text-cyber-400">{c.label}</span>
                <span className="block text-sm font-medium text-white">{c.value}</span>
              </span>
            </a>
          ))}
        </div>

        <p className="mt-8 text-xs text-cyber-400">
          অনুগ্রহ করে মনে রাখবেন: এই পেজের মাধ্যমে কোনো ছবি বা ফাইল পাঠানোর দরকার নেই - সব প্রসেসিং আপনার ব্রাউজারেই হয়।
        </p>
      </div>
    </div>
  );
}
