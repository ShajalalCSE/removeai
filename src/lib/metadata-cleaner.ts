// Orchestrates metadata removal for a single file: picks the right binary
// stripper for the detected format, re-reads the result to verify, and
// returns a report the UI can render directly.

import type { CleanMode, CleanResult, ImageFormat } from '../types/metadata';
import { bufToUint8, toBlob } from './binary';
import { MIME_BY_FORMAT, sniffFormat } from './format';
import { stripJpegMetadata } from './jpeg';
import { readMetadata } from './metadata-reader';
import { stripPngMetadata } from './png';
import { stripWebpMetadata } from './webp';

const KIND_LABELS: Record<string, string> = {
  exif: 'EXIF (camera data)',
  xmp: 'XMP',
  iptc: 'IPTC / Photoshop IRB',
  icc: 'ICC color profile',
  c2pa: 'Content Credentials / C2PA manifest',
  adobe: 'Adobe APP14 marker',
  jfif: 'JFIF header',
  comment: 'JPEG comment',
  'other-app': 'Application-specific marker',
  tEXt: 'Text chunk',
  zTXt: 'Compressed text chunk',
  iTXt: 'International text chunk',
  eXIf: 'EXIF chunk',
  tIME: 'Modification time chunk',
  iCCP: 'ICC color profile chunk',
  gAMA: 'Gamma chunk',
  cHRM: 'Chromaticity chunk',
  sRGB: 'sRGB chunk',
  EXIF: 'EXIF chunk',
  'XMP ': 'XMP chunk',
  ICCP: 'ICC color profile chunk',
  VP8X: 'Extended feature header',
};

function label(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export async function cleanImage(file: File, mode: CleanMode): Promise<CleanResult> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);
  const format = sniffFormat(bytes);
  if (!format) {
    throw new Error('Unsupported or unrecognized image format. Only JPEG, PNG and WebP are supported.');
  }

  let removed: string[] = [];
  let kept: string[] = [];
  let outBytes: Uint8Array;

  if (format === 'jpeg') {
    const result = stripJpegMetadata(bytes, { mode });
    outBytes = result.bytes;
    removed = result.removed;
    kept = result.kept;
  } else if (format === 'png') {
    const result = stripPngMetadata(bytes, { mode });
    outBytes = result.bytes;
    removed = result.removed;
    kept = result.kept;
  } else {
    const result = stripWebpMetadata(bytes, { mode });
    outBytes = result.bytes;
    removed = result.removed;
    kept = result.kept;
  }

  const blob = toBlob(outBytes, MIME_BY_FORMAT[format]);
  const verification = await readMetadata(blob, format);

  return {
    blob,
    format,
    mode,
    removed: dedupeLabeled(removed),
    kept: dedupeLabeled(kept),
    bytesBefore: bytes.length,
    bytesAfter: outBytes.length,
    recompressed: false,
    verification,
  };
}

function dedupeLabeled(kinds: string[]): string[] {
  const counts = new Map<string, number>();
  for (const k of kinds) counts.set(k, (counts.get(k) ?? 0) + 1);
  return Array.from(counts.entries()).map(([k, n]) => (n > 1 ? `${label(k)} (×${n})` : label(k)));
}

export function describeFormatLimitations(format: ImageFormat, mode: CleanMode): string[] {
  const notes: string[] = [];
  if (format === 'jpeg') {
    notes.push('The ICC color profile and JFIF/Adobe structural markers are kept so colors render correctly in every viewer.');
    if (mode === 'ai') {
      notes.push('Camera EXIF (make, model, exposure, GPS, etc.) is preserved. Only the Software tag, XMP, IPTC/Photoshop and C2PA/Content-Credentials data are removed.');
    } else {
      notes.push('Every APPn marker and comment is removed, including EXIF, XMP, IPTC and ICC - this can occasionally shift colors slightly in software that relies on an embedded profile.');
    }
  } else if (format === 'png') {
    notes.push('PNG has no separate "camera EXIF" container distinct from AI-generation text chunks, so AI removal and full removal behave the same for PNG: all tEXt/zTXt/iTXt/eXIf/tIME chunks are stripped.');
    if (mode === 'all') notes.push('Color-management chunks (iCCP/gAMA/cHRM/sRGB) are also removed in Remove All mode.');
  } else if (format === 'webp') {
    notes.push('WebP metadata lives in EXIF and XMP RIFF chunks, which are removed in both modes.');
    if (mode === 'ai') notes.push('The ICC color profile chunk (ICCP) is preserved in AI-removal mode.');
    else notes.push('The ICC color profile chunk (ICCP) is also removed in Remove All mode.');
  }
  return notes;
}
