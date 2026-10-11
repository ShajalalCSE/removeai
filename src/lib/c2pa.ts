// A deliberately conservative C2PA/JUMBF inspector. This does NOT decode CBOR
// and does NOT perform cryptographic signature verification - doing either
// unreliably would risk showing users wrong provenance information, which is
// worse than not showing it. Instead it does two safe, bounded things:
//
//  1. Walks the JUMBF box structure (ISO/IEC 19566-5: 4-byte length + 4-byte
//     type, recursively for 'jumb' superboxes) to list which C2PA boxes are
//     physically present (claim, assertions, signature, etc) - this is a
//     well-defined binary TLV format, no ambiguity.
//  2. Scans the raw bytes for known AI-tool name substrings and IPTC
//     digitalSourceType URLs - the same proven technique already used
//     elsewhere in this app, since CBOR text strings are near-literal UTF-8
//     in the byte stream for short values.
//
// Box *labels* (e.g. "c2pa.assertions") are read from the 'jumd' description
// box using a bounds-checked heuristic (read a printable, NUL-terminated
// ASCII run after the 16-byte UUID + 1-byte toggle field) rather than fully
// decoding the toggle bitfield - if anything looks off, it just omits the
// label rather than guessing.

import { bytesToAscii, bufToUint8, concatBytes, u32be } from './binary';
import { classifySegment, parseJpegSegments } from './jpeg';
import { parsePngChunks } from './png';
import { parseWebpChunks } from './webp';
import { sniffFormat } from './format';
import { detectAiToolMentions } from './metadata-reader';

export interface JumbfBoxInfo {
  type: string;
  label: string | null;
  depth: number;
}

export interface C2paInfo {
  present: boolean;
  format: 'jpeg' | 'png' | 'webp' | null;
  byteLength: number;
  boxes: JumbfBoxInfo[];
  detectedTools: string[];
  digitalSourceType: string | null;
}

function readBoxHeader(bytes: Uint8Array, offset: number): { type: string; contentStart: number; boxEnd: number } | null {
  if (offset + 8 > bytes.length) return null;
  let lbox = u32be(bytes, offset);
  const type = bytesToAscii(bytes, offset + 4, offset + 8);
  let headerSize = 8;

  if (lbox === 1) {
    if (offset + 16 > bytes.length) return null;
    const hi = u32be(bytes, offset + 8);
    const lo = u32be(bytes, offset + 12);
    lbox = hi * 4294967296 + lo;
    headerSize = 16;
  } else if (lbox === 0) {
    lbox = bytes.length - offset;
  }

  if (!Number.isFinite(lbox) || lbox < headerSize || offset + lbox > bytes.length) return null;
  return { type, contentStart: offset + headerSize, boxEnd: offset + lbox };
}

function parseJumdLabel(bytes: Uint8Array, start: number, end: number): string | null {
  if (end - start < 17) return null; // 16-byte UUID + 1-byte toggle minimum
  const pos = start + 17;
  let labelEnd = pos;
  while (labelEnd < end && bytes[labelEnd] !== 0) {
    const c = bytes[labelEnd];
    if (c < 0x20 || c > 0x7e) return null; // non-printable -> not a label we can trust, bail safely
    labelEnd++;
  }
  if (labelEnd === pos || labelEnd >= end) return null;
  return bytesToAscii(bytes, pos, labelEnd);
}

export function parseJumbfBoxes(bytes: Uint8Array, maxBoxes = 500): JumbfBoxInfo[] {
  const out: JumbfBoxInfo[] = [];
  const walk = (start: number, end: number, depth: number) => {
    let offset = start;
    while (offset < end && out.length < maxBoxes) {
      const header = readBoxHeader(bytes, offset);
      if (!header) break;
      const { type, contentStart, boxEnd } = header;
      const label = type === 'jumd' ? parseJumdLabel(bytes, contentStart, boxEnd) : null;
      out.push({ type, label, depth });
      if (type === 'jumb') walk(contentStart, boxEnd, depth + 1);
      if (boxEnd <= offset) break; // guard against zero/negative progress on malformed input
      offset = boxEnd;
    }
  };
  walk(0, bytes.length, 0);
  return out;
}

const DIGITAL_SOURCE_TYPE_RE = /digitalsourcetype\/([a-zA-Z]+)/i;

function extractSignals(bytes: Uint8Array): { detectedTools: string[]; digitalSourceType: string | null } {
  const text = bytesToAscii(bytes);
  const detectedTools = detectAiToolMentions(text);
  const match = text.match(DIGITAL_SOURCE_TYPE_RE);
  return { detectedTools, digitalSourceType: match ? match[1] : null };
}

/**
 * Locates the raw C2PA/JUMBF bytes for a file, regardless of format container.
 *
 * JPEG is the odd one out: each APP11 segment that carries C2PA data is
 * prefixed with an 8-byte header (2-byte "JP" common identifier + 2-byte box
 * instance number + 4-byte big-endian packet sequence number) before the
 * actual JUMBF bytes, per the C2PA JPEG embedding spec - confirmed against
 * the reference contentauth/c2pa-rs implementation. A manifest too large for
 * one segment continues across further APP11 segments, each of which
 * repeats that 8-byte header AND a duplicated copy of the outer JUMBF box's
 * 8-byte length+type before its chunk of payload. PNG's `caBX` chunk and
 * WebP's `C2PA` RIFF chunk have no such prefix - their chunk data *is* the
 * raw JUMBF bytes directly.
 */
function extractC2paBytes(bytes: Uint8Array, format: 'jpeg' | 'png' | 'webp'): Uint8Array | null {
  if (format === 'jpeg') {
    const { segments } = parseJpegSegments(bytes);
    const c2paSegments = segments.filter((s) => classifySegment(bytes, s) === 'c2pa');
    if (c2paSegments.length === 0) return null;
    const parts: Uint8Array[] = [];
    c2paSegments.forEach((seg, i) => {
      const prefixLength = i === 0 ? 8 : 16; // CI+En+Z (8), plus a duplicated LBox+TBox (8 more) on continuation segments
      if (seg.dataLength <= prefixLength) return;
      parts.push(bytes.slice(seg.dataStart + prefixLength, seg.dataStart + seg.dataLength));
    });
    return parts.length > 0 ? concatBytes(parts) : null;
  }
  if (format === 'png') {
    const chunk = parsePngChunks(bytes).find((c) => c.type === 'caBX');
    return chunk ? bytes.slice(chunk.dataStart, chunk.dataStart + chunk.length) : null;
  }
  const chunk = parseWebpChunks(bytes).find((c) => c.tag === 'C2PA');
  return chunk ? bytes.slice(chunk.dataStart, chunk.dataStart + chunk.dataLength) : null;
}

export async function readC2paInfo(file: File): Promise<C2paInfo> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);
  const format = sniffFormat(bytes);
  if (!format) throw new Error('ফরম্যাট সাপোর্টেড না বা শনাক্ত করা যায়নি। শুধু JPEG, PNG ও WebP সাপোর্টেড।');

  const c2paBytes = extractC2paBytes(bytes, format);
  if (!c2paBytes) {
    return { present: false, format, byteLength: 0, boxes: [], detectedTools: [], digitalSourceType: null };
  }

  const boxes = parseJumbfBoxes(c2paBytes);
  const { detectedTools, digitalSourceType } = extractSignals(c2paBytes);

  return { present: true, format, byteLength: c2paBytes.length, boxes, detectedTools, digitalSourceType };
}
