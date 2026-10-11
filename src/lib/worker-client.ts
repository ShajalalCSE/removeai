// Thin promise-based wrapper around the image-processing Web Worker so React
// components can `await client.clean(file, mode)` without touching postMessage.

import type { CameraExifFields, CleanMode, CleanResult, ExifWriteResult, GpsRemovalResult, MetadataReport } from '../types/metadata';
import type { TransformOptions, TransformResult } from './image-transform';
import type { C2paInfo } from './c2pa';

interface PendingEntry {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
}

class ImageWorkerClient {
  private worker: Worker;
  private pending = new Map<string, PendingEntry>();
  private counter = 0;

  constructor() {
    this.worker = new Worker(new URL('../workers/image-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (event: MessageEvent<any>) => {
      const { id, ok } = event.data;
      const entry = this.pending.get(id);
      if (!entry) return;
      this.pending.delete(id);
      if (ok) entry.resolve(event.data);
      else entry.reject(new Error(event.data.error));
    };
  }

  private nextId(): string {
    this.counter += 1;
    return `req-${this.counter}-${Date.now()}`;
  }

  private send<T>(payload: any): Promise<T> {
    const id = this.nextId();
    payload.id = id;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(payload);
    });
  }

  async read(file: File): Promise<{ report: MetadataReport; width: number; height: number }> {
    const data = await this.send<{ report: MetadataReport; width: number; height: number }>({ type: 'read', file });
    return data;
  }

  async clean(file: File, mode: CleanMode): Promise<CleanResult> {
    const data = await this.send<{ result: CleanResult }>({ type: 'clean', file, mode });
    return data.result;
  }

  async writeExif(file: File, fields: CameraExifFields): Promise<ExifWriteResult> {
    const data = await this.send<{ result: ExifWriteResult }>({ type: 'write-exif', file, fields });
    return data.result;
  }

  async removeGps(file: File): Promise<GpsRemovalResult> {
    const data = await this.send<{ result: GpsRemovalResult }>({ type: 'remove-gps', file });
    return data.result;
  }

  async transform(file: File, options: TransformOptions): Promise<TransformResult> {
    const data = await this.send<{ result: TransformResult }>({ type: 'transform', file, options });
    return data.result;
  }

  async readC2pa(file: File): Promise<C2paInfo> {
    const data = await this.send<{ result: C2paInfo }>({ type: 'read-c2pa', file });
    return data.result;
  }

  terminate() {
    this.worker.terminate();
  }
}

let singleton: ImageWorkerClient | null = null;

export function getImageWorkerClient(): ImageWorkerClient {
  if (!singleton) singleton = new ImageWorkerClient();
  return singleton;
}
