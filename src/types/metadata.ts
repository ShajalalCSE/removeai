export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface MetadataField {
  category: 'EXIF' | 'XMP' | 'IPTC' | 'ICC' | 'C2PA' | 'File';
  label: string;
  value: string;
}

export interface MetadataReport {
  format: ImageFormat;
  fields: MetadataField[];
  hasExif: boolean;
  hasXmp: boolean;
  hasIptc: boolean;
  hasIcc: boolean;
  hasC2pa: boolean;
  software: string | null;
  gps: { lat: number; lon: number } | null;
  aiSignals: string[]; // human-readable flags, e.g. "Software tag mentions 'Midjourney'"
  totalMetadataBytes: number;
}

export type CleanMode = 'ai' | 'all';

export interface CleanResult {
  blob: Blob;
  format: ImageFormat;
  mode: CleanMode;
  removed: string[];
  kept: string[];
  bytesBefore: number;
  bytesAfter: number;
  recompressed: false; // always false - every path here is a lossless rewrite
  verification: MetadataReport;
}

export interface CameraExifFields {
  make?: string;
  model?: string;
  lensModel?: string;
  dateTimeOriginal?: string; // "YYYY-MM-DD HH:mm:ss"
  exposureTime?: string; // e.g. "1/125"
  fNumber?: string; // e.g. "1.8"
  iso?: string;
  focalLength?: string; // mm
  flash?: 'fired' | 'not-fired';
  whiteBalance?: 'auto' | 'manual';
  orientation?: string;
  software?: string;
}

export interface ExifWriteResult {
  blob: Blob;
  format: ImageFormat;
  written: string[];
  skipped: { field: string; reason: string }[];
  verification: MetadataReport;
}

export interface GpsRemovalResult {
  blob: Blob;
  format: ImageFormat;
  hadGps: boolean;
  bytesBefore: number;
  bytesAfter: number;
  verification: MetadataReport;
}

export interface UploadedImage {
  id: string;
  file: File;
  format: ImageFormat;
  previewUrl: string;
  width: number;
  height: number;
  originalReport: MetadataReport;
}
