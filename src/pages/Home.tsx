import { useCallback, useRef, useState } from 'react';
import { Upload, ScanLine, ClipboardCheck, Download as DownloadIcon, Lock, ShieldOff, FileWarning } from 'lucide-react';
import ImageUploader from '../components/ImageUploader';
import ImageCard from '../components/ImageCard';
import ToolsGrid from '../components/platform/ToolsGrid';
import { getImageWorkerClient } from '../lib/worker-client';
import { downloadBlob } from '../lib/image-export';
import { useDocumentMeta } from '../lib/use-document-meta';
import type { UploadedImage } from '../types/metadata';

const HOW_IT_WORKS = [
  { icon: Upload, title: 'Upload', body: 'সাপোর্টেড একটি ফাইল আপলোড বা সিলেক্ট করুন।' },
  { icon: ScanLine, title: 'Inspect', body: 'এর মেটাডেটা পরীক্ষা করুন, বা একটি ক্লিনিং অপারেশন বেছে নিন।' },
  { icon: ClipboardCheck, title: 'Review', body: 'প্রকৃত প্রসেসিং ফলাফল পর্যালোচনা করুন।' },
  { icon: DownloadIcon, title: 'Download', body: 'প্রসেস করা ফাইল বা মেটাডেটা রিপোর্ট ডাউনলোড করুন।' },
];

const HOME_FAQ: [string, string][] = [
  ['ইমেজ মেটাডেটা কী?', 'মেটাডেটা হলো একটি ছবির ফাইলের ভেতরে সংরক্ষিত অতিরিক্ত তথ্য যা ছবির ভিজুয়াল অংশে দেখা যায় না - যেমন ক্যামেরার মডেল, তোলার তারিখ, GPS লোকেশন, বা ব্যবহৃত সফটওয়্যার/জেনারেটরের নাম।'],
  ['একটি ছবি কি GPS লোকেশন প্রকাশ করতে পারে?', 'হ্যাঁ। অনেক স্মার্টফোন ছবি তোলার সময় লোকেশন সার্ভিস চালু থাকলে EXIF ডেটায় GPS কোঅর্ডিনেট যোগ করে। GPS লোকেশন চেকার দিয়ে আপনি তা যাচাই করতে পারেন।'],
  ['EXIF ডেটা কী?', 'EXIF (Exchangeable Image File Format) হলো JPEG, TIFF ও কিছু PNG/WebP ফাইলে ব্যবহৃত একটি স্ট্যান্ডার্ড মেটাডেটা ফরম্যাট, যাতে ক্যামেরা সেটিংস, তারিখ, ও কখনো কখনো GPS তথ্য থাকে।'],
  ['C2PA কন্টেন্ট ক্রেডেনশিয়ালস কী?', 'C2PA হলো একটি ইন্ডাস্ট্রি স্ট্যান্ডার্ড যা একটি ছবির তৈরি ও এডিটিং হিস্ট্রি (প্রোভেন্যান্স) ডিজিটালি সই করে রেকর্ড করে। সব AI-জেনারেটেড ছবিতে C2PA ডেটা থাকে না, আবার C2PA ডেটা না থাকলেই ছবিটি AI-জেনারেটেড নয় তাও প্রমাণ হয় না।'],
  ['মেটাডেটা রিমুভ করলে কি ছবির মান পরিবর্তন হয়?', 'আমাদের টুলে না - মেটাডেটা সরাসরি ফাইল স্ট্রাকচার থেকে রিমুভ করা হয়, পিক্সেল ডেটা কখনো রি-এনকোড করা হয় না, তাই কোনো কোয়ালিটি লস হয় না।'],
  ['মেটাডেটা রিমুভ করলে কি ছবিটি আর AI-জেনারেটেড হিসেবে শনাক্ত করা অসম্ভব হয়ে যায়?', 'না। মেটাডেটা রিমুভ করলে মেটাডেটা-ভিত্তিক সনাক্তকরণ কঠিন হয়, কিন্তু পিক্সেল-ভিত্তিক AI-ডিটেকশন মডেল বা ইনভিজিবল পিক্সেল ওয়াটারমার্ক - যা মেটাডেটার অংশ নয় - তাতে এর কোনো প্রভাব পড়ে না। আমরা কখনো এমন দাবি করি না যে এটি একটি ছবিকে "আনডিটেক্টেবল" করে দেয়।'],
  ['আপলোড করা ফাইল কি সংরক্ষণ করা হয়?', 'না। প্রসেসিং আপনার ব্রাউজারেই হয় এবং ফাইল কখনো কোনো সার্ভারে পাঠানো হয় না, তাই সংরক্ষণেরও প্রশ্ন নেই।'],
  ['কোন কোন ফাইল ফরম্যাট সাপোর্টেড?', 'এই মুহূর্তে ইমেজ টুলগুলো JPEG, PNG ও WebP সাপোর্ট করে। অন্য ক্যাটাগরির (ডকুমেন্ট, ভিডিও, অডিও) টুল এখনো "COMING SOON" হিসেবে চিহ্নিত এবং বর্তমানে কাজ করে না।'],
];

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `img-${idCounter}-${Date.now()}`;
}

export default function Home() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [loadErrors, setLoadErrors] = useState<string[]>([]);
  const [resultCount, setResultCount] = useState(0);
  const resultsRef = useRef(new Map<string, { blob: Blob; filename: string }>());

  useDocumentMeta(
    'Mission Hackers Bangladesh — AI মেটাডেটা রিমুভাল টুল',
    'আপনার JPEG, PNG ও WebP ছবি থেকে AI জেনারেটরের ট্যাগ, EXIF, IPTC ও XMP মেটাডেটা সম্পূর্ণ আপনার ব্রাউজারের ভেতরেই রিমুভ করুন। GPS চেকার, প্রাইভেসি স্ক্যানার ও আরও ফরেনসিক্স টুল সহ।',
    '/',
  );

  const addFiles = useCallback(async (files: File[]) => {
    setLoadErrors([]);
    const client = getImageWorkerClient();

    for (const file of files) {
      const id = nextId();
      try {
        const { report, width, height } = await client.read(file);
        const image: UploadedImage = {
          id,
          file,
          format: report.format,
          previewUrl: URL.createObjectURL(file),
          width,
          height,
          originalReport: report,
        };
        setImages((prev) => [...prev, image]);
      } catch (err) {
        setLoadErrors((prev) => [
          ...prev,
          `"${file.name}": ${err instanceof Error ? err.message : 'পড়া যায়নি।'}`,
        ]);
      }
    }
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
    resultsRef.current.delete(id);
    setResultCount(resultsRef.current.size);
  }, []);

  const handleResultReady = useCallback((id: string, blob: Blob, filename: string) => {
    resultsRef.current.set(id, { blob, filename });
    setResultCount(resultsRef.current.size);
  }, []);

  const downloadAll = useCallback(() => {
    const entries = Array.from(resultsRef.current.values());
    entries.forEach((entry, i) => {
      setTimeout(() => downloadBlob(entry.blob, entry.filename), i * 250);
    });
  }, []);

  const hasResults = resultCount > 0;

  return (
    <div>
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-10 text-center sm:px-6 sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-500/40 bg-neon-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-neon-400 sm:text-xs">
          100% ক্লায়েন্ট-সাইড · কোনো ছবি কখনো আপলোড হয় না
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          AI দিয়ে তৈরি ছবি থেকে "AI Content" বা "AI লেবেল" রিমুভ করুন
          <span className="mt-1 block text-neon-400">একদম বিনামূল্যে।</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-cyber-200 sm:text-base">
          একটি JPEG, PNG বা WebP আপলোড করুন, এতে ঠিক কী কী তথ্য লুকানো আছে দেখুন, আর AI-জেনারেটরের ছাপ বা সব ধরনের
          মেটাডেটা মুছে ফেলুন - আপনার ডিভাইস থেকে ছবি কখনো বাইরে না গিয়েই।
        </p>

        <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-2 text-sm sm:gap-3">
          {[
            ['1', 'আপলোড'],
            ['2', 'প্রসেস'],
            ['3', 'ডাউনলোড'],
          ].map(([n, label]) => (
            <div key={n} className="flex flex-col items-center gap-1.5 rounded-xl border border-cyber-700 bg-cyber-900/60 p-2.5 sm:p-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neon-500 font-mono text-xs font-bold text-cyber-950">
                {n}
              </span>
              <span className="font-medium text-cyber-100">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <ImageUploader onFilesAdded={addFiles} />
        {loadErrors.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
            {loadErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      {images.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white">{images.length}টি ছবি</h2>
            {hasResults && (
              <button
                type="button"
                onClick={downloadAll}
                className="focus-ring rounded-lg border border-cyber-600 bg-cyber-900 px-3.5 py-2 text-sm font-semibold text-cyber-100 hover:border-neon-500/60"
              >
                সবগুলো প্রসেস করা ছবি ডাউনলোড করুন
              </button>
            )}
          </div>
          <div className="space-y-5">
            {images.map((image) => (
              <ImageCard key={image.id} image={image} onRemove={removeImage} onResultReady={handleResultReady} />
            ))}
          </div>
        </section>
      )}

      {/* ============================================================
          Everything below this line is new "tools platform" content,
          added below the original (preserved, light-themed) Remove AI
          Metadata tool above. It uses a separate dark "cyber forensics"
          theme on purpose, per the platform-expansion brief.
          ============================================================ */}

      <section id="tools-grid" className="bg-cyber-950 py-16 text-cyber-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neon-500/40 bg-neon-500/10 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-neon-400">
            Image Privacy &amp; Cyber Forensics Tools
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Explore More Free Tools</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cyber-200">
            ছবির লুকানো তথ্য ইনভেস্টিগেট করুন, আপনার প্রাইভেসি সুরক্ষিত করুন, এবং ডিজিটাল ফাইলের ফুটপ্রিন্ট পরীক্ষা করুন -
            সম্পূর্ণ ফ্রি অনলাইন টুল দিয়ে।
          </p>
          <div className="mt-8">
            <ToolsGrid />
          </div>
        </div>
      </section>

      <section className="bg-cyber-900 py-16 text-cyber-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">How It Works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative rounded-lg border border-cyber-600 bg-cyber-950/60 p-5">
                <span className="font-mono text-xs font-bold text-neon-500">0{i + 1}</span>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-md border border-neon-500/30 bg-neon-500/10 text-neon-400">
                  <step.icon size={20} aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-wide text-white">{step.title}</h3>
                <p className="mt-1.5 text-sm text-cyber-200">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-cyber-950 py-16 text-cyber-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Privacy First</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
              <Lock size={20} className="text-neon-400" aria-hidden="true" />
              <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-wide text-white">ব্রাউজার-ভিত্তিক প্রসেসিং</h3>
              <p className="mt-1.5 text-sm text-cyber-200">
                যেখানে টেকনিক্যালি সম্ভব, প্রতিটি টুল আপনার ব্রাউজারে ফাইল প্রসেস করে - এই সাইটের কোনো টুলেই এই মুহূর্তে
                ফাইল সার্ভারে আপলোড করার দরকার হয় না।
              </p>
            </div>
            <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
              <ShieldOff size={20} className="text-neon-400" aria-hidden="true" />
              <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-wide text-white">ফাইল সংরক্ষণ হয় না</h3>
              <p className="mt-1.5 text-sm text-cyber-200">
                কোনো ডেটাবেস বা সার্ভার-সাইড স্টোরেজ নেই। ট্যাব বন্ধ করলে বা রিফ্রেশ করলে আপলোড করা ফাইল আপনার ব্রাউজারের
                মেমোরি থেকে মুছে যায়।
              </p>
            </div>
            <div className="rounded-lg border border-cyber-700 bg-cyber-900/50 p-5">
              <FileWarning size={20} className="text-amber-400" aria-hidden="true" />
              <h3 className="mt-3 font-mono text-sm font-bold uppercase tracking-wide text-white">এটি নির্ভর করে আপনার ব্রাউজারের উপর</h3>
              <p className="mt-1.5 text-sm text-cyber-200">
                "লোকাল প্রসেসিং" আমাদের কোডের একটি বক্তব্য, আপনার পরিবেশ থেকে স্বাধীন কোনো গ্যারান্টি নয় - এটি নির্ভর করে
                আপনার ব্রাউজার সঠিকভাবে কাজ করছে এবং কোনো এক্সটেনশন হস্তক্ষেপ করছে না তার উপর। বিস্তারিত জানতে{' '}
                <a href="/privacy" className="text-neon-400 underline hover:text-neon-300">
                  প্রাইভেসি পলিসি
                </a>{' '}
                দেখুন।
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cyber-900 py-16 text-cyber-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Frequently Asked Questions</h2>
          <div className="mt-6 divide-y divide-cyber-700">
            {HOME_FAQ.map(([q, a], i) => (
              <details key={i} className="group py-4">
                <summary className="focus-ring-neon flex cursor-pointer list-none items-center justify-between gap-4 rounded text-left text-sm font-semibold text-white">
                  {q}
                  <span className="flex-shrink-0 font-mono text-neon-500 transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-cyber-200">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
