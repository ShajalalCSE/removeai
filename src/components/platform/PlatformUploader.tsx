import { useCallback, useId, useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { ACCEPTED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../../lib/format';
import { formatBytes } from '../../lib/binary';
import { toStableFile } from '../../lib/file-utils';

interface PlatformUploaderProps {
  onFileSelected: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
  label?: string;
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return `"${file.name}" সাপোর্টেড ফরম্যাট না। অনুগ্রহ করে JPEG, PNG বা WebP ব্যবহার করুন।`;
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `"${file.name}" সাইজে অনেক বড় (${formatBytes(file.size)})। সর্বোচ্চ সীমা ${formatBytes(MAX_FILE_SIZE_BYTES)}।`;
  }
  if (file.size === 0) {
    return `"${file.name}" খালি মনে হচ্ছে।`;
  }
  return null;
}

/** Single-file dark-themed upload dropzone for the new tools-platform pages.
 * Reuses the same validation rules as the original ImageUploader but is a
 * separate component so the preserved tool's uploader is never touched. */
export default function PlatformUploader({ onFileSelected, selectedFile, onClear, disabled, label }: PlatformUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];
      const err = validateFile(file);
      if (err) {
        setError(err);
        return;
      }
      try {
        setError(null);
        onFileSelected(await toStableFile(file));
      } catch {
        setError(`"${file.name}" পড়া যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।`);
      }
    },
    [onFileSelected],
  );

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-cyber-600 bg-cyber-900/60 p-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-white">{selectedFile.name}</p>
          <p className="text-xs text-cyber-300">{formatBytes(selectedFile.size)}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={disabled}
          aria-label="ফাইল সরান"
          className="focus-ring-neon flex-shrink-0 rounded-md p-1.5 text-cyber-300 hover:bg-cyber-800 hover:text-white disabled:opacity-40"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div>
      {label && <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-cyber-300">{label}</p>}
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
        className={`focus-ring-neon flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
          disabled
            ? 'cursor-not-allowed border-cyber-700 bg-cyber-900/30 opacity-50'
            : isDragging
              ? 'border-neon-500 bg-neon-500/5'
              : 'border-cyber-600 bg-cyber-900/40 hover:border-neon-500/60'
        }`}
      >
        <UploadCloud size={28} className="mb-3 text-neon-400" aria-hidden="true" />
        <p className="text-sm font-semibold text-white">ফাইল টেনে এনে ছাড়ুন, বা ক্লিক করুন</p>
        <p id={`${inputId}-help`} className="mt-1 text-xs text-cyber-300">
          JPEG, PNG বা WebP · সর্বোচ্চ {formatBytes(MAX_FILE_SIZE_BYTES)}
        </p>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
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
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
