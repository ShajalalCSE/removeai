import { useCallback, useEffect, useRef, useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import ImageCard from '../components/ImageCard';
import { getImageWorkerClient } from '../lib/worker-client';
import { downloadBlob } from '../lib/image-export';
import type { UploadedImage } from '../types/metadata';

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

  useEffect(() => {
    document.title = 'Mission Hackers Bangladesh — AI মেটাডেটা রিমুভাল টুল';
  }, []);

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
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800 dark:bg-accent-900/40 dark:text-accent-200">
          100% ক্লায়েন্ট-সাইড · কোনো ছবি কখনো আপলোড হয় না
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          আপনার ব্রাউজারেই ছবি থেকে AI ট্যাগ ও লুকানো মেটাডেটা রিমুভ করুন
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-500 dark:text-ink-400">
          একটি JPEG, PNG বা WebP আপলোড করুন, এতে ঠিক কী কী তথ্য লুকানো আছে দেখুন, আর AI-জেনারেটরের ছাপ বা সব ধরনের
          মেটাডেটা মুছে ফেলুন - আপনার ডিভাইস থেকে ছবি কখনো বাইরে না গিয়েই।
        </p>

        <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-3 text-sm">
          {[
            ['1', 'আপলোড'],
            ['2', 'প্রসেস'],
            ['3', 'ডাউনলোড'],
          ].map(([n, label]) => (
            <div key={n} className="flex flex-col items-center gap-1.5 rounded-xl border border-ink-100 bg-white p-3 dark:border-ink-800 dark:bg-ink-900">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-white dark:bg-accent-600">
                {n}
              </span>
              <span className="font-medium text-ink-700 dark:text-ink-200">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <ImageUploader onFilesAdded={addFiles} />
        {loadErrors.length > 0 && (
          <ul className="mt-3 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            {loadErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </section>

      {images.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">{images.length}টি ছবি</h2>
            {hasResults && (
              <button
                type="button"
                onClick={downloadAll}
                className="focus-ring rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-700 hover:border-accent-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
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

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">আপনার প্রাইভেসি, গঠনগতভাবেই নিশ্চিত</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['কোনো আপলোড নেই', 'রিড, ক্লিন ও এডিট - প্রতিটি অপারেশন আপনার ব্রাউজারে বা একটি Web Worker-এ raw বাইটের উপর চলে - ফাইল কখনো নেটওয়ার্ক রিকোয়েস্টের মধ্য দিয়ে যায় না।'],
            ['কোনো রি-কম্প্রেশন নেই', 'ক্যানভাসের মাধ্যমে পিক্সেল রি-এনকোড না করে সরাসরি ফাইল স্ট্রাকচার পরিবর্তন করে মেটাডেটা রিমুভ করা হয়, তাই ছবির কোয়ালিটি অক্ষুণ্ণ থাকে।'],
            ['কিছুই সংরক্ষিত হয় না', 'ট্যাব বন্ধ বা রিফ্রেশ করলে কিছুই থাকে না। আপনার ছবি জমা রাখার জন্য কোনো সার্ভার, ডেটাবেস বা অ্যানালিটিক্স পাইপলাইন নেই।'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-ink-100 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
              <h3 className="text-sm font-semibold text-ink-900 dark:text-white">{title}</h3>
              <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
