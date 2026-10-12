import type { PdfMetadataReport, PdfRemovalResult } from './pdf-metadata';
import type { DocxMetadataReport, DocxRemovalResult } from './docx-metadata';
import type { AudioMetadataReport, AudioRemovalResult } from './audio-metadata';

interface PendingEntry {
  resolve: (value: any) => void;
  reject: (reason: unknown) => void;
}

class DocumentWorkerClient {
  private worker: Worker;
  private pending = new Map<string, PendingEntry>();
  private counter = 0;

  constructor() {
    this.worker = new Worker(new URL('../workers/document-worker.ts', import.meta.url), { type: 'module' });
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
    return `doc-req-${this.counter}-${Date.now()}`;
  }

  private send<T>(payload: any): Promise<T> {
    const id = this.nextId();
    payload.id = id;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage(payload);
    });
  }

  async readPdf(file: File): Promise<PdfMetadataReport> {
    const data = await this.send<{ result: PdfMetadataReport }>({ type: 'read-pdf', file });
    return data.result;
  }

  async removePdf(file: File): Promise<PdfRemovalResult> {
    const data = await this.send<{ result: PdfRemovalResult }>({ type: 'remove-pdf', file });
    return data.result;
  }

  async readDocx(file: File): Promise<DocxMetadataReport> {
    const data = await this.send<{ result: DocxMetadataReport }>({ type: 'read-docx', file });
    return data.result;
  }

  async removeDocx(file: File): Promise<DocxRemovalResult> {
    const data = await this.send<{ result: DocxRemovalResult }>({ type: 'remove-docx', file });
    return data.result;
  }

  async readAudio(file: File): Promise<AudioMetadataReport> {
    const data = await this.send<{ result: AudioMetadataReport }>({ type: 'read-audio', file });
    return data.result;
  }

  async removeAudio(file: File): Promise<AudioRemovalResult> {
    const data = await this.send<{ result: AudioRemovalResult }>({ type: 'remove-audio', file });
    return data.result;
  }

  terminate() {
    this.worker.terminate();
  }
}

let singleton: DocumentWorkerClient | null = null;

export function getDocumentWorkerClient(): DocumentWorkerClient {
  if (!singleton) singleton = new DocumentWorkerClient();
  return singleton;
}
