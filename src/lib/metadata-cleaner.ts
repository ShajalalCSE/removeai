// Orchestrates metadata removal for a single file: picks the right binary
// stripper for the detected format, re-reads the result to verify, and
// returns a report the UI can render directly.

import type { CleanMode, CleanResult, GpsRemovalResult, ImageFormat } from '../types/metadata';
import { bufToUint8, toBlob } from './binary';
import { MIME_BY_FORMAT, sniffFormat } from './format';
import { stripJpegGps, stripJpegMetadata } from './jpeg';
import { readMetadata } from './metadata-reader';
import { stripPngGps, stripPngMetadata } from './png';
import { stripWebpGps, stripWebpMetadata } from './webp';

const KIND_LABELS: Record<string, string> = {
  exif: 'EXIF (ক্যামেরা তথ্য)',
  xmp: 'XMP',
  iptc: 'IPTC / Photoshop IRB',
  icc: 'ICC কালার প্রোফাইল',
  c2pa: 'Content Credentials / C2PA ম্যানিফেস্ট',
  adobe: 'Adobe APP14 মার্কার',
  jfif: 'JFIF হেডার',
  comment: 'JPEG কমেন্ট',
  'other-app': 'অ্যাপ্লিকেশন-স্পেসিফিক মার্কার',
  tEXt: 'টেক্সট চাংক',
  zTXt: 'কমপ্রেসড টেক্সট চাংক',
  iTXt: 'ইন্টারন্যাশনাল টেক্সট চাংক',
  eXIf: 'EXIF চাংক',
  tIME: 'মডিফিকেশন টাইম চাংক',
  caBX: 'Content Credentials / C2PA ম্যানিফেস্ট চাংক',
  iCCP: 'ICC কালার প্রোফাইল চাংক',
  gAMA: 'গামা চাংক',
  cHRM: 'ক্রোমাটিসিটি চাংক',
  sRGB: 'sRGB চাংক',
  EXIF: 'EXIF চাংক',
  'XMP ': 'XMP চাংক',
  ICCP: 'ICC কালার প্রোফাইল চাংক',
  C2PA: 'Content Credentials / C2PA ম্যানিফেস্ট চাংক',
  VP8X: 'এক্সটেন্ডেড ফিচার হেডার',
};

function label(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

export async function cleanImage(file: File, mode: CleanMode): Promise<CleanResult> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);
  const format = sniffFormat(bytes);
  if (!format) {
    throw new Error('ফরম্যাট সাপোর্টেড না বা শনাক্ত করা যায়নি। শুধু JPEG, PNG ও WebP সাপোর্টেড।');
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

/** Removes only the GPS IFD pointer from an image's EXIF data, leaving every other
 * EXIF tag (make, model, exposure, etc.), XMP, IPTC and ICC data untouched. */
export async function removeGpsOnly(file: File): Promise<GpsRemovalResult> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);
  const format = sniffFormat(bytes);
  if (!format) {
    throw new Error('ফরম্যাট সাপোর্টেড না বা শনাক্ত করা যায়নি। শুধু JPEG, PNG ও WebP সাপোর্টেড।');
  }

  const result = format === 'jpeg' ? stripJpegGps(bytes) : format === 'png' ? stripPngGps(bytes) : stripWebpGps(bytes);

  const blob = toBlob(result.bytes, MIME_BY_FORMAT[format]);
  const verification = await readMetadata(blob, format);

  return {
    blob,
    format,
    hadGps: result.hadGps,
    bytesBefore: bytes.length,
    bytesAfter: result.bytes.length,
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
    notes.push('ICC কালার প্রোফাইল ও JFIF/Adobe স্ট্রাকচারাল মার্কার রাখা হয়েছে, যাতে সব ভিউয়ারে রং ঠিকভাবে দেখা যায়।');
    if (mode === 'ai') {
      notes.push('ক্যামেরার EXIF (make, model, exposure, GPS, ইত্যাদি) সংরক্ষিত থাকে। শুধু Software ট্যাগ, XMP, IPTC/Photoshop ও C2PA/Content-Credentials ডেটা রিমুভ করা হয়।');
    } else {
      notes.push('EXIF, XMP, IPTC ও ICC সহ প্রতিটি APPn মার্কার ও কমেন্ট রিমুভ করা হয় - এতে এমবেডেড প্রোফাইলের উপর নির্ভরশীল সফটওয়্যারে মাঝে মাঝে সামান্য রং বদলাতে পারে।');
    }
  } else if (format === 'png') {
    notes.push('PNG-তে AI-জেনারেশন টেক্সট চাংক থেকে আলাদা কোনো "camera EXIF" কনটেইনার নেই, তাই PNG-তে AI রিমুভাল ও ফুল রিমুভাল একই রকম আচরণ করে: সব tEXt/zTXt/iTXt/eXIf/tIME চাংক, এবং যেকোনো C2PA/Content Credentials ম্যানিফেস্ট (caBX চাংক) রিমুভ করা হয়।');
    if (mode === 'all') notes.push('Remove All মোডে কালার-ম্যানেজমেন্ট চাংকও (iCCP/gAMA/cHRM/sRGB) রিমুভ করা হয়।');
  } else if (format === 'webp') {
    notes.push('WebP-এর মেটাডেটা থাকে EXIF, XMP ও C2PA/Content Credentials RIFF চাংকে, যা দুই মোডেই রিমুভ করা হয়।');
    if (mode === 'ai') notes.push('AI-রিমুভাল মোডে ICC কালার প্রোফাইল চাংক (ICCP) সংরক্ষিত থাকে।');
    else notes.push('Remove All মোডে ICC কালার প্রোফাইল চাংকও (ICCP) রিমুভ করা হয়।');
  }
  return notes;
}
