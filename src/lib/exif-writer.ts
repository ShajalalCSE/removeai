// Camera EXIF Editor backend: turns the form values into a TIFF/EXIF block and
// embeds it using the same binary writers used elsewhere (JPEG APP1, PNG eXIf,
// WebP EXIF chunk). All three formats share one TIFF builder, so field support
// is identical across formats - the only things that can legitimately fail are
// malformed user input (e.g. "abc" typed into a numeric field), which are
// reported back as skipped fields with a reason rather than silently ignored.

import type { CameraExifFields, ExifWriteResult, ImageFormat } from '../types/metadata';
import { bufToUint8, toBlob } from './binary';
import { getImageDimensions, MIME_BY_FORMAT, sniffFormat } from './format';
import { writeJpegExif } from './jpeg';
import { readMetadata } from './metadata-reader';
import { writePngExif } from './png';
import { buildTiff, decimalToRational, makeAsciiTag, makeRationalTag, makeShortTag, TiffTag } from './tiff';
import { writeWebpExif } from './webp';

const TAG_ORIENTATION = 0x0112;
const TAG_DATETIME = 0x0132;
const TAG_SOFTWARE = 0x0131;
const TAG_MAKE = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_EXPOSURE_TIME = 0x829a;
const TAG_FNUMBER = 0x829d;
const TAG_ISO = 0x8827;
const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_FOCAL_LENGTH = 0x920a;
const TAG_FLASH = 0x9209;
const TAG_WHITE_BALANCE = 0xa403;
const TAG_LENS_MODEL = 0xa434;

function parseExposureTime(input: string): [number, number] | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.includes('/')) {
    const [n, d] = trimmed.split('/').map((s) => Number(s.trim()));
    if (!isFinite(n) || !isFinite(d) || d === 0) return null;
    return [n, d];
  }
  const v = Number(trimmed);
  if (!isFinite(v) || v <= 0) return null;
  return decimalToRational(v, v < 1 ? 1000000 : 1000);
}

function toExifDateTime(input: string): string | null {
  // Accepts "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss"; EXIF wants "YYYY:MM:DD HH:MM:SS".
  const m = input.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return `${y}:${mo}:${d} ${h}:${mi}:${s}`;
}

export interface BuildTiffResult {
  tiff: Uint8Array;
  written: string[];
  skipped: { field: string; reason: string }[];
}

export function buildExifTiff(fields: CameraExifFields): BuildTiffResult {
  const ifd0: TiffTag[] = [];
  const exifIfd: TiffTag[] = [];
  const written: string[] = [];
  const skipped: { field: string; reason: string }[] = [];

  if (fields.make?.trim()) {
    ifd0.push(makeAsciiTag(TAG_MAKE, fields.make.trim()));
    written.push('Camera Make');
  }
  if (fields.model?.trim()) {
    ifd0.push(makeAsciiTag(TAG_MODEL, fields.model.trim()));
    written.push('Camera Model');
  }
  if (fields.software?.trim()) {
    ifd0.push(makeAsciiTag(TAG_SOFTWARE, fields.software.trim()));
    written.push('Software');
  }
  if (fields.orientation?.trim()) {
    const code = Number(fields.orientation);
    if (Number.isInteger(code) && code >= 1 && code <= 8) {
      ifd0.push(makeShortTag(TAG_ORIENTATION, code));
      written.push('Orientation');
    } else {
      skipped.push({ field: 'Orientation', reason: 'Must be an EXIF orientation code from 1 to 8.' });
    }
  }
  if (fields.lensModel?.trim()) {
    exifIfd.push(makeAsciiTag(TAG_LENS_MODEL, fields.lensModel.trim()));
    written.push('Lens Model');
  }
  if (fields.dateTimeOriginal?.trim()) {
    const exifDate = toExifDateTime(fields.dateTimeOriginal);
    if (exifDate) {
      exifIfd.push(makeAsciiTag(TAG_DATETIME_ORIGINAL, exifDate));
      ifd0.push(makeAsciiTag(TAG_DATETIME, exifDate));
      written.push('Date and Time');
    } else {
      skipped.push({ field: 'Date and Time', reason: 'Expected format YYYY-MM-DD HH:mm:ss.' });
    }
  }
  if (fields.exposureTime?.trim()) {
    const rational = parseExposureTime(fields.exposureTime);
    if (rational) {
      exifIfd.push(makeRationalTag(TAG_EXPOSURE_TIME, rational[0], rational[1]));
      written.push('Exposure Time');
    } else {
      skipped.push({ field: 'Exposure Time', reason: 'Expected a fraction like 1/125 or a decimal number of seconds.' });
    }
  }
  if (fields.fNumber?.trim()) {
    const v = Number(fields.fNumber);
    if (isFinite(v) && v > 0) {
      const [num, den] = decimalToRational(v, 10);
      exifIfd.push(makeRationalTag(TAG_FNUMBER, num, den));
      written.push('Aperture (F-Number)');
    } else {
      skipped.push({ field: 'Aperture (F-Number)', reason: 'Expected a positive number like 1.8.' });
    }
  }
  if (fields.iso?.trim()) {
    const v = Number(fields.iso);
    if (Number.isInteger(v) && v > 0 && v <= 65535) {
      exifIfd.push(makeShortTag(TAG_ISO, v));
      written.push('ISO');
    } else {
      skipped.push({ field: 'ISO', reason: 'Expected a whole number between 1 and 65535.' });
    }
  }
  if (fields.focalLength?.trim()) {
    const v = Number(fields.focalLength);
    if (isFinite(v) && v > 0) {
      const [num, den] = decimalToRational(v, 10);
      exifIfd.push(makeRationalTag(TAG_FOCAL_LENGTH, num, den));
      written.push('Focal Length');
    } else {
      skipped.push({ field: 'Focal Length', reason: 'Expected a positive number of millimeters.' });
    }
  }
  if (fields.flash) {
    exifIfd.push(makeShortTag(TAG_FLASH, fields.flash === 'fired' ? 1 : 0));
    written.push('Flash');
  }
  if (fields.whiteBalance) {
    exifIfd.push(makeShortTag(TAG_WHITE_BALANCE, fields.whiteBalance === 'auto' ? 0 : 1));
    written.push('White Balance');
  }

  const tiff = buildTiff(ifd0, exifIfd.length > 0 ? exifIfd : null);
  return { tiff, written, skipped };
}

export async function writeCameraExif(file: File, fields: CameraExifFields): Promise<ExifWriteResult> {
  const buf = await file.arrayBuffer();
  const bytes = bufToUint8(buf);
  const format = sniffFormat(bytes);
  if (!format) {
    throw new Error('Unsupported or unrecognized image format. Only JPEG, PNG and WebP are supported.');
  }

  const { tiff, written, skipped } = buildExifTiff(fields);
  if (written.length === 0) {
    throw new Error('No camera EXIF fields were filled in - nothing to write.');
  }

  let outBytes: Uint8Array;
  if (format === 'jpeg') {
    outBytes = writeJpegExif(bytes, tiff);
  } else if (format === 'png') {
    outBytes = writePngExif(bytes, tiff);
  } else {
    const dims = await getImageDimensions(file);
    outBytes = writeWebpExif(bytes, tiff, dims);
  }

  const blob = toBlob(outBytes, MIME_BY_FORMAT[format as ImageFormat]);
  const verification = await readMetadata(blob, format);

  return { blob, format, written, skipped, verification };
}
