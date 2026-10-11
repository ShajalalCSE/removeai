// PNG chunk-level parser and metadata stripper.
//
// PNG is a sequence of chunks: 4-byte big-endian length, 4-byte ASCII type,
// `length` bytes of data, 4-byte CRC32 (over type+data). We only ever touch
// ancillary metadata chunks (tEXt/zTXt/iTXt/eXIf/tIME and, for "remove all",
// the color-management chunks). IHDR/PLTE/IDAT/IEND/tRNS are never modified,
// so pixel data and transparency are always bit-identical to the source.

import { bufToUint8, bytesToAscii, concatBytes, crc32, u32be, writeU32be } from './binary';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export interface PngChunk {
  type: string;
  offset: number; // offset of the length field
  length: number; // data length
  dataStart: number;
  totalLength: number; // 12 + length
}

export function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < 8) return false;
  for (let i = 0; i < 8; i++) if (bytes[i] !== PNG_SIGNATURE[i]) return false;
  return true;
}

export function parsePngChunks(bytes: Uint8Array): PngChunk[] {
  if (!isPng(bytes)) throw new Error('Not a valid PNG file (bad signature).');
  const chunks: PngChunk[] = [];
  let offset = 8;
  while (offset + 8 <= bytes.length) {
    const length = u32be(bytes, offset);
    const type = bytesToAscii(bytes, offset + 4, offset + 8);
    const dataStart = offset + 8;
    const totalLength = 12 + length;
    chunks.push({ type, offset, length, dataStart, totalLength });
    if (type === 'IEND') break;
    offset += totalLength;
  }
  return chunks;
}

const METADATA_TEXT_TYPES = new Set(['tEXt', 'zTXt', 'iTXt']);
const COLOR_MANAGEMENT_TYPES = new Set(['iCCP', 'gAMA', 'cHRM', 'sRGB']);

export interface PngScanEntry {
  type: string;
  keyword?: string; // tEXt/zTXt/iTXt keyword, when readable without decompression
  byteLength: number;
}

export function scanPngMetadata(bytes: Uint8Array): PngScanEntry[] {
  const chunks = parsePngChunks(bytes);
  const entries: PngScanEntry[] = [];
  for (const chunk of chunks) {
    if (METADATA_TEXT_TYPES.has(chunk.type)) {
      let keyword: string | undefined;
      if (chunk.type === 'tEXt' || chunk.type === 'iTXt') {
        const nullIdx = bytes.indexOf(0, chunk.dataStart);
        if (nullIdx !== -1 && nullIdx < chunk.dataStart + chunk.length) {
          keyword = bytesToAscii(bytes, chunk.dataStart, nullIdx);
        }
      }
      entries.push({ type: chunk.type, keyword, byteLength: chunk.totalLength });
    } else if (chunk.type === 'eXIf' || chunk.type === 'tIME') {
      entries.push({ type: chunk.type, byteLength: chunk.totalLength });
    } else if (COLOR_MANAGEMENT_TYPES.has(chunk.type)) {
      entries.push({ type: chunk.type, byteLength: chunk.totalLength });
    }
  }
  return entries;
}

export interface PngStripOptions {
  mode: 'ai' | 'all';
}

export interface PngStripResult {
  bytes: Uint8Array;
  removed: string[];
  kept: string[];
}

export function stripPngMetadata(bytes: Uint8Array, options: PngStripOptions): PngStripResult {
  const chunks = parsePngChunks(bytes);
  const out: Uint8Array[] = [bytes.slice(0, 8)];
  const removed: string[] = [];
  const kept: string[] = [];

  for (const chunk of chunks) {
    const isTextLike = METADATA_TEXT_TYPES.has(chunk.type) || chunk.type === 'eXIf' || chunk.type === 'tIME';
    const isColorMgmt = COLOR_MANAGEMENT_TYPES.has(chunk.type);

    if (isTextLike) {
      removed.push(chunk.type);
      continue;
    }
    if (options.mode === 'all' && isColorMgmt) {
      removed.push(chunk.type);
      continue;
    }

    out.push(bytes.slice(chunk.offset, chunk.offset + chunk.totalLength));
    kept.push(chunk.type);
  }

  return { bytes: concatBytes(out), removed, kept };
}

function buildChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) typeBytes[i] = type.charCodeAt(i);
  const length = writeU32be(data.length);
  const crcInput = concatBytes([typeBytes, data]);
  const crc = writeU32be(crc32(crcInput));
  return concatBytes([length, typeBytes, data, crc]);
}

/** Inserts (or replaces) the eXIf chunk with raw TIFF bytes. Placed right after IHDR, per spec recommendation. */
export function writePngExif(bytes: Uint8Array, tiff: Uint8Array): Uint8Array {
  const chunks = parsePngChunks(bytes);
  const out: Uint8Array[] = [bytes.slice(0, 8)];
  const exifChunk = buildChunk('eXIf', bufToUint8(tiff));
  let inserted = false;

  for (const chunk of chunks) {
    if (chunk.type === 'eXIf') continue; // drop existing, replaced below
    out.push(bytes.slice(chunk.offset, chunk.offset + chunk.totalLength));
    if (chunk.type === 'IHDR' && !inserted) {
      out.push(exifChunk);
      inserted = true;
    }
  }

  if (!inserted) {
    // No IHDR found (shouldn't happen for a valid PNG) - append before IEND as a fallback.
    const iendIdx = out.length - 1;
    out.splice(iendIdx, 0, exifChunk);
  }

  return concatBytes(out);
}
