// Separate from image-worker.ts so the pdf-lib/JSZip bundle (irrelevant to
// the image tools) only loads when a document/audio tool is actually opened.

import { readPdfMetadata, removePdfMetadata } from '../lib/pdf-metadata';
import { readDocxMetadata, removeDocxMetadata } from '../lib/docx-metadata';
import { readAudioMetadata, removeAudioMetadata } from '../lib/audio-metadata';

export type DocumentWorkerRequest =
  | { type: 'read-pdf'; id: string; file: File }
  | { type: 'remove-pdf'; id: string; file: File }
  | { type: 'read-docx'; id: string; file: File }
  | { type: 'remove-docx'; id: string; file: File }
  | { type: 'read-audio'; id: string; file: File }
  | { type: 'remove-audio'; id: string; file: File };

export type DocumentWorkerResponse =
  | { type: 'read-pdf-result'; id: string; ok: true; result: Awaited<ReturnType<typeof readPdfMetadata>> }
  | { type: 'remove-pdf-result'; id: string; ok: true; result: Awaited<ReturnType<typeof removePdfMetadata>> }
  | { type: 'read-docx-result'; id: string; ok: true; result: Awaited<ReturnType<typeof readDocxMetadata>> }
  | { type: 'remove-docx-result'; id: string; ok: true; result: Awaited<ReturnType<typeof removeDocxMetadata>> }
  | { type: 'read-audio-result'; id: string; ok: true; result: Awaited<ReturnType<typeof readAudioMetadata>> }
  | { type: 'remove-audio-result'; id: string; ok: true; result: Awaited<ReturnType<typeof removeAudioMetadata>> }
  | { type: string; id: string; ok: false; error: string };

self.onmessage = async (event: MessageEvent<DocumentWorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === 'read-pdf') {
      post({ type: 'read-pdf-result', id: msg.id, ok: true, result: await readPdfMetadata(msg.file) });
    } else if (msg.type === 'remove-pdf') {
      post({ type: 'remove-pdf-result', id: msg.id, ok: true, result: await removePdfMetadata(msg.file) });
    } else if (msg.type === 'read-docx') {
      const result = await readDocxMetadata(msg.file);
      post({ type: 'read-docx-result', id: msg.id, ok: true, result });
    } else if (msg.type === 'remove-docx') {
      post({ type: 'remove-docx-result', id: msg.id, ok: true, result: await removeDocxMetadata(msg.file) });
    } else if (msg.type === 'read-audio') {
      post({ type: 'read-audio-result', id: msg.id, ok: true, result: await readAudioMetadata(msg.file) });
    } else if (msg.type === 'remove-audio') {
      post({ type: 'remove-audio-result', id: msg.id, ok: true, result: await removeAudioMetadata(msg.file) });
    }
  } catch (err) {
    post({ type: `${msg.type}-error`, id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};

function post(response: DocumentWorkerResponse) {
  (self as unknown as Worker).postMessage(response);
}
