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
    document.title = 'ClearFrame — Remove AI & Hidden Metadata From Your Images';
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
          `"${file.name}": ${err instanceof Error ? err.message : 'could not be read.'}`,
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
          100% client-side · nothing is ever uploaded
        </span>
        <h1 className="mx-auto mt-5 max-w-2xl text-4xl font-extrabold tracking-tight text-ink-900 dark:text-white sm:text-5xl">
          Strip AI tags and hidden metadata from your images, in your browser
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink-500 dark:text-ink-400">
          Upload a JPEG, PNG or WebP, inspect exactly what's embedded in it, and remove AI-generator fingerprints
          or every trace of metadata - without ever leaving your device.
        </p>

        <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 gap-3 text-sm">
          {[
            ['1', 'Upload'],
            ['2', 'Process'],
            ['3', 'Download'],
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
            <h2 className="text-lg font-bold text-ink-900 dark:text-white">
              {images.length} image{images.length > 1 ? 's' : ''}
            </h2>
            {hasResults && (
              <button
                type="button"
                onClick={downloadAll}
                className="focus-ring rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-semibold text-ink-700 hover:border-accent-400 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              >
                Download all processed
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
        <h2 className="text-lg font-bold text-ink-900 dark:text-white">Your privacy, by construction</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ['No uploads', 'Every read, clean and edit operation runs on raw bytes in your browser or a Web Worker - files never touch a network request.'],
            ['No recompression', 'Metadata is removed by rewriting file structure directly, not by re-encoding pixels through a canvas, so image quality is untouched.'],
            ['Nothing stored', 'Nothing persists after you close or refresh the tab. There is no server, database or analytics pipeline to store your images.'],
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
