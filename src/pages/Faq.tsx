const FAQS: [string, string][] = [
  [
    'Does "Remove AI Metadata" guarantee an image can no longer be detected as AI-generated?',
    'No. It removes the metadata fields that commonly identify a generator or provenance scheme - the XMP block, Content Credentials/C2PA manifest, IPTC/Photoshop data, and the EXIF Software tag - while keeping other camera EXIF intact. AI-image detection that works from the pixels themselves (statistical or model-based detectors) is a completely different technique and is unaffected by metadata changes either way. We make no claim about detectability based on pixel analysis.',
  ],
  [
    'Does this re-compress or degrade my image?',
    "No. JPEG, PNG and WebP metadata is removed by directly rewriting each format's container structure (JPEG markers, PNG chunks, WebP RIFF chunks) and copying the pixel data through unchanged. Nothing is decoded and re-encoded through a canvas, so there is no generation loss and dimensions are always preserved.",
  ],
  [
    "What's the difference between 'Remove AI Metadata' and 'Remove All Metadata'?",
    "AI Metadata mode removes XMP, C2PA/Content Credentials, IPTC/Photoshop data and the EXIF Software tag, but keeps other camera EXIF (make, model, exposure, GPS, etc.) and the ICC color profile. Remove All strips every metadata segment/chunk the format supports, including all EXIF and, in PNG/WebP, the color profile too.",
  ],
  [
    'Can I add fake camera information to an image?',
    "You can write EXIF fields like camera make/model, lens, exposure and so on through the Camera EXIF Editor, including from a few illustrative presets. These are clearly marked as user-supplied or simulated. We don't present them as verified facts about how an image was captured, and we never auto-generate GPS coordinates, serial numbers or capture history.",
  ],
  [
    'Why does PNG handle metadata differently from JPEG?',
    "PNG doesn't have a format-level distinction between 'camera EXIF' and 'AI-generation metadata' the way JPEG's EXIF/XMP segments do - tools like Stable Diffusion WebUI and ComfyUI simply write their generation parameters into generic tEXt/iTXt text chunks. Because there's no reliable way to tell those apart from genuine camera data in PNG, both removal modes strip all text/XMP/EXIF chunks for PNG.",
  ],
  [
    'What happens to unsupported fields or formats?',
    'If a field cannot be reliably written or a chunk cannot be parsed, the tool reports it explicitly as skipped (with a reason) rather than silently doing nothing or claiming success. You can see exactly what was written, removed, preserved, or skipped for every operation.',
  ],
  [
    'Do you support HEIC, TIFF, or other formats?',
    'Not currently. JPEG, PNG and WebP cover the vast majority of AI-image-generator outputs and were chosen because their metadata structures can be parsed and rewritten losslessly and reliably in a browser.',
  ],
];

import { useEffect } from 'react';

export default function Faq() {
  useEffect(() => {
    document.title = 'FAQ — ClearFrame';
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 dark:text-white">Frequently asked questions</h1>
      <div className="mt-8 divide-y divide-ink-100 dark:divide-ink-800">
        {FAQS.map(([q, a], i) => (
          <details key={i} className="group py-5">
            <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 rounded-md text-left text-base font-semibold text-ink-900 dark:text-white">
              {q}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                className="flex-shrink-0 text-ink-400 transition-transform group-open:rotate-45"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink-500 dark:text-ink-400">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
