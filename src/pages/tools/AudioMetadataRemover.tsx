import { Music2 } from 'lucide-react';
import AudioRemoverTool from '../../components/platform/AudioRemoverTool';

export default function AudioMetadataRemover() {
  return (
    <AudioRemoverTool
      icon={Music2}
      pageTitle="অডিও মেটাডেটা রিমুভার"
      headline="CLEAN AUDIO METADATA"
      description="কম্প্যাটিবল অডিও ফাইল থেকে সাপোর্টেড মেটাডেটা রিমুভ করুন। এই মুহূর্তে শুধু MP3 (ID3v1/ID3v2) সাপোর্টেড।"
      ctaLabel="CLEAN AUDIO"
      howToUse={['একটি MP3 ফাইল আপলোড করুন।', '"CLEAN AUDIO" ক্লিক করুন।', 'ফলাফল পর্যালোচনা করে ডাউনলোড করুন।']}
      faq={[
        ['এটি আর MP3 ID3 ট্যাগ ক্লিনার থেকে কীভাবে আলাদা?', 'এই মুহূর্তে একই ইঞ্জিন ব্যবহার করে, কারণ MP3/ID3-ই একমাত্র ভালোভাবে সাপোর্টেড অডিও মেটাডেটা ফরম্যাট। ভবিষ্যতে WAV, FLAC বা OGG যোগ হলে এই টুল সেগুলোও হ্যান্ডল করবে।'],
        ['কোন কোন অডিও ফরম্যাট সাপোর্টেড?', 'এই মুহূর্তে শুধু MP3। অন্য ফরম্যাট আপলোড করলে স্পষ্ট এরর মেসেজ দেখানো হবে।'],
      ]}
      relatedToolIds={['audio-metadata-viewer', 'mp3-tag-cleaner']}
    />
  );
}
