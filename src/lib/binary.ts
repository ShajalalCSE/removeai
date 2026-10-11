// Low-level byte utilities shared by the JPEG/PNG/WebP parsers and the TIFF/EXIF writer.
// No Node.js APIs are used anywhere here - everything operates on ArrayBuffer/Uint8Array
// so it runs identically in the browser main thread and inside a Web Worker.

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

export function asciiToBytes(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) bytes[i] = str.charCodeAt(i) & 0xff;
  return bytes;
}

export function bytesToAscii(bytes: Uint8Array, start = 0, end = bytes.length): string {
  let s = '';
  for (let i = start; i < end; i++) s += String.fromCharCode(bytes[i]);
  return s;
}

/** Null-terminated / padded ASCII string, trimmed of trailing NULs and whitespace. */
export function readCString(bytes: Uint8Array, start: number, maxLen: number): string {
  let end = start;
  const limit = Math.min(start + maxLen, bytes.length);
  while (end < limit && bytes[end] !== 0) end++;
  return bytesToAscii(bytes, start, end).trim();
}

export function writeCString(str: string): Uint8Array {
  const clean = str.replace(/\0/g, '');
  const out = new Uint8Array(clean.length + 1);
  out.set(asciiToBytes(clean), 0);
  out[clean.length] = 0;
  return out;
}

export function u16be(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

export function writeU16be(value: number): Uint8Array {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

export function u32be(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]
  ) >>> 0;
}

export function writeU32be(value: number): Uint8Array {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

export function u32le(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)
  ) >>> 0;
}

export function writeU32le(value: number): Uint8Array {
  return new Uint8Array([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ]);
}

export function u16le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

export function writeU16le(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

let crcTable: Int32Array | null = null;
function getCrcTable(): Int32Array {
  if (crcTable) return crcTable;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  crcTable = table;
  return table;
}

/** Standard CRC-32 (used by PNG chunks). */
export function crc32(bytes: Uint8Array): number {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = table[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function bufToUint8(buf: ArrayBuffer | Uint8Array): Uint8Array {
  return buf instanceof Uint8Array ? buf : new Uint8Array(buf);
}

/** TypeScript's DOM lib types Blob's constructor as wanting an ArrayBuffer-backed view
 * specifically, while our helpers above are typed with the broader ArrayBufferLike -
 * this narrows at the one place it matters instead of threading a generic through
 * every binary utility in this file. */
export function toBlob(bytes: Uint8Array, type: string): Blob {
  return new Blob([bytes as Uint8Array<ArrayBuffer>], { type });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
