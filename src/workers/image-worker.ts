// Runs the heavier binary work (metadata read/clean/write) off the main thread
// so dragging in a batch of large images never freezes the UI. The library
// code in src/lib is plain ArrayBuffer/Blob manipulation with no DOM
// dependency, so it runs unchanged here.

import { cleanImage, removeGpsOnly } from '../lib/metadata-cleaner';
import { readMetadata } from '../lib/metadata-reader';
import { writeCameraExif } from '../lib/exif-writer';
import { sniffFormat } from '../lib/format';
import { bufToUint8 } from '../lib/binary';
import type { CameraExifFields, CleanMode } from '../types/metadata';

export type WorkerRequest =
  | { type: 'read'; id: string; file: File }
  | { type: 'clean'; id: string; file: File; mode: CleanMode }
  | { type: 'write-exif'; id: string; file: File; fields: CameraExifFields }
  | { type: 'remove-gps'; id: string; file: File };

export type WorkerResponse =
  | { type: 'read-result'; id: string; ok: true; report: Awaited<ReturnType<typeof readMetadata>>; width: number; height: number }
  | { type: 'clean-result'; id: string; ok: true; result: Awaited<ReturnType<typeof cleanImage>> }
  | { type: 'write-exif-result'; id: string; ok: true; result: Awaited<ReturnType<typeof writeCameraExif>> }
  | { type: 'remove-gps-result'; id: string; ok: true; result: Awaited<ReturnType<typeof removeGpsOnly>> }
  | { type: string; id: string; ok: false; error: string };

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === 'read') {
      const buf = await msg.file.arrayBuffer();
      const bytes = bufToUint8(buf);
      const format = sniffFormat(bytes);
      if (!format) throw new Error('ফরম্যাট সাপোর্টেড না বা শনাক্ত করা যায়নি।');
      const bitmap = await createImageBitmap(msg.file);
      const width = bitmap.width;
      const height = bitmap.height;
      bitmap.close();
      const report = await readMetadata(msg.file, format);
      post({ type: 'read-result', id: msg.id, ok: true, report, width, height });
    } else if (msg.type === 'clean') {
      const result = await cleanImage(msg.file, msg.mode);
      post({ type: 'clean-result', id: msg.id, ok: true, result });
    } else if (msg.type === 'write-exif') {
      const result = await writeCameraExif(msg.file, msg.fields);
      post({ type: 'write-exif-result', id: msg.id, ok: true, result });
    } else if (msg.type === 'remove-gps') {
      const result = await removeGpsOnly(msg.file);
      post({ type: 'remove-gps-result', id: msg.id, ok: true, result });
    }
  } catch (err) {
    post({ type: `${msg.type}-error`, id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};

function post(response: WorkerResponse) {
  (self as unknown as Worker).postMessage(response);
}
