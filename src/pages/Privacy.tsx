import { useDocumentMeta } from '../lib/use-document-meta';

export default function Privacy() {
  useDocumentMeta(
    'প্রাইভেসি — Mission Hackers Bangladesh',
    'Mission Hackers Bangladesh-এর টুলগুলো কীভাবে আপনার ফাইল হ্যান্ডল করে তার বিস্তারিত - লোকাল প্রসেসিং, কোনো আপলোড নেই, কোনো সংরক্ষণ নেই।',
    '/privacy',
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">প্রাইভেসি</h1>
      <p className="mt-3 text-ink-500 dark:text-ink-400">সর্বশেষ আপডেট: মার্চ 2026</p>

      <div className="mt-8 space-y-8 text-ink-700 dark:text-ink-300">
        <section>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">আপনার ছবি কখনো আপনার ডিভাইস থেকে বের হয় না</h2>
          <p className="mt-2">
            এই টুলের কোনো ব্যাকএন্ড, API বা ইমেজ-আপলোড এন্ডপয়েন্ট নেই। প্রতিটি অপারেশন - মেটাডেটা পড়া, রিমুভ করা, আর নতুন
            ক্যামেরা EXIF ভ্যালু লেখা - আপনার ব্রাউজারের ভেতরেই চলে, ব্রাউজারে বিল্ট-ইন File, Blob ও Web Worker API
            ব্যবহার করে। সাইটটি স্ট্যাটিক ফাইলের একটি সেট; একবার লোড হয়ে গেলে, আপনার ছবি প্রসেস করার জন্য এর কোনো নেটওয়ার্ক
            কানেকশনের দরকার হয় না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">এটি কীসের উপর নির্ভর করে</h2>
          <p className="mt-2">
            "লোকাল প্রসেসিং" হলো এই অ্যাপ্লিকেশনের কোডের ব্যাপারে একটি বক্তব্য, আপনার এনভায়রনমেন্ট থেকে স্বাধীন কোনো
            গ্যারান্টি নয়। এটি নির্ভর করে আপনার ব্রাউজার আমাদের ব্যবহৃত Web API-গুলো (File reading, Web Workers, Blob
            URLs) সঠিকভাবে ইমপ্লিমেন্ট করছে কিনা তার উপর, এবং কোনো ব্রাউজার এক্সটেনশন বা মিডলওয়্যার পেজের কন্টেন্ট
            ইন্টারসেপ্ট করছে না তার উপর। এই লেয়ারগুলো আমরা নিয়ন্ত্রণ করি না এবং এ নিয়ে গ্যারান্টি দিতে পারি না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">ছবির কন্টেন্টের উপর কোনো অ্যানালিটিক্স নেই</h2>
          <p className="mt-2">
            আপনার ছবি, এর মেটাডেটা, বা এর থেকে পাওয়া কোনো তথ্য আমরা কোনো অ্যানালিটিক্স বা থার্ড-পার্টি সার্ভিসে পাঠাই না।
            সাইট সার্ভ করার জন্য Cloudflare Pages স্ট্যান্ডার্ড স্ট্যাটিক-হোস্টিং অ্যাক্সেস লগ (IP অ্যাড্রেস, রিকোয়েস্ট করা
            পাথ, টাইমস্ট্যাম্প) তৈরি করে, যেকোনো ওয়েবসাইটের মতোই - এই লগে কখনো ছবির কন্টেন্ট থাকে না, কারণ ছবি কখনো
            সার্ভারে পাঠানোই হয় না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">কিছুই সংরক্ষণ করা হয় না</h2>
          <p className="mt-2">
            আপলোড করা ফাইল শুধু আপনার সেশন চলাকালীন আপনার ব্রাউজারের মেমোরিতে থাকে। ট্যাব রিফ্রেশ বা বন্ধ করলে সেগুলো
            মুছে যায়। এই টুল কোনো ডেটাবেস ব্যবহার করে না, এবং আপনার ছবি ব্রাউজার স্টোরেজে (localStorage, IndexedDB, বা
            এরকম কিছুতে) কোনোভাবেই লিখে রাখে না।
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">বিজ্ঞাপন</h2>
          <p className="mt-2">
            এই মুহূর্তে এই সাইটে কোনো বিজ্ঞাপন দেখানো হয় না। হোস্টিং খরচ মেটাতে ভবিষ্যতে যদি আমরা Google AdSense চালু
            করি, তাহলে এই সেকশনটি আগে আপডেট করা হবে। চালু হলে, AdSense ও এর পার্টনাররা বিজ্ঞাপন দেখাতে ও পরিমাপ করতে
            আপনার ব্রাউজারে কুকি বা এরকম আইডেন্টিফায়ার ব্যবহার করতে পারে - এটি শুধু বিজ্ঞাপনের স্লটের ক্ষেত্রেই প্রযোজ্য এবং
            আপনার ছবিতে এর কোনো অ্যাক্সেস নেই, যা কখনো কোথাও পাঠানোই হয় না। বিজ্ঞাপন পার্সোনালাইজেশন আপনি{' '}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-accent-600 underline hover:text-accent-700 dark:text-accent-400"
            >
              adssettings.google.com
            </a>
            -এ নিয়ন্ত্রণ করতে পারবেন।
          </p>
        </section>
      </div>
    </div>
  );
}
