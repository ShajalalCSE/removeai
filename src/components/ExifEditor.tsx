import { useId, useState } from 'react';
import type { CameraExifFields } from '../types/metadata';
import { CAMERA_PRESETS, nowAsExifDateTime } from '../lib/presets';

interface ExifEditorProps {
  onApply: (fields: CameraExifFields) => void;
  busy?: boolean;
}

const defaultFields = (): CameraExifFields => ({ dateTimeOriginal: nowAsExifDateTime() });

function TextField({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
      />
    </div>
  );
}

export default function ExifEditor({ onApply, busy }: ExifEditorProps) {
  const [fields, setFields] = useState<CameraExifFields>(defaultFields);
  const formId = useId();

  const set = <K extends keyof CameraExifFields>(key: K, value: CameraExifFields[K]) =>
    setFields((prev) => ({ ...prev, [key]: value }));

  const applyPreset = (presetId: string) => {
    const preset = CAMERA_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFields((prev) => ({
        ...preset.fields,
        dateTimeOriginal: prev.dateTimeOriginal || nowAsExifDateTime(),
      }));
    }
  };

  const hasAnyValue = Object.values(fields).some((v) => v && String(v).trim());

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-ink-200 bg-ink-50/60 p-3 text-xs text-ink-600 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-300">
        Values entered here are <strong>user-supplied or simulated</strong>, not verified information read from a
        real camera. GPS coordinates and serial numbers are never generated automatically. Fields left blank are
        not written.
      </div>

      <div>
        <label htmlFor={`${formId}-preset`} className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
          Camera profile preset (optional, simulated)
        </label>
        <select
          id={`${formId}-preset`}
          onChange={(e) => e.target.value && applyPreset(e.target.value)}
          defaultValue=""
          className="focus-ring w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
        >
          <option value="">Choose a preset to prefill the form…</option>
          {CAMERA_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TextField id={`${formId}-make`} label="Camera Make" value={fields.make ?? ''} onChange={(v) => set('make', v)} placeholder="Canon" />
        <TextField id={`${formId}-model`} label="Camera Model" value={fields.model ?? ''} onChange={(v) => set('model', v)} placeholder="EOS R5" />
        <TextField
          id={`${formId}-lens`}
          label="Lens Model"
          value={fields.lensModel ?? ''}
          onChange={(v) => set('lensModel', v)}
          placeholder="RF24-105mm F4L"
        />
        <TextField
          id={`${formId}-date`}
          label="Date and Time"
          value={fields.dateTimeOriginal ?? ''}
          onChange={(v) => set('dateTimeOriginal', v)}
          placeholder="2026-03-05 14:30:00"
        />
        <TextField
          id={`${formId}-exposure`}
          label="Exposure Time"
          value={fields.exposureTime ?? ''}
          onChange={(v) => set('exposureTime', v)}
          placeholder="1/250"
        />
        <TextField id={`${formId}-fnumber`} label="Aperture (F-Number)" value={fields.fNumber ?? ''} onChange={(v) => set('fNumber', v)} placeholder="2.8" />
        <TextField id={`${formId}-iso`} label="ISO" value={fields.iso ?? ''} onChange={(v) => set('iso', v)} placeholder="400" />
        <TextField
          id={`${formId}-focal`}
          label="Focal Length (mm)"
          value={fields.focalLength ?? ''}
          onChange={(v) => set('focalLength', v)}
          placeholder="50"
        />

        <div>
          <label htmlFor={`${formId}-flash`} className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
            Flash
          </label>
          <select
            id={`${formId}-flash`}
            value={fields.flash ?? ''}
            onChange={(e) => set('flash', (e.target.value || undefined) as CameraExifFields['flash'])}
            className="focus-ring w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          >
            <option value="">Not set</option>
            <option value="fired">Fired</option>
            <option value="not-fired">Did not fire</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-wb`} className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
            White Balance
          </label>
          <select
            id={`${formId}-wb`}
            value={fields.whiteBalance ?? ''}
            onChange={(e) => set('whiteBalance', (e.target.value || undefined) as CameraExifFields['whiteBalance'])}
            className="focus-ring w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          >
            <option value="">Not set</option>
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${formId}-orientation`} className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-300">
            Orientation
          </label>
          <select
            id={`${formId}-orientation`}
            value={fields.orientation ?? ''}
            onChange={(e) => set('orientation', e.target.value || undefined)}
            className="focus-ring w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-white"
          >
            <option value="">Not set</option>
            <option value="1">1 - Normal</option>
            <option value="3">3 - Rotated 180°</option>
            <option value="6">6 - Rotated 90° CW</option>
            <option value="8">8 - Rotated 90° CCW</option>
          </select>
        </div>

        <TextField id={`${formId}-software`} label="Software" value={fields.software ?? ''} onChange={(v) => set('software', v)} placeholder="v1.0" />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          disabled={!hasAnyValue || busy}
          onClick={() => onApply(fields)}
          className="focus-ring rounded-lg bg-ink-900 px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:-translate-y-0 dark:bg-accent-600"
        >
          {busy ? 'Writing EXIF…' : 'Apply EXIF to image'}
        </button>
        <button
          type="button"
          onClick={() => setFields(defaultFields())}
          className="focus-ring rounded-lg px-3 py-2 text-sm font-medium text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
