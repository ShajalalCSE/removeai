// Materializes a selected File's bytes into memory immediately upon
// selection. Mobile browsers (notably Android Chrome, when a file comes
// from a content:// URI backed by a cloud-synced gallery like Google
// Photos) can throw "The requested file could not be read, typically due
// to permission problems that have occurred after a reference to a file
// was acquired" if the original File handle is read again after any delay
// - including the delay before a user clicks a processing button. Reading
// the file right away and rebuilding it as a memory-backed File removes
// that dependency on the OS-level grant for every later read.
export async function toStableFile(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  return new File([buffer], file.name, { type: file.type, lastModified: file.lastModified });
}
