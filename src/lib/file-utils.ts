// Materializes a selected File's bytes into memory immediately upon
// selection. Mobile browsers (notably Android Chrome, when a file comes
// from a content:// URI backed by a cloud-synced gallery like Google
// Photos) can throw "The requested file could not be read, typically due
// to permission problems that have occurred after a reference to a file
// was acquired" if the original File handle is read again after any delay
// - including the delay before a user clicks a processing button. Reading
// the file right away and rebuilding it as a memory-backed File removes
// that dependency on the OS-level grant for every later read.
//
// The same browser-level error also fires when the file is still a
// cloud-only placeholder that was never actually downloaded to the device
// - most commonly an iCloud Photos item on iOS/macOS with "Optimize
// Storage" on, or a Google Photos item not yet cached locally. The browser
// can't hand over bytes it was never given, and there's no way for us to
// trigger the download ourselves - so we detect that failure and surface a
// clear, actionable message instead of the raw browser error.
function isUnreadableFileError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return err.name === 'NotReadableError' || /could not be read|permission problems/i.test(err.message);
  }
  return err instanceof Error && /could not be read|permission problems/i.test(err.message);
}

export async function toStableFile(file: File): Promise<File> {
  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (err) {
    if (isUnreadableFileError(err)) {
      throw new Error(
        `"${file.name}" পড়া যায়নি। এটি সম্ভবত iCloud, Google Photos বা অন্য কোনো ক্লাউড-সিঙ্কড গ্যালারি থেকে সরাসরি আপলোড করা একটি ফাইল, যা এখনো আপনার ডিভাইসে পুরোপুরি ডাউনলোড হয়নি - ব্রাউজার থেকে এই ধরনের ফাইল সরাসরি আপলোড করা সম্ভব না। অনুগ্রহ করে প্রথমে ছবিটি আপনার ডিভাইসে সেভ/ডাউনলোড করুন (iCloud হলে "Download Original" বেছে নিন), তারপর আবার আপলোড করুন।`,
      );
    }
    throw err;
  }
  return new File([buffer], file.name, { type: file.type, lastModified: file.lastModified });
}
