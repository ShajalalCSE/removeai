import type { CameraExifFields } from '../types/metadata';

export interface CameraPreset {
  id: string;
  name: string;
  fields: CameraExifFields;
}

// These are illustrative, simulated profiles for testing and creative workflows -
// not captures of any real device's actual output. Applying one does not make
// the image "really" shot on that camera; it only writes these EXIF values.
export const PIXEL_7_PRESET_ID = 'google-pixel-7';

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: PIXEL_7_PRESET_ID,
    name: 'Google Pixel 7 (simulated)',
    fields: {
      make: 'Google',
      model: 'Pixel 7',
      lensModel: 'Pixel 7 back camera 6.81mm f/1.85',
      exposureTime: '1/200',
      fNumber: '1.85',
      iso: '55',
      focalLength: '6.81',
      flash: 'not-fired',
      whiteBalance: 'auto',
      orientation: '1',
      software: 'TQ3A.230901.001',
    },
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro (simulated)',
    fields: {
      make: 'Apple',
      model: 'iPhone 15 Pro',
      lensModel: 'iPhone 15 Pro back triple camera 6.765mm f/1.78',
      exposureTime: '1/120',
      fNumber: '1.78',
      iso: '64',
      focalLength: '6.77',
      flash: 'not-fired',
      whiteBalance: 'auto',
      orientation: '1',
      software: '17.5',
    },
  },
  {
    id: 'canon-eos-r5',
    name: 'Canon EOS R5 (simulated)',
    fields: {
      make: 'Canon',
      model: 'Canon EOS R5',
      lensModel: 'RF24-105mm F4 L IS USM',
      exposureTime: '1/250',
      fNumber: '4',
      iso: '400',
      focalLength: '50',
      flash: 'not-fired',
      whiteBalance: 'auto',
      orientation: '1',
      software: 'Canon EOS R5 1.8.1',
    },
  },
  {
    id: 'sony-a7-iv',
    name: 'Sony A7 IV (simulated)',
    fields: {
      make: 'Sony',
      model: 'ILCE-7M4',
      lensModel: 'FE 24-70mm F2.8 GM II',
      exposureTime: '1/160',
      fNumber: '2.8',
      iso: '200',
      focalLength: '35',
      flash: 'not-fired',
      whiteBalance: 'auto',
      orientation: '1',
      software: 'ILCE-7M4 v3.00',
    },
  },
  {
    id: 'generic-dslr',
    name: 'Generic DSLR (simulated)',
    fields: {
      make: 'Generic Camera Co.',
      model: 'DSLR-1000',
      lensModel: '18-55mm Kit Lens',
      exposureTime: '1/125',
      fNumber: '5.6',
      iso: '100',
      focalLength: '35',
      flash: 'not-fired',
      whiteBalance: 'auto',
      orientation: '1',
      software: 'v1.0',
    },
  },
];

export const PIXEL_7_PRESET = CAMERA_PRESETS.find((p) => p.id === PIXEL_7_PRESET_ID)!;
