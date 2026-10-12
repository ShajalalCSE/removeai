import { useCallback, useId, useRef, useState } from 'react';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../lib/format';
import { formatBytes as formatBytesLabel } from '../lib/binary';
import { toStableFile } from '../lib/file-utils';

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
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      const valid: File[] = [];
      const newErrors: string[] = [];
      for (const file of files) {
        const err = validateFile(file);
        if (err) {
          newErrors.push(err);
          continue;
        }
        try {
          valid.push(await toStableFile(file));
        } catch (readErr) {
          newErrors.push(readErr instanceof Error ? readErr.message : `"${file.name}" পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।`);
        }
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
        className={`focus-ring group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition-colors sm:px-6 sm:py-14 ${
          disabled
            ? 'cursor-not-allowed border-cyber-700 bg-cyber-900/40 opacity-60'
            : isDragging
              ? 'border-neon-500 bg-neon-500/5'
              : 'border-cyber-600 bg-cyber-900/40 hover:border-neon-500/60 hover:bg-neon-500/5'
        }`}
      >
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-neon-500/30 bg-neon-500/10 text-neon-400">
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
        <p className="text-base font-semibold text-white">ছবি এখানে টেনে এনে ছাড়ুন, বা ব্রাউজ করতে ক্লিক করুন</p>
        <p id={`${inputId}-help`} className="mt-1.5 text-sm text-cyber-300">
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
            const input = e.target;
            handleFiles(input.files).finally(() => {
              input.value = '';
            });
          }}
        />
      </div>
      {errors.length > 0 && (
        <ul className="mt-3 space-y-1 rounded-lg border border-red-900/50 bg-red-950/30 p-3 text-sm text-red-300">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
