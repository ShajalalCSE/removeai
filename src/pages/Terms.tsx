import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/use-document-meta';

export default function Terms() {
  useDocumentMeta(
    'ব্যবহারের শর্তাবলী — Mission Hackers Bangladesh',
    'Mission Hackers Bangladesh-এর ফ্রি টুল ব্যবহারের শর্তাবলী - দায়বদ্ধতার সীমা, অনুমোদিত ব্যবহার, ও আপনার ফাইলের মালিকানা সম্পর্কে।',
    '/terms',
  );

  return (
    <div className="bg-cyber-950 text-cyber-100">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">ব্যবহারের শর্তাবলী</h1>
        <p className="mt-3 text-cyber-400">সর্বশেষ আপডেট: অক্টোবর 2026</p>

        <div className="mt-8 space-y-7 text-sm leading-relaxed text-cyber-200">
          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">সেবা ব্যবহার</h2>
            <p className="mt-2">
              এই সাইটের টুলগুলো Mission Hackers Bangladesh বিনামূল্যে প্রদান করে। এগুলো ব্যবহার করে আপনি নিশ্চিত করছেন
              যে আপনি শুধুমাত্র আইনসম্মত উদ্দেশ্যে এবং এমন ছবি/ফাইলের সাথে এগুলো ব্যবহার করবেন যা পরিবর্তন করার আপনার
              অধিকার আছে।
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">"যেমন আছে" ভিত্তিতে সেবা</h2>
            <p className="mt-2">
              টুলগুলো "যেমন আছে" ভিত্তিতে, কোনো ওয়ারেন্টি ছাড়াই প্রদান করা হয়। আমরা চেষ্টা করি প্রতিটি অপারেশন সঠিকভাবে
              কাজ করুক, কিন্তু কোনো নির্দিষ্ট ফলাফলের গ্যারান্টি দিই না। গুরুত্বপূর্ণ ফাইল প্রসেস করার আগে একটি কপি
              সংরক্ষণ রাখুন।
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">দায়বদ্ধতার সীমা</h2>
            <p className="mt-2">
              এই টুলগুলো ব্যবহারের ফলে সৃষ্ট কোনো ক্ষতি, ডেটা হারানো, বা অন্য কোনো পরিণতির জন্য Mission Hackers
              Bangladesh দায়ী থাকবে না, আইন দ্বারা অনুমোদিত সর্বোচ্চ সীমা পর্যন্ত।
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">আপনার ফাইল</h2>
            <p className="mt-2">
              আপনার আপলোড করা ফাইলের মালিকানা সবসময় আপনার কাছেই থাকে। প্রসেসিং সম্পূর্ণ আপনার ব্রাউজারে হয় বলে আমরা
              কখনো আপনার ফাইলের কপি রাখি না বা অ্যাক্সেস করি না। বিস্তারিত জানতে আমাদের{' '}
              <Link to="/privacy" className="text-neon-400 underline hover:text-neon-300">
                প্রাইভেসি পলিসি
              </Link>{' '}
              দেখুন।
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">অনুমোদিত ব্যবহার</h2>
            <p className="mt-2">
              এই টুলগুলো অন্য কাউকে প্রতারিত করার জন্য, জালিয়াতির জন্য, বা কোনো আইন লঙ্ঘনকারী কাজের জন্য ব্যবহার করা
              যাবে না - যেমন ক্যামেরা EXIF এডিটরের মাধ্যমে তৈরি সিমুলেটেড তথ্যকে প্রকৃত ক্যাপচার তথ্য হিসেবে উপস্থাপন করা।
            </p>
          </section>

          <section>
            <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-white">পরিবর্তন</h2>
            <p className="mt-2">এই শর্তাবলী সময়ে সময়ে আপডেট হতে পারে। উল্লেখযোগ্য পরিবর্তন হলে এই পেজের তারিখ আপডেট করা হবে।</p>
          </section>
        </div>
      </div>
    </div>
  );
}
