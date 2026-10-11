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

function detectAiToolMentions(text: string): string[] {
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
        signals.add('Content Credentials / C2PA provenance manifest detected (APP11 JUMBF)');
      }
      if (kind === 'xmp' || kind === 'iptc' || kind === 'comment') {
        const text = bytesToAscii(bytes, seg.dataStart, seg.dataStart + seg.dataLength);
        for (const tool of detectAiToolMentions(text)) {
          signals.add(`${kind.toUpperCase()} data mentions "${tool}"`);
        }
        if (/digitalsourcetype|trainedalgorithmicmedia|c2pa|was_generated_by|generative/i.test(text)) {
          signals.add(`${kind.toUpperCase()} data contains AI-provenance markers (e.g. digitalSourceType)`);
        }
      }
    }
  } else if (format === 'png') {
    const chunks = scanPngMetadata(bytes);
    for (const c of chunks) totalMetadataBytes += c.byteLength;
    for (const c of chunks) {
      if (c.keyword && /^(parameters|prompt|workflow|generation)$/i.test(c.keyword)) {
        signals.add(`PNG "${c.keyword}" text chunk detected (common Stable Diffusion / ComfyUI metadata)`);
      }
      if (c.keyword) {
        for (const tool of detectAiToolMentions(c.keyword)) {
          signals.add(`PNG text chunk keyword mentions "${tool}"`);
        }
      }
    }
  } else if (format === 'webp') {
    const chunks = scanWebpMetadata(bytes);
    for (const c of chunks) totalMetadataBytes += c.byteLength;
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

  pushField('EXIF', 'Camera Make', parsed.Make);
  pushField('EXIF', 'Camera Model', parsed.Model);
  pushField('EXIF', 'Lens Model', parsed.LensModel);
  pushField('EXIF', 'Software', parsed.Software);
  pushField('EXIF', 'Date Taken', parsed.DateTimeOriginal ?? parsed.CreateDate);
  pushField('EXIF', 'Exposure Time', parsed.ExposureTime ? `1/${Math.round(1 / parsed.ExposureTime)}s` : undefined);
  pushField('EXIF', 'F-Number', parsed.FNumber ? `f/${parsed.FNumber}` : undefined);
  pushField('EXIF', 'ISO', parsed.ISO);
  pushField('EXIF', 'Focal Length', parsed.FocalLength ? `${parsed.FocalLength}mm` : undefined);
  pushField('EXIF', 'Flash', parsed.Flash);
  pushField('EXIF', 'White Balance', parsed.WhiteBalance);
  pushField('EXIF', 'Orientation', parsed.Orientation);
  if (parsed.latitude && parsed.longitude) {
    pushField('EXIF', 'GPS Location', `${parsed.latitude.toFixed(5)}, ${parsed.longitude.toFixed(5)}`);
  }
  pushField('ICC', 'Color Profile', parsed.ProfileDescription ?? parsed.ColorSpaceData);
  pushField('IPTC', 'Caption', parsed.caption ?? parsed.Caption);
  pushField('IPTC', 'Credit', parsed.credit ?? parsed.Credit);
  pushField('IPTC', 'Source', parsed.source ?? parsed.Source);
  pushField('XMP', 'Creator Tool', parsed.CreatorTool);
  pushField('XMP', 'Rights', parsed.Rights ?? parsed.rights);

  const hasExif = Boolean(parsed.Make || parsed.Model || parsed.Software || parsed.ExposureTime || parsed.DateTimeOriginal);
  const hasXmp = Boolean(parsed.CreatorTool || parsed.Rights || fields.some((f) => f.category === 'XMP'));
  const hasIptc = Boolean(parsed.caption || parsed.Caption || parsed.credit || parsed.Credit || parsed.source);
  const hasIcc = Boolean(parsed.ProfileDescription || parsed.ColorSpaceData);

  const extra = await buildAiSignalsAndFields(format, bytes);
  const software: string | null = parsed.Software ? String(parsed.Software) : null;
  const aiSignals = [...extra.aiSignals];
  if (software) {
    for (const tool of detectAiToolMentions(software)) {
      aiSignals.unshift(`EXIF Software tag identifies "${software}" (matches known AI generator: ${tool})`);
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
    aiSignals: Array.from(new Set(aiSignals)),
    totalMetadataBytes: extra.totalMetadataBytes,
  };
}
