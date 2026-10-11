// WebP (RIFF container) parser and metadata stripper.
//
// A WebP file is "RIFF" + u32le size + "WEBP" + a sequence of chunks:
// 4-byte ASCII tag, u32le data length, data (padded to an even length with a
// single 0x00 byte if the length is odd). We only ever add/remove the EXIF,
// XMP and ICCP metadata chunks and patch the VP8X feature-flags byte -
// the VP8/VP8L/ALPH/ANIM image-data chunks are always copied through untouched.

import { bufToUint8, bytesToAscii, concatBytes, u32le, writeU32le } from './binary';
import { neutralizeIfd0Tag, TAG_GPS_IFD_POINTER } from './tiff';

export interface WebpChunk {
  tag: string;
  offset: number; // offset of the 4-byte tag
  dataLength: number;
  dataStart: number;
  paddedLength: number; // dataLength rounded up to even
  totalLength: number; // 8 + paddedLength
}

export function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length > 12 &&
    bytesToAscii(bytes, 0, 4) === 'RIFF' &&
    bytesToAscii(bytes, 8, 12) === 'WEBP'
  );
}

export function parseWebpChunks(bytes: Uint8Array): WebpChunk[] {
  if (!isWebp(bytes)) throw new Error('একটি সঠিক WebP ফাইল না (ভুল RIFF/WEBP হেডার)।');
  const chunks: WebpChunk[] = [];
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const tag = bytesToAscii(bytes, offset, offset + 4);
    const dataLength = u32le(bytes, offset + 4);
    const dataStart = offset + 8;
    const paddedLength = dataLength % 2 === 0 ? dataLength : dataLength + 1;
    chunks.push({ tag, offset, dataLength, dataStart, paddedLength, totalLength: 8 + paddedLength });
    offset = dataStart + paddedLength;
  }
  return chunks;
}

const VP8X_ICC_BIT = 0x20;
const VP8X_ALPHA_BIT = 0x10;
const VP8X_EXIF_BIT = 0x08;
const VP8X_XMP_BIT = 0x04;
const VP8X_ANIM_BIT = 0x02;

export interface WebpScanEntry {
  tag: string;
  byteLength: number;
}

export function scanWebpMetadata(bytes: Uint8Array): WebpScanEntry[] {
  return parseWebpChunks(bytes)
    .filter((c) => c.tag === 'EXIF' || c.tag === 'XMP ' || c.tag === 'ICCP' || c.tag === 'C2PA')
    .map((c) => ({ tag: c.tag.trim(), byteLength: c.totalLength }));
}

export interface WebpStripOptions {
  mode: 'ai' | 'all';
}

export interface WebpStripResult {
  bytes: Uint8Array;
  removed: string[];
  kept: string[];
}

function buildRiffContainer(chunks: Uint8Array[]): Uint8Array {
  const body = concatBytes(chunks);
  const size = writeU32le(4 + body.length); // "WEBP" + chunks, per RIFF size semantics
  return concatBytes([new TextEncoder().encode('RIFF'), size, new TextEncoder().encode('WEBP'), body]);
}

function patchVp8xFlags(dataView: DataView, clearBits: number) {
  const flags = dataView.getUint8(0);
  dataView.setUint8(0, flags & ~clearBits);
}

export function stripWebpMetadata(bytes: Uint8Array, options: WebpStripOptions): WebpStripResult {
  const chunks = parseWebpChunks(bytes);
  const removed: string[] = [];
  const kept: string[] = [];
  const outChunks: Uint8Array[] = [];

  for (const chunk of chunks) {
    const raw = bytes.slice(chunk.offset, chunk.offset + chunk.totalLength);

    if (chunk.tag === 'EXIF' || chunk.tag === 'XMP ' || chunk.tag === 'C2PA') {
      removed.push(chunk.tag.trim());
      continue;
    }
    if (chunk.tag === 'ICCP' && options.mode === 'all') {
      removed.push('ICCP');
      continue;
    }
    if (chunk.tag === 'VP8X') {
      const patched = new Uint8Array(raw);
      let clearBits = VP8X_EXIF_BIT | VP8X_XMP_BIT;
      if (options.mode === 'all') clearBits |= VP8X_ICC_BIT;
      patchVp8xFlags(new DataView(patched.buffer, 8, 10), clearBits); // flags byte is first byte of VP8X data (offset 8 in chunk)
      outChunks.push(patched);
      kept.push('VP8X');
      continue;
    }

    outChunks.push(raw);
    kept.push(chunk.tag.trim());
  }

  return { bytes: buildRiffContainer(outChunks), removed, kept };
}

/** Builds a minimal VP8X chunk (10-byte payload) from canvas dimensions and feature flags. */
function buildVp8xChunk(width: number, height: number, flags: number): Uint8Array {
  const data = new Uint8Array(10);
  data[0] = flags;
  // bytes 1-3 reserved (0), then width-1 (24-bit LE), height-1 (24-bit LE)
  const w = Math.max(0, width - 1);
  const h = Math.max(0, height - 1);
  data[4] = w & 0xff;
  data[5] = (w >> 8) & 0xff;
  data[6] = (w >> 16) & 0xff;
  data[7] = h & 0xff;
  data[8] = (h >> 8) & 0xff;
  data[9] = (h >> 16) & 0xff;
  return buildChunk('VP8X', data);
}

function buildChunk(tag: string, data: Uint8Array): Uint8Array {
  const tagBytes = new TextEncoder().encode(tag.padEnd(4).slice(0, 4));
  const length = writeU32le(data.length);
  const padded = data.length % 2 === 0 ? data : concatBytes([data, new Uint8Array([0])]);
  return concatBytes([tagBytes, length, padded]);
}

export interface WebpDimensions {
  width: number;
  height: number;
}

/** Inserts/replaces the EXIF chunk with raw TIFF bytes, creating or patching VP8X as needed. */
export function writeWebpExif(bytes: Uint8Array, tiff: Uint8Array, dimensions: WebpDimensions): Uint8Array {
  const chunks = parseWebpChunks(bytes);
  const exifChunk = buildChunk('EXIF', bufToUint8(tiff));

  const outChunks: Uint8Array[] = [];
  let vp8xHandled = false;
  let hasAlpha = chunks.some((c) => c.tag === 'ALPH');

  for (const chunk of chunks) {
    if (chunk.tag === 'EXIF') continue; // dropped, replaced below
    const raw = bytes.slice(chunk.offset, chunk.offset + chunk.totalLength);

    if (chunk.tag === 'VP8X') {
      const patched = new Uint8Array(raw);
      const flagsView = new DataView(patched.buffer, 8, 1);
      flagsView.setUint8(0, flagsView.getUint8(0) | VP8X_EXIF_BIT);
      outChunks.push(patched);
      vp8xHandled = true;
      continue;
    }

    outChunks.push(raw);
  }

  if (!vp8xHandled) {
    let flags = VP8X_EXIF_BIT;
    if (hasAlpha) flags |= VP8X_ALPHA_BIT;
    const vp8x = buildVp8xChunk(dimensions.width, dimensions.height, flags);
    outChunks.unshift(vp8x); // VP8X must be the first chunk after the WEBP header
  }

  // EXIF must come after image-data chunks and before XMP, per the container spec.
  const xmpIndex = outChunks.findIndex((c) => bytesToAscii(c, 0, 4) === 'XMP ');
  if (xmpIndex === -1) {
    outChunks.push(exifChunk);
  } else {
    outChunks.splice(xmpIndex, 0, exifChunk);
  }

  return buildRiffContainer(outChunks);
}

export interface GpsStripResult {
  bytes: Uint8Array;
  hadGps: boolean;
}

/** Removes only the GPS IFD pointer from the EXIF chunk (if present), keeping every other chunk untouched. */
export function stripWebpGps(bytes: Uint8Array): GpsStripResult {
  const chunks = parseWebpChunks(bytes);
  const outChunks: Uint8Array[] = [];
  let hadGps = false;

  for (const chunk of chunks) {
    if (chunk.tag === 'EXIF') {
      const tiffBytes = bytes.slice(chunk.dataStart, chunk.dataStart + chunk.dataLength);
      const patched = neutralizeIfd0Tag(tiffBytes, TAG_GPS_IFD_POINTER);
      if (patched) {
        hadGps = true;
        outChunks.push(buildChunk('EXIF', patched));
        continue;
      }
    }
    outChunks.push(bytes.slice(chunk.offset, chunk.offset + chunk.totalLength));
  }

  return { bytes: buildRiffContainer(outChunks), hadGps };
}
