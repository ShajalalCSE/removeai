// JPEG (JFIF) segment-level parser and metadata stripper.
//
// JPEG files are a sequence of markers (0xFF, marker-code) most of which are
// followed by a 2-byte big-endian length (that length includes the 2 length
// bytes themselves). We walk markers from the SOI and, for every APPn/COM
// marker, decide whether to keep or drop it. Everything from SOS onward
// (the entropy-coded scan data) is copied byte-for-byte, untouched - so pixel
// data is never recompressed and the result is bit-identical to the source
// except for the metadata segments we remove.

import { asciiToBytes, bytesToAscii, concatBytes, u16be, writeU16be } from './binary';
import { neutralizeIfd0Tag, parseTiff, TAG_GPS_IFD_POINTER, TAG_SOFTWARE } from './tiff';

export interface JpegSegment {
  marker: number; // e.g. 0xE1 for APP1
  offset: number; // offset of the 0xFF marker byte in the source buffer
  length: number; // total segment length including the 2 marker bytes + length field (0 for markers with no payload)
  dataStart: number; // offset of the payload (after the 2-byte length), or offset+2 for payload-less markers
  dataLength: number; // payload length (length - 2), 0 for payload-less markers
}

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const COM = 0xfe;

function isStandaloneMarker(marker: number): boolean {
  // TEM, RST0-RST7, SOI/EOI have no length field / payload.
  return marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9);
}

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 2 && bytes[0] === 0xff && bytes[1] === SOI;
}

/** Walk all marker segments up to (and including) SOS. Throws if the buffer isn't a well-formed JPEG. */
export function parseJpegSegments(bytes: Uint8Array): { segments: JpegSegment[]; scanDataStart: number } {
  if (!isJpeg(bytes)) throw new Error('একটি সঠিক JPEG ফাইল না (SOI মার্কার নেই)।');
  const segments: JpegSegment[] = [];
  let offset = 2; // past SOI

  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xff) {
      throw new Error('ত্রুটিপূর্ণ JPEG: মার্কার বাইট 0xFF প্রত্যাশিত ছিল।');
    }
    const marker = bytes[offset + 1];

    if (marker === EOI) {
      segments.push({ marker, offset, length: 2, dataStart: offset + 2, dataLength: 0 });
      offset += 2;
      break;
    }

    if (isStandaloneMarker(marker)) {
      segments.push({ marker, offset, length: 2, dataStart: offset + 2, dataLength: 0 });
      offset += 2;
      continue;
    }

    const length = u16be(bytes, offset + 2);
    const dataStart = offset + 4;
    const dataLength = length - 2;
    segments.push({ marker, offset, length: length + 2, dataStart, dataLength });

    if (marker === SOS) {
      // Everything after this point is entropy-coded scan data (+ any trailing
      // markers/EOI). We stop structural parsing here and treat the remainder
      // as an opaque block to preserve image data bit-for-bit.
      return { segments, scanDataStart: dataStart + dataLength };
    }

    offset = dataStart + dataLength;
  }

  throw new Error('ত্রুটিপূর্ণ JPEG: SOS (start of scan) মার্কার পাওয়া যায়নি।');
}

export const APP1_EXIF_SIGNATURE = 'Exif\0\0';
export const APP1_XMP_SIGNATURE = 'http://ns.adobe.com/xap/1.0/\0';

export type JpegSegmentKind =
  | 'exif'
  | 'xmp'
  | 'iptc' // Photoshop IRB (APP13), commonly carries IPTC
  | 'icc' // APP2 ICC_PROFILE
  | 'c2pa' // APP11 JUMBF (Content Credentials)
  | 'adobe' // APP14 "Adobe" (color transform info, not personal metadata)
  | 'jfif' // APP0
  | 'comment'
  | 'other-app';

export function classifySegment(bytes: Uint8Array, seg: JpegSegment): JpegSegmentKind {
  if (seg.marker === COM) return 'comment';
  if (seg.marker === 0xe0) return 'jfif';
  if (seg.marker === 0xe2) return 'icc'; // ICC_PROFILE
  if (seg.marker === 0xee) return 'adobe'; // APP14
  if (seg.marker === 0xeb) return 'c2pa'; // APP11 JUMBF/C2PA
  if (seg.marker === 0xe1) {
    const sig = bytesToAscii(bytes, seg.dataStart, Math.min(seg.dataStart + 29, seg.dataStart + seg.dataLength));
    if (sig.startsWith('Exif')) return 'exif';
    if (sig.startsWith('http://ns.adobe.com/xap')) return 'xmp';
    return 'other-app';
  }
  if (seg.marker === 0xed) return 'iptc'; // Photoshop 3.0 IRB
  return 'other-app';
}

export interface JpegStripOptions {
  mode: 'ai' | 'all';
}

export interface JpegStripResult {
  bytes: Uint8Array;
  removed: JpegSegmentKind[];
  kept: JpegSegmentKind[];
}

/** AI-oriented removal keeps non-metadata structural segments and camera EXIF, but strips
 * the segments that most commonly carry AI-generation claims or tool fingerprints:
 * XMP (C2PA/Content Credentials claims live here), the APP11 JUMBF/C2PA manifest itself,
 * the Photoshop IRB/IPTC block, and the EXIF Software tag specifically (camera EXIF is kept). */
export function stripJpegMetadata(bytes: Uint8Array, options: JpegStripOptions): JpegStripResult {
  const { segments, scanDataStart } = parseJpegSegments(bytes);
  const out: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];

  const removed: JpegSegmentKind[] = [];
  const kept: JpegSegmentKind[] = [];

  for (const seg of segments) {
    if (seg.marker === SOS) break; // stop before scan data; appended separately below
    if (isStandaloneMarker(seg.marker)) {
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      continue;
    }

    const isMetadataMarker = seg.marker === COM || (seg.marker >= 0xe0 && seg.marker <= 0xef);
    if (!isMetadataMarker) {
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      continue;
    }

    const kind = classifySegment(bytes, seg);

    if (options.mode === 'all') {
      removed.push(kind);
      continue; // drop every APPn/COM segment
    }

    // mode === 'ai'
    if (kind === 'xmp' || kind === 'c2pa' || kind === 'iptc' || kind === 'comment') {
      removed.push(kind);
      continue;
    }

    if (kind === 'exif') {
      const stripped = stripSoftwareTagFromExifSegment(bytes, seg);
      if (stripped) {
        out.push(stripped);
        kept.push('exif');
        continue;
      }
    }

    // icc, jfif, adobe, other-app, or exif-without-software: keep as-is
    out.push(bytes.slice(seg.offset, seg.offset + seg.length));
    kept.push(kind);
  }

  // Re-emit SOS and copy everything from there to EOF verbatim (scan data, EOI, etc).
  const sosSegment = segments.find((s) => s.marker === SOS);
  if (sosSegment) {
    out.push(bytes.slice(sosSegment.offset, sosSegment.dataStart + sosSegment.dataLength));
  }
  out.push(bytes.slice(scanDataStart));

  return { bytes: concatBytes(out), removed, kept };
}

/** Rewrites an APP1 Exif segment with the IFD0 Software tag (0x0131) removed, keeping all other tags intact. */
function stripSoftwareTagFromExifSegment(bytes: Uint8Array, seg: JpegSegment): Uint8Array | null {
  const sigEnd = seg.dataStart + 6; // "Exif\0\0"
  const tiffBytes = bytes.slice(sigEnd, seg.dataStart + seg.dataLength);

  const parsed = parseTiff(tiffBytes);
  if (!parsed) return null;
  const hasSoftware = parsed.ifd0.some((e) => e.tag === TAG_SOFTWARE);
  if (!hasSoftware) return null; // nothing to strip, caller keeps the original bytes

  // Rebuilding a fully general TIFF editor-in-place is unnecessary here: we only
  // ever need to drop one small ASCII tag, so we rewrite the tag id to a harmless
  // unused value (0xFFFE, "unassigned") rather than re-laying out the whole IFD.
  // Readers skip unknown tags silently, and the (now orphaned) value bytes are
  // never referenced again.
  const patched = new Uint8Array(tiffBytes);
  const view = new DataView(patched.buffer, patched.byteOffset, patched.byteLength);
  const littleEndian = parsed.littleEndian;
  const ifd0Offset = view.getUint32(4, littleEndian);
  const count = view.getUint16(ifd0Offset, littleEndian);
  for (let i = 0; i < count; i++) {
    const entryOffset = ifd0Offset + 2 + i * 12;
    const tag = view.getUint16(entryOffset, littleEndian);
    if (tag === TAG_SOFTWARE) {
      view.setUint16(entryOffset, 0xfffe, littleEndian); // mark unassigned; value bytes become inert padding
    }
  }

  const newSegDataLength = 6 + patched.length;
  const header = new Uint8Array(4);
  header[0] = 0xff;
  header[1] = seg.marker;
  header.set(writeU16be(newSegDataLength + 2), 2);
  return concatBytes([header, asciiToBytes(APP1_EXIF_SIGNATURE), patched]);
}

/** Inserts/replaces the APP1 Exif segment of a JPEG with a new TIFF payload (used by the EXIF editor). */
export function writeJpegExif(bytes: Uint8Array, tiff: Uint8Array): Uint8Array {
  const { segments, scanDataStart } = parseJpegSegments(bytes);
  const out: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  let inserted = false;

  const exifPayload = concatBytes([asciiToBytes(APP1_EXIF_SIGNATURE), tiff]);
  const exifHeader = new Uint8Array(4);
  exifHeader[0] = 0xff;
  exifHeader[1] = 0xe1;
  exifHeader.set(writeU16be(exifPayload.length + 2), 2);
  const exifSegment = concatBytes([exifHeader, exifPayload]);

  for (const seg of segments) {
    if (seg.marker === SOS) break;
    if (isStandaloneMarker(seg.marker)) {
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      continue;
    }
    const isMetadataMarker = seg.marker === COM || (seg.marker >= 0xe0 && seg.marker <= 0xef);
    if (!isMetadataMarker) {
      // First non-metadata marker: insert EXIF right before it if not already inserted,
      // matching where JFIF/EXIF segments conventionally live (right after SOI).
      if (!inserted) {
        out.push(exifSegment);
        inserted = true;
      }
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      continue;
    }
    const kind = classifySegment(bytes, seg);
    if (kind === 'exif') {
      if (!inserted) {
        out.push(exifSegment);
        inserted = true;
      }
      continue; // drop the old EXIF segment, replaced above
    }
    if (kind === 'jfif' && !inserted) {
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      out.push(exifSegment);
      inserted = true;
      continue;
    }
    out.push(bytes.slice(seg.offset, seg.offset + seg.length));
  }

  if (!inserted) out.push(exifSegment);

  const sosSegment = segments.find((s) => s.marker === SOS);
  if (sosSegment) {
    out.push(bytes.slice(sosSegment.offset, sosSegment.dataStart + sosSegment.dataLength));
  }
  out.push(bytes.slice(scanDataStart));

  return concatBytes(out);
}

export interface GpsStripResult {
  bytes: Uint8Array;
  hadGps: boolean;
}

/** Removes only the GPS IFD pointer from the EXIF segment (if present), keeping every
 * other EXIF tag, XMP, ICC, etc. untouched. For a JPEG with no EXIF segment at all,
 * returns the input unchanged with hadGps: false. */
export function stripJpegGps(bytes: Uint8Array): GpsStripResult {
  const { segments, scanDataStart } = parseJpegSegments(bytes);
  const out: Uint8Array[] = [new Uint8Array([0xff, 0xd8])];
  let hadGps = false;

  for (const seg of segments) {
    if (seg.marker === SOS) break;
    if (isStandaloneMarker(seg.marker)) {
      out.push(bytes.slice(seg.offset, seg.offset + seg.length));
      continue;
    }
    const isMetadataMarker = seg.marker === COM || (seg.marker >= 0xe0 && seg.marker <= 0xef);
    if (isMetadataMarker && classifySegment(bytes, seg) === 'exif') {
      const sigEnd = seg.dataStart + 6; // "Exif\0\0"
      const tiffBytes = bytes.slice(sigEnd, seg.dataStart + seg.dataLength);
      const patchedTiff = neutralizeIfd0Tag(tiffBytes, TAG_GPS_IFD_POINTER);
      if (patchedTiff) {
        hadGps = true;
        const newSegDataLength = 6 + patchedTiff.length;
        const header = new Uint8Array(4);
        header[0] = 0xff;
        header[1] = seg.marker;
        header.set(writeU16be(newSegDataLength + 2), 2);
        out.push(concatBytes([header, asciiToBytes(APP1_EXIF_SIGNATURE), patchedTiff]));
        continue;
      }
    }
    out.push(bytes.slice(seg.offset, seg.offset + seg.length));
  }

  const sosSegment = segments.find((s) => s.marker === SOS);
  if (sosSegment) {
    out.push(bytes.slice(sosSegment.offset, sosSegment.dataStart + sosSegment.dataLength));
  }
  out.push(bytes.slice(scanDataStart));

  return { bytes: concatBytes(out), hadGps };
}
