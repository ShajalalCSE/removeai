// DOCX metadata read/remove. A .docx file is a ZIP archive (OOXML); the
// properties live as plain XML in two fixed entries: docProps/core.xml
// (Dublin Core fields - title, author, keywords, timestamps) and
// docProps/app.xml (company, manager, and document statistics). We use
// JSZip (actively maintained, pure JS) for the archive.
//
// XML is parsed with small regexes instead of DOMParser/XMLSerializer:
// those two APIs do not exist in dedicated Worker global scope in Chromium
// (confirmed via a real browser - every call throws "DOMParser is not
// defined"), and all document processing here runs in a Worker. Matching
// is done against the conventional dc:/cp:/dcterms: prefixes rather than
// resolving namespace URIs, since every real-world Word/LibreOffice/Google
// Docs export uses those prefixes in practice and there is no namespace
// resolver available without a DOM.

import JSZip from 'jszip';

export interface DocxMetadataReport {
  title: string | null;
  subject: string | null;
  creator: string | null;
  keywords: string | null;
  description: string | null;
  lastModifiedBy: string | null;
  created: string | null;
  modified: string | null;
  company: string | null;
  manager: string | null;
}

const CORE_FIELDS: { key: keyof DocxMetadataReport; prefix: string; local: string }[] = [
  { key: 'title', prefix: 'dc', local: 'title' },
  { key: 'subject', prefix: 'dc', local: 'subject' },
  { key: 'creator', prefix: 'dc', local: 'creator' },
  { key: 'keywords', prefix: 'cp', local: 'keywords' },
  { key: 'description', prefix: 'dc', local: 'description' },
  { key: 'lastModifiedBy', prefix: 'cp', local: 'lastModifiedBy' },
  { key: 'created', prefix: 'dcterms', local: 'created' },
  { key: 'modified', prefix: 'dcterms', local: 'modified' },
];

const APP_FIELDS: { key: 'company' | 'manager'; local: string }[] = [
  { key: 'company', local: 'Company' },
  { key: 'manager', local: 'Manager' },
];

function xmlUnescape(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&amp;/g, '&');
}

function tagRegex(tag: string): RegExp {
  return new RegExp(`<${tag}(?:\\s[^>]*)?(?:\\/>|>([\\s\\S]*?)<\\/${tag}>)`);
}

function readXmlTag(xml: string, tag: string): string | null {
  const match = xml.match(tagRegex(tag));
  if (!match || match[1] === undefined) return null;
  const text = xmlUnescape(match[1]).trim();
  return text ? text : null;
}

function removeXmlTag(xml: string, tag: string): { xml: string; removed: boolean } {
  const match = xml.match(tagRegex(tag));
  if (!match || !match[1] || !xmlUnescape(match[1]).trim()) return { xml, removed: false };
  const start = match.index ?? 0;
  return { xml: xml.slice(0, start) + xml.slice(start + match[0].length), removed: true };
}

async function loadDocx(file: File): Promise<JSZip> {
  try {
    const zip = await JSZip.loadAsync(file);
    if (!zip.file('docProps/core.xml') && !zip.file('[Content_Types].xml')) {
      throw new Error('not a docx');
    }
    return zip;
  } catch {
    throw new Error('এটি একটি সঠিক বা সাপোর্টেড DOCX ফাইল না।');
  }
}

export async function readDocxMetadata(file: File): Promise<DocxMetadataReport> {
  const zip = await loadDocx(file);
  const coreXml = await zip.file('docProps/core.xml')?.async('string');
  const appXml = await zip.file('docProps/app.xml')?.async('string');

  const report: DocxMetadataReport = {
    title: null,
    subject: null,
    creator: null,
    keywords: null,
    description: null,
    lastModifiedBy: null,
    created: null,
    modified: null,
    company: null,
    manager: null,
  };

  if (coreXml) {
    for (const f of CORE_FIELDS) report[f.key] = readXmlTag(coreXml, `${f.prefix}:${f.local}`);
  }
  if (appXml) {
    for (const f of APP_FIELDS) report[f.key] = readXmlTag(appXml, f.local);
  }
  return report;
}

export interface DocxRemovalResult {
  blob: Blob;
  removed: string[];
  bytesBefore: number;
  bytesAfter: number;
  verification: DocxMetadataReport;
}

export async function removeDocxMetadata(file: File): Promise<DocxRemovalResult> {
  const bytesBefore = file.size;
  const zip = await loadDocx(file);
  const removed: string[] = [];

  const coreEntry = zip.file('docProps/core.xml');
  if (coreEntry) {
    let xmlText = await coreEntry.async('string');
    for (const f of CORE_FIELDS) {
      const result = removeXmlTag(xmlText, `${f.prefix}:${f.local}`);
      if (result.removed) {
        xmlText = result.xml;
        removed.push(f.key);
      }
    }
    zip.file('docProps/core.xml', xmlText);
  }

  const appEntry = zip.file('docProps/app.xml');
  if (appEntry) {
    let xmlText = await appEntry.async('string');
    let changed = false;
    for (const f of APP_FIELDS) {
      const result = removeXmlTag(xmlText, f.local);
      if (result.removed) {
        xmlText = result.xml;
        removed.push(f.local);
        changed = true;
      }
    }
    if (changed) zip.file('docProps/app.xml', xmlText);
  }

  const outBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  const verification = await readDocxMetadata(
    new File([outBlob], file.name, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }),
  );

  return { blob: outBlob, removed, bytesBefore, bytesAfter: outBlob.size, verification };
}
