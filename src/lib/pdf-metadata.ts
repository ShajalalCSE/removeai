// PDF metadata read/remove, built on pdf-lib (actively maintained, pure JS,
// no WASM/Node dependency - works identically in the browser main thread and
// inside a Web Worker).
//
// pdf-lib's public API only exposes getters/setters for the standard Info
// dictionary fields (Title, Author, ...), which can set a field to an empty
// string but not truly delete the key. For a "remover" tool that's not
// good enough - an empty Title key is still a trace. `getInfoDict()` is a
// real (if TypeScript-private) method that returns the underlying PDFDict,
// which does support true key deletion - verified against the installed
// pdf-lib source before relying on it here. `updateMetadata: false` at load
// time stops pdf-lib from auto-stamping its own Producer/ModDate on load,
// which would otherwise reintroduce metadata we just removed.

import { PDFDocument, PDFName } from 'pdf-lib';

export interface PdfMetadataReport {
  title: string | null;
  author: string | null;
  subject: string | null;
  keywords: string | null;
  creator: string | null;
  producer: string | null;
  creationDate: string | null;
  modificationDate: string | null;
  pageCount: number;
  hasXmpMetadata: boolean;
}

interface InfoDictLike {
  delete(key: PDFName): boolean;
}

async function loadPdf(file: File): Promise<{ doc: PDFDocument; bytes: Uint8Array }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const doc = await PDFDocument.load(bytes, { updateMetadata: false, ignoreEncryption: true });
    return { doc, bytes };
  } catch {
    throw new Error('এটি একটি সঠিক বা সাপোর্টেড PDF ফাইল না।');
  }
}

export async function readPdfMetadata(file: File): Promise<PdfMetadataReport> {
  const { doc } = await loadPdf(file);
  const hasXmpMetadata = doc.catalog.has(PDFName.of('Metadata'));
  return {
    title: doc.getTitle() ?? null,
    author: doc.getAuthor() ?? null,
    subject: doc.getSubject() ?? null,
    keywords: doc.getKeywords() ?? null,
    creator: doc.getCreator() ?? null,
    producer: doc.getProducer() ?? null,
    creationDate: doc.getCreationDate()?.toISOString() ?? null,
    modificationDate: doc.getModificationDate()?.toISOString() ?? null,
    pageCount: doc.getPageCount(),
    hasXmpMetadata,
  };
}

export interface PdfRemovalResult {
  blob: Blob;
  removed: string[];
  bytesBefore: number;
  bytesAfter: number;
  verification: PdfMetadataReport;
}

const INFO_FIELDS: { label: string; name: string }[] = [
  { label: 'Title', name: 'Title' },
  { label: 'Author', name: 'Author' },
  { label: 'Subject', name: 'Subject' },
  { label: 'Keywords', name: 'Keywords' },
  { label: 'Creator', name: 'Creator' },
  { label: 'Producer', name: 'Producer' },
  { label: 'CreationDate', name: 'CreationDate' },
  { label: 'ModDate', name: 'ModDate' },
];

export async function removePdfMetadata(file: File): Promise<PdfRemovalResult> {
  const { doc, bytes } = await loadPdf(file);

  const removed: string[] = [];
  const infoDict = (doc as unknown as { getInfoDict(): InfoDictLike }).getInfoDict();
  for (const field of INFO_FIELDS) {
    if (infoDict.delete(PDFName.of(field.name))) removed.push(field.label);
  }
  if (doc.catalog.delete(PDFName.of('Metadata'))) removed.push('XMP Metadata Stream');

  const outBytes = await doc.save({ useObjectStreams: false });
  const blob = new Blob([outBytes as unknown as BlobPart], { type: 'application/pdf' });

  const verification = await readPdfMetadata(new File([blob], file.name, { type: 'application/pdf' }));

  return { blob, removed, bytesBefore: bytes.length, bytesAfter: outBytes.length, verification };
}
