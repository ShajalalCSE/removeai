import ToolsGrid from '../components/platform/ToolsGrid';
import { useDocumentMeta } from '../lib/use-document-meta';

export default function AllTools() {
  useDocumentMeta(
    'সব টুল — Mission Hackers Bangladesh',
    'ইমেজ ফরেনসিক্স, প্রাইভেসি, অপ্টিমাইজেশন, ডকুমেন্ট, ভিডিও ও অডিও - Mission Hackers Bangladesh-এর সব ফ্রি ব্রাউজার-ভিত্তিক টুলের তালিকা।',
    '/tools',
  );

  return (
    <div className="bg-cyber-950 text-cyber-100">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-500/40 bg-neon-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-neon-400">
          Image Privacy & Cyber Forensics Tools
        </span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">সব ফ্রি টুল</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cyber-200">
          ছবির লুকানো তথ্য ইনভেস্টিগেট করুন, আপনার প্রাইভেসি সুরক্ষিত করুন, এবং ডিজিটাল ফাইলের ফুটপ্রিন্ট পরীক্ষা করুন -
          সম্পূর্ণ ফ্রি, ব্রাউজার-ভিত্তিক টুল দিয়ে।
        </p>
        <div className="mt-8">
          <ToolsGrid />
        </div>
      </div>
    </div>
  );
}
