// Reads human-readable metadata from an image for display, and separately flags
// signals commonly associated with AI-generated images. This is a best-effort
// summary for the user's benefit - it is not used to decide what gets removed
// (the cleaner in metadata-cleaner.ts makes those decisions directly from the
// binary structure) and it never claims to detect "AI-generated" images, only
// to surface metadata fields that happen to mention a known generator or
// provenance scheme.

import * as exifr from 'exifr';
import type { ImageFormat, MetadataField, MetadataReport } from '../types/metadata';
import { bufToUint8, bytesToAscii } from './binary';
import { classifySegment, parseJpegSegments } from './jpeg';
import { scanPngMetadata } from './png';
import { scanWebpMetadata } from './webp';

const KNOWN_AI_TOOLS = [
  'midjourney',
  'dall-e',
  'dall·e',
  'dalle',
  'openai',
  'stable diffusion',
  'stability ai',
  'dreamstudio',
  'automatic1111',
  'comfyui',
  'invokeai',
  'leonardo.ai',
  'leonardo ai',
  'adobe firefly',
  'firefly',
  'runway',
  'playground ai',
  'ideogram',
  'flux',
  'black forest labs',
  'bing image creator',
  'microsoft designer',
  'nightcafe',
  'craiyon',
  'imagen',
  'google ai',
  'gemini',
  'grok',
  'nano banana',
];

export function detectAiToolMentions(text: string): string[] {
  const lower = text.toLowerCase();
  const found: string[] = [];
  for (const tool of KNOWN_AI_TOOLS) {
    if (lower.includes(tool)) found.push(tool);
  }
  return found;
}

async function buildAiSignalsAndFields(
  format: ImageFormat,
  bytes: Uint8Array,
): Promise<{ aiSignals: string[]; extraFields: MetadataField[]; totalMetadataBytes: number; hasC2pa: boolean }> {
  const signals = new Set<string>();
  const extraFields: MetadataField[] = [];
  let totalMetadataBytes = 0;
  let hasC2pa = false;

  if (format === 'jpeg') {
    const { segments } = parseJpegSegments(bytes);
    for (const seg of segments) {
      if (seg.marker === 0xda || seg.marker === 0xd9) continue;
      const kind = classifySegment(bytes, seg);
      if (kind === 'other-app' || kind === 'exif' || kind === 'xmp' || kind === 'iptc' || kind === 'comment') {
        totalMetadataBytes += seg.length;
      }
      if (kind === 'c2pa') {
        hasC2pa = true;
        signals.add('Content Credentials / C2PA প্রোভেন্যান্স ম্যানিফেস্ট পাওয়া গেছে (APP11 JUMBF)');
      }
      if (kind === 'xmp' || kind === 'iptc' || kind === 'comment') {
        const text = bytesToAscii(bytes, seg.dataStart, seg.dataStart + seg.dataLength);
        for (const tool of detectAiToolMentions(text)) {
          signals.add(`${kind.toUpperCase()} ডেটায় "${tool}"-এর উল্লেখ আছে`);
        }
        if (/digitalsourcetype|trainedalgorithmicmedia|c2pa|was_generated_by|generative/i.test(text)) {
          signals.add(`${kind.toUpperCase()} ডেটায় AI-প্রোভেন্যান্স মার্কার আছে (যেমন digitalSourceType)`);
        }
      }
    }
  } else if (format === 'png') {
    const chunks = scanPngMetadata(bytes);
    for (const c of chunks) totalMetadataBytes += c.byteLength;
    for (const c of chunks) {
      if (c.type === 'caBX') {
        hasC2pa = true;
        signals.add('Content Credentials / C2PA প্রোভেন্যান্স ম্যানিফেস্ট পাওয়া গেছে (caBX চাংক)');
      }
      if (c.keyword && /^(parameters|prompt|workflow|generation)$/i.test(c.keyword)) {
        signals.add(`PNG "${c.keyword}" টেক্সট চাংক পাওয়া গেছে (সাধারণত Stable Diffusion / ComfyUI মেটাডেটায় দেখা যায়)`);
      }
      if (c.keyword) {
        for (const tool of detectAiToolMentions(c.keyword)) {
          signals.add(`PNG টেক্সট চাংকের কীওয়ার্ডে "${tool}"-এর উল্লেখ আছে`);
        }
      }
    }
  } else if (format === 'webp') {
    const chunks = scanWebpMetadata(bytes);
    for (const c of chunks) totalMetadataBytes += c.byteLength;
    if (chunks.some((c) => c.tag === 'C2PA')) {
      hasC2pa = true;
      signals.add('Content Credentials / C2PA প্রোভেন্যান্স ম্যানিফেস্ট পাওয়া গেছে (C2PA RIFF চাংক)');
    }
  }

  return { aiSignals: Array.from(signals), extraFields, totalMetadataBytes, hasC2pa };
}

export async function readMetadata(file: Blob, format: ImageFormat): Promise<MetadataReport> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);

  let parsed: Record<string, any> = {};
  try {
    parsed =
      (await exifr.parse(buf, {
        tiff: true,
        exif: true,
        gps: true,
        iptc: true,
        xmp: true,
        icc: true,
        jfif: true,
        ihdr: true,
        mergeOutput: true,
        translateValues: true,
        reviveValues: true,
      })) ?? {};
  } catch {
    parsed = {};
  }

  const fields: MetadataField[] = [];
  const pushField = (category: MetadataField['category'], label: string, value: unknown) => {
    if (value === undefined || value === null || value === '') return;
    const str = value instanceof Date ? value.toISOString() : String(value);
    if (!str.trim()) return;
    fields.push({ category, label, value: str });
  };

  pushField('EXIF', 'ক্যামেরা মেক', parsed.Make);
  pushField('EXIF', 'ক্যামেরা মডেল', parsed.Model);
  pushField('EXIF', 'লেন্স মডেল', parsed.LensModel);
  pushField('EXIF', 'সফটওয়্যার', parsed.Software);
  pushField('EXIF', 'তোলার তারিখ', parsed.DateTimeOriginal ?? parsed.CreateDate);
  pushField('EXIF', 'এক্সপোজার টাইম', parsed.ExposureTime ? `1/${Math.round(1 / parsed.ExposureTime)}s` : undefined);
  pushField('EXIF', 'F-Number', parsed.FNumber ? `f/${parsed.FNumber}` : undefined);
  pushField('EXIF', 'ISO', parsed.ISO);
  pushField('EXIF', 'ফোকাল লেংথ', parsed.FocalLength ? `${parsed.FocalLength}mm` : undefined);
  pushField('EXIF', 'ফ্ল্যাশ', parsed.Flash);
  pushField('EXIF', 'হোয়াইট ব্যালেন্স', parsed.WhiteBalance);
  pushField('EXIF', 'ওরিয়েন্টেশন', parsed.Orientation);
  const gps = typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number' ? { lat: parsed.latitude, lon: parsed.longitude } : null;
  if (gps) {
    pushField('EXIF', 'GPS লোকেশন', `${gps.lat.toFixed(5)}, ${gps.lon.toFixed(5)}`);
  }
  pushField('ICC', 'কালার প্রোফাইল', parsed.ProfileDescription ?? parsed.ColorSpaceData);
  pushField('IPTC', 'ক্যাপশন', parsed.caption ?? parsed.Caption);
  pushField('IPTC', 'ক্রেডিট', parsed.credit ?? parsed.Credit);
  pushField('IPTC', 'সোর্স', parsed.source ?? parsed.Source);
  pushField('XMP', 'ক্রিয়েটর টুল', parsed.CreatorTool);
  pushField('XMP', 'রাইটস', parsed.Rights ?? parsed.rights);

  const hasExif = Boolean(parsed.Make || parsed.Model || parsed.Software || parsed.ExposureTime || parsed.DateTimeOriginal);
  const hasXmp = Boolean(parsed.CreatorTool || parsed.Rights || fields.some((f) => f.category === 'XMP'));
  const hasIptc = Boolean(parsed.caption || parsed.Caption || parsed.credit || parsed.Credit || parsed.source);
  const hasIcc = Boolean(parsed.ProfileDescription || parsed.ColorSpaceData);

  const extra = await buildAiSignalsAndFields(format, bytes);
  const software: string | null = parsed.Software ? String(parsed.Software) : null;
  const aiSignals = [...extra.aiSignals];
  if (software) {
    for (const tool of detectAiToolMentions(software)) {
      aiSignals.unshift(`EXIF Software ট্যাগে "${software}" লেখা আছে (পরিচিত AI জেনারেটরের সাথে মিলে যায়: ${tool})`);
    }
  }

  return {
    format,
    fields,
    hasExif,
    hasXmp: hasXmp || extra.hasC2pa,
    hasIptc,
    hasIcc,
    hasC2pa: extra.hasC2pa,
    software,
    gps,
    aiSignals: Array.from(new Set(aiSignals)),
    totalMetadataBytes: extra.totalMetadataBytes,
  };
}
