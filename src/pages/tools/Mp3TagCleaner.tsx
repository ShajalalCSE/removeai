import { Tag } from 'lucide-react';
import AudioRemoverTool from '../../components/platform/AudioRemoverTool';

export default function Mp3TagCleaner() {
  return (
    <AudioRemoverTool
      icon={Tag}
      pageTitle="MP3 ID3 ট্যাগ ক্লিনার"
      headline="WIPE AUDIO FOOTPRINTS"
      description="MP3 ফাইল থেকে সাপোর্টেড ID3v1 ও ID3v2 ট্যাগ রিমুভ করুন - অডিও ফ্রেম ডেটা বাইট-ফর-বাইট অপরিবর্তিত থাকে।"
      ctaLabel="CLEAN AUDIO TAGS"
      howToUse={['একটি MP3 ফাইল আপলোড করুন।', '"CLEAN AUDIO TAGS" ক্লিক করুন।', 'ফলাফল পর্যালোচনা করে ডাউনলোড করুন।']}
      faq={[
        ['এটি কি অডিও কোয়ালিটি পরিবর্তন করে?', 'না। ID3 ট্যাগ ফাইলের শুরু/শেষে আলাদা ব্লক হিসেবে থাকে - রিমুভ করা মানে শুধু সেই ব্লক কেটে ফেলা, মাঝের অডিও ডেটা স্পর্শ করা হয় না।'],
        ['WAV বা FLAC ফাইল থেকে কি ট্যাগ রিমুভ করা যাবে?', 'না, এই মুহূর্তে শুধু MP3 সাপোর্টেড।'],
      ]}
      relatedToolIds={['audio-metadata-viewer', 'audio-metadata-remover']}
    />
  );
}
