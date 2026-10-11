// A minimal, purpose-built TIFF/EXIF IFD reader and writer.
//
// This only implements the subset of the TIFF spec needed by the Camera EXIF Editor:
// reading/writing IFD0 (Make, Model, Software, Orientation, DateTime) and the Exif
// SubIFD (ExposureTime, FNumber, ISO, DateTimeOriginal, FocalLength, Flash,
// WhiteBalance, LensModel). It is used to build the raw TIFF payload that gets
// embedded in a JPEG APP1 "Exif" segment, a PNG eXIf chunk, or a WebP EXIF chunk -
// all three use the exact same binary TIFF structure, just wrapped differently.

import { asciiToBytes, bytesToAscii, concatBytes, readCString } from './binary';

export type TiffType = 1 | 2 | 3 | 4 | 5 | 10;
// 1 = BYTE, 2 = ASCII, 3 = SHORT, 4 = LONG, 5 = RATIONAL, 10 = SRATIONAL

export interface TiffTag {
  tag: number;
  type: TiffType;
  count: number;
  bytes: Uint8Array; // raw little-endian encoded value, NOT padded
}

const TYPE_SIZE: Record<TiffType, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  10: 8,
};

export function makeAsciiTag(tag: number, value: string): TiffTag {
  const withNull = `${value}\0`;
  return { tag, type: 2, count: withNull.length, bytes: asciiToBytes(withNull) };
}

export function makeShortTag(tag: number, value: number): TiffTag {
  const bytes = new Uint8Array(2);
  new DataView(bytes.buffer).setUint16(0, value, true);
  return { tag, type: 3, count: 1, bytes };
}

export function makeLongTag(tag: number, value: number): TiffTag {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value, true);
  return { tag, type: 4, count: 1, bytes };
}

export function makeRationalTag(tag: number, numerator: number, denominator: number, signed = false): TiffTag {
  const bytes = new Uint8Array(8);
  const view = new DataView(bytes.buffer);
  if (signed) {
    view.setInt32(0, numerator, true);
    view.setInt32(4, denominator, true);
  } else {
    view.setUint32(0, numerator, true);
    view.setUint32(4, denominator, true);
  }
  return { tag, type: signed ? 10 : 5, count: 1, bytes };
}

/** Encode a decimal number as a rational with a sensible denominator (for exposure/aperture/focal length). */
export function decimalToRational(value: number, precision = 1000): [number, number] {
  if (!isFinite(value) || value <= 0) return [0, 1];
  // Prefer small, human-meaningful denominators (e.g. 1/125s, f/1.8) when possible.
  if (Number.isInteger(value)) return [value, 1];
  const denominator = precision;
  return [Math.round(value * denominator), denominator];
}

function alignPad(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}

interface BuiltIfd {
  header: Uint8Array; // count(2) + entries(12 each) + nextIfdOffset(4)
  overflow: Uint8Array;
  overflowStart: number; // absolute offset where `overflow` begins, for patching
  entryOffsets: Map<number, number>; // tag -> absolute offset of its 12-byte entry (for patching the value field)
}

function buildIfd(tags: TiffTag[], ifdAbsoluteOffset: number): BuiltIfd {
  const sorted = [...tags].sort((a, b) => a.tag - b.tag);
  const entryCount = sorted.length;
  const headerSize = 2 + entryCount * 12 + 4;
  const overflowStart = ifdAbsoluteOffset + headerSize;

  const header = new Uint8Array(headerSize);
  const headerView = new DataView(header.buffer);
  headerView.setUint16(0, entryCount, true);

  const overflowChunks: Uint8Array[] = [];
  let overflowCursor = overflowStart;
  const entryOffsets = new Map<number, number>();

  sorted.forEach((t, i) => {
    const entryOffset = 2 + i * 12;
    entryOffsets.set(t.tag, ifdAbsoluteOffset + entryOffset);
    headerView.setUint16(entryOffset, t.tag, true);
    headerView.setUint16(entryOffset + 2, t.type, true);
    headerView.setUint32(entryOffset + 4, t.count, true);

    const valueSize = t.bytes.length;
    if (valueSize <= 4) {
      const padded = new Uint8Array(4);
      padded.set(t.bytes, 0);
      header.set(padded, entryOffset + 8);
    } else {
      headerView.setUint32(entryOffset + 8, overflowCursor, true);
      const padLen = alignPad(valueSize);
      const padded = new Uint8Array(padLen);
      padded.set(t.bytes, 0);
      overflowChunks.push(padded);
      overflowCursor += padLen;
    }
  });

  headerView.setUint32(headerSize - 4, 0, true); // next IFD offset = none

  return {
    header,
    overflow: concatBytes(overflowChunks),
    overflowStart,
    entryOffsets,
  };
}

/**
 * Build a full little-endian TIFF buffer with IFD0 and an optional Exif SubIFD.
 * If exifTags is provided, IFD0 automatically gets an ExifIFDPointer (0x8769) tag.
 */
export function buildTiff(ifd0Tags: TiffTag[], exifTags: TiffTag[] | null): Uint8Array {
  const HEADER_SIZE = 8;
  const tags0 = [...ifd0Tags];
  if (exifTags && exifTags.length > 0) {
    tags0.push(makeLongTag(0x8769, 0)); // placeholder, patched below
  }

  const ifd0 = buildIfd(tags0, HEADER_SIZE);
  let exifBuilt: BuiltIfd | null = null;
  if (exifTags && exifTags.length > 0) {
    const exifIfdOffset = ifd0.overflowStart + ifd0.overflow.length;
    exifBuilt = buildIfd(exifTags, exifIfdOffset);

    // Patch the ExifIFDPointer value we reserved in IFD0's header.
    const pointerEntryOffset = ifd0.entryOffsets.get(0x8769)!;
    const localOffset = pointerEntryOffset - HEADER_SIZE;
    new DataView(ifd0.header.buffer).setUint32(localOffset + 8, exifIfdOffset, true);
  }

  const tiffHeader = new Uint8Array(8);
  const hv = new DataView(tiffHeader.buffer);
  tiffHeader[0] = 0x49; // 'I'
  tiffHeader[1] = 0x49; // 'I' -> little-endian
  hv.setUint16(2, 42, true);
  hv.setUint32(4, HEADER_SIZE, true);

  const parts = [tiffHeader, ifd0.header, ifd0.overflow];
  if (exifBuilt) {
    parts.push(exifBuilt.header, exifBuilt.overflow);
  }
  return concatBytes(parts);
}

// ---- Reading ----

export interface ParsedTiffEntry {
  tag: number;
  type: number;
  count: number;
  valueOffset: number; // absolute offset (within the tiff buffer) of the value bytes
  inline: boolean;
}

export interface ParsedTiff {
  littleEndian: boolean;
  ifd0: ParsedTiffEntry[];
  exifIfd: ParsedTiffEntry[];
  bytes: Uint8Array;
}

function readIfdEntries(bytes: Uint8Array, ifdOffset: number, littleEndian: boolean): ParsedTiffEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(ifdOffset, littleEndian);
  const entries: ParsedTiffEntry[] = [];
  for (let i = 0; i < count; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    const type = view.getUint16(entryOffset + 2, littleEndian);
    const typeSize = TYPE_SIZE[type as TiffType] ?? 1;
    const dataCount = view.getUint32(entryOffset + 4, littleEndian);
    const totalSize = typeSize * dataCount;
    const inline = totalSize <= 4;
    const valueOffset = inline ? entryOffset + 8 : view.getUint32(entryOffset + 8, littleEndian);
    entries.push({ tag, type, count: dataCount, valueOffset, inline });
  }
  return entries;
}

/** Parse a raw TIFF buffer (the content of a JPEG Exif APP1 after "Exif\0\0", or a PNG eXIf / WebP EXIF chunk). */
export function parseTiff(bytes: Uint8Array): ParsedTiff | null {
  if (bytes.length < 8) return null;
  const byteOrder = bytesToAscii(bytes, 0, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const magic = view.getUint16(2, littleEndian);
  if (magic !== 42) return null;
  const ifd0Offset = view.getUint32(4, littleEndian);
  const ifd0 = readIfdEntries(bytes, ifd0Offset, littleEndian);

  let exifIfd: ParsedTiffEntry[] = [];
  const exifPointerEntry = ifd0.find((e) => e.tag === 0x8769);
  if (exifPointerEntry) {
    const exifOffset = littleEndian
      ? view.getUint32(exifPointerEntry.valueOffset, true)
      : view.getUint32(exifPointerEntry.valueOffset, false);
    if (exifOffset > 0 && exifOffset < bytes.length) {
      exifIfd = readIfdEntries(bytes, exifOffset, littleEndian);
    }
  }

  return { littleEndian, ifd0, exifIfd, bytes };
}

export function readEntryString(tiff: ParsedTiff, entry: ParsedTiffEntry): string {
  return readCString(tiff.bytes, entry.valueOffset, entry.count);
}

export function readEntryNumber(tiff: ParsedTiff, entry: ParsedTiffEntry): number {
  const view = new DataView(tiff.bytes.buffer, tiff.bytes.byteOffset, tiff.bytes.byteLength);
  switch (entry.type) {
    case 3:
      return view.getUint16(entry.valueOffset, tiff.littleEndian);
    case 4:
      return view.getUint32(entry.valueOffset, tiff.littleEndian);
    case 5: {
      const num = view.getUint32(entry.valueOffset, tiff.littleEndian);
      const den = view.getUint32(entry.valueOffset + 4, tiff.littleEndian);
      return den === 0 ? 0 : num / den;
    }
    default:
      return 0;
  }
}

export const TAG_SOFTWARE = 0x0131;
export const TAG_MAKE = 0x010f;
export const TAG_MODEL = 0x0110;
