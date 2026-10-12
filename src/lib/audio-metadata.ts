// MP3 ID3 tag read/remove.
//
// ID3v2 lives entirely in a header block at the very START of the file
// (3-byte "ID3" + version + flags + a 4-byte synchsafe size), and ID3v1 is a
// fixed 128-byte block at the very END of the file starting with "TAG".
// Critically, removal is just a prefix/suffix cut - audio frame data in the
// middle is never touched, so this carries far less risk than the image
// EXIF work elsewhere in this app (no offsets inside the payload to
// recalculate, nothing to re-encode).
//
// Frame-level parsing (for the viewer) handles ID3v2.3 and v2.4, the two
// versions in practically universal use; v2.2's 3-byte frame IDs are not
// supported. Unrecognized or malformed frames are skipped defensively
// rather than guessed at, same philosophy as the C2PA/JUMBF parser.

import { bytesToAscii, bufToUint8 } from './binary';

export interface AudioField {
  label: string;
  value: string;
}

export interface AudioMetadataReport {
  isMp3: boolean;
  hasId3v2: boolean;
  hasId3v1: boolean;
  id3v2Size: number;
  fields: AudioField[];
}

const FRAME_LABELS: Record<string, string> = {
  TIT2: 'Title',
  TPE1: 'Artist',
  TPE2: 'Album Artist',
  TALB: 'Album',
  TYER: 'Year',
  TDRC: 'Recording Time',
  TCON: 'Genre',
  TRCK: 'Track',
  TPOS: 'Disc',
  TCOP: 'Copyright',
  TENC: 'Encoded By',
  TPUB: 'Publisher',
  TCOM: 'Composer',
  COMM: 'Comment',
};

function isMp3File(bytes: Uint8Array): boolean {
  // Either an ID3v2 header, or a bare MPEG audio frame sync (11 set bits: 0xFFEx-0xFFFx).
  if (bytes.length >= 3 && bytesToAscii(bytes, 0, 3) === 'ID3') return true;
  for (let i = 0; i < Math.min(bytes.length - 1, 4096); i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) return true;
  }
  return false;
}

function readSynchsafe(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] & 0x7f) << 21) | ((bytes[offset + 1] & 0x7f) << 14) | ((bytes[offset + 2] & 0x7f) << 7) | (bytes[offset + 3] & 0x7f);
}

interface Id3v2Header {
  majorVersion: number;
  flags: number;
  bodySize: number; // size of the tag body, excluding the 10-byte header (and any footer)
  totalSize: number; // full size of the tag including header (and footer, if present)
}

function readId3v2Header(bytes: Uint8Array): Id3v2Header | null {
  if (bytes.length < 10 || bytesToAscii(bytes, 0, 3) !== 'ID3') return null;
  const majorVersion = bytes[3];
  const flags = bytes[5];
  const bodySize = readSynchsafe(bytes, 6);
  const hasFooter = (flags & 0x10) !== 0;
  const totalSize = 10 + bodySize + (hasFooter ? 10 : 0);
  if (totalSize > bytes.length || bodySize < 0) return null;
  return { majorVersion, flags, bodySize, totalSize };
}

function decodeByEncoding(encodingByte: number, body: Uint8Array): string {
  try {
    if (encodingByte === 1) {
      // UTF-16 with BOM
      const be = body[0] === 0xfe && body[1] === 0xff;
      const decoder = new TextDecoder(be ? 'utf-16be' : 'utf-16le');
      return decoder.decode(body.slice(2)).replace(/\0+$/, '');
    }
    if (encodingByte === 2) {
      return new TextDecoder('utf-16be').decode(body).replace(/\0+$/, '');
    }
    if (encodingByte === 3) {
      return new TextDecoder('utf-8').decode(body).replace(/\0+$/, '');
    }
    return new TextDecoder('windows-1252').decode(body).replace(/\0+$/, '');
  } catch {
    return bytesToAscii(body).replace(/\0+$/, '');
  }
}

/** Standard text frame layout: 1-byte encoding indicator, then the encoded text. */
function decodeFrameText(bytes: Uint8Array, start: number, end: number): string {
  if (start >= end) return '';
  return decodeByEncoding(bytes[start], bytes.slice(start + 1, end));
}

function parseId3v2Frames(bytes: Uint8Array, header: Id3v2Header): AudioField[] {
  const fields: AudioField[] = [];
  let offset = 10;
  const bodyEnd = 10 + header.bodySize;
  const sizeIsSynchsafe = header.majorVersion >= 4;
  let guard = 0;

  while (offset + 10 <= bodyEnd && guard < 200) {
    guard++;
    const idBytes = bytes.slice(offset, offset + 4);
    if (idBytes[0] === 0) break; // padding reached
    const id = bytesToAscii(idBytes);
    if (!/^[A-Z0-9]{4}$/.test(id)) break; // not a well-formed frame id, stop rather than guess

    const sizeBytes = bytes.slice(offset + 4, offset + 8);
    const size = sizeIsSynchsafe
      ? readSynchsafe(bytes, offset + 4)
      : (sizeBytes[0] << 24) | (sizeBytes[1] << 16) | (sizeBytes[2] << 8) | sizeBytes[3];
    const frameStart = offset + 10;
    const frameEnd = frameStart + size;
    if (size < 0 || frameEnd > bodyEnd) break;

    const label = FRAME_LABELS[id];
    if (label) {
      let value: string;
      if (id === 'COMM') {
        // Layout: encoding(1) + language(3) + short description + NUL + actual comment text.
        const encodingByte = bytes[frameStart];
        const bodyStart = frameStart + 4; // skip encoding + 3-byte language code
        const decoded = decodeByEncoding(encodingByte, bytes.slice(bodyStart, frameEnd));
        const nulIndex = decoded.indexOf('\0');
        value = nulIndex >= 0 ? decoded.slice(nulIndex + 1) : decoded;
      } else {
        value = decodeFrameText(bytes, frameStart, frameEnd);
      }
      if (value.trim()) fields.push({ label, value: value.trim() });
    }

    offset = frameEnd;
  }

  return fields;
}

function hasId3v1(bytes: Uint8Array): boolean {
  return bytes.length >= 128 && bytesToAscii(bytes, bytes.length - 128, bytes.length - 125) === 'TAG';
}

function parseId3v1(bytes: Uint8Array): AudioField[] {
  const start = bytes.length - 128;
  const field = (offset: number, length: number, label: string) => {
    const text = bytesToAscii(bytes, start + offset, start + offset + length).replace(/\0+$/, '').trim();
    return text ? { label, value: text } : null;
  };
  return [field(3, 30, 'Title'), field(33, 30, 'Artist'), field(63, 30, 'Album'), field(93, 4, 'Year')].filter(
    (f): f is AudioField => f !== null,
  );
}

export async function readAudioMetadata(file: File): Promise<AudioMetadataReport> {
  const bytes = bufToUint8(await file.arrayBuffer());
  if (!isMp3File(bytes)) {
    throw new Error('এটি একটি সঠিক বা সাপোর্টেড MP3 ফাইল না।');
  }

  const id3v2Header = readId3v2Header(bytes);
  const fields: AudioField[] = [];
  if (id3v2Header) fields.push(...parseId3v2Frames(bytes, id3v2Header));

  const id3v1Present = hasId3v1(bytes);
  if (id3v1Present) {
    for (const f of parseId3v1(bytes)) {
      if (!fields.some((existing) => existing.label === f.label)) fields.push(f);
    }
  }

  return {
    isMp3: true,
    hasId3v2: !!id3v2Header,
    hasId3v1: id3v1Present,
    id3v2Size: id3v2Header?.totalSize ?? 0,
    fields,
  };
}

export interface AudioRemovalResult {
  blob: Blob;
  removed: string[];
  bytesBefore: number;
  bytesAfter: number;
  verification: AudioMetadataReport;
}

export async function removeAudioMetadata(file: File): Promise<AudioRemovalResult> {
  const bytes = bufToUint8(await file.arrayBuffer());
  if (!isMp3File(bytes)) {
    throw new Error('এটি একটি সঠিক বা সাপোর্টেড MP3 ফাইল না।');
  }

  const removed: string[] = [];
  let start = 0;
  let end = bytes.length;

  const header = readId3v2Header(bytes);
  if (header) {
    start = header.totalSize;
    removed.push('ID3v2 ট্যাগ');
  }
  if (hasId3v1(bytes)) {
    end = bytes.length - 128;
    removed.push('ID3v1 ট্যাগ');
  }

  const outBytes = bytes.slice(start, end);
  const blob = new Blob([outBytes as unknown as BlobPart], { type: 'audio/mpeg' });
  const verification = await readAudioMetadata(new File([blob], file.name, { type: 'audio/mpeg' }));

  return { blob, removed, bytesBefore: bytes.length, bytesAfter: outBytes.length, verification };
}
