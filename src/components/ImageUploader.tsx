import { useCallback, useId, useRef, useState } from 'react';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/format';
import { formatBytes as formatBytesLabel } from '../lib/binary';

interface ImageUploaderProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" সাপোর্টেড ফরম্যাট না। অনুগ্রহ করে JPEG, PNG বা WebP ব্যবহার করুন।`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" সাইজে অনেক বড় (${formatBytesLabel(file.size)})। প্রতিটি ছবির সর্বোচ্চ সীমা ${formatBytesLabel(MAX_FILE_SIZE_BYTES)}।`;
  }
  if (file.size === 0) {
    return `"${file.name}" খালি মনে হচ্ছে।`;
  }
  return null;
}

export default function ImageUploader({ onFilesAdded, disabled }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const valid: File[] = [];
      const newErrors: string[] = [];
      for (const file of files) {
        const err = validateFile(file);
        if (err) newErrors.push(err);
        else valid.push(file);
      }
      setErrors(newErrors);
      if (valid.length > 0) onFilesAdded(valid);
    },
    [onFilesAdded],
  );

  return (
    <div id="upload">
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        aria-describedby={`${inputId}-help`}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragCounter.current += 1;
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          dragCounter.current -= 1;
          if (dragCounter.current <= 0) {
            dragCounter.current = 0;
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragCounter.current = 0;
          setIsDragging(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        className={`focus-ring group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-ink-200 bg-ink-50 opacity-60 dark:border-ink-800 dark:bg-ink-900'
            : isDragging
              ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20'
              : 'border-ink-200 bg-white hover:border-accent-400 hover:bg-accent-50/40 dark:border-ink-700 dark:bg-ink-900 dark:hover:border-accent-500 dark:hover:bg-accent-900/10'
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 16V4m0 0 4 4m-4-4-4 4M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="text-base font-semibold text-ink-900 dark:text-white">
          ছবি এখানে টেনে এনে ছাড়ুন, বা ব্রাউজ করতে ক্লিক করুন
        </p>
        <p id={`${inputId}-help`} className="mt-1.5 text-sm text-ink-500 dark:text-ink-400">
          JPEG, PNG বা WebP · প্রতিটি সর্বোচ্চ {formatBytesLabel(MAX_FILE_SIZE_BYTES)} · সম্পূর্ণ আপনার ডিভাইসেই প্রসেস হয়
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={ACCEPTED_MIME_TYPES.join(',')}
          disabled={disabled}
          className="sr-only"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
