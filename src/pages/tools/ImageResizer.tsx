import { Crop } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function ImageResizer() {
  return (
    <ImageTransformTool
      icon={Crop}
      pageTitle="ইমেজ রিসাইজার"
      headline="RESIZE LIKE A PRO"
      description="ছবি আপনার পছন্দমতো কাস্টম প্রস্থ ও উচ্চতায় রিসাইজ করুন।"
      ctaLabel="RESIZE IMAGE"
      busyLabel="রিসাইজ করা হচ্ছে…"
      suffix="resized"
      showDimensions
      showQuality
      howToUse={['একটি ছবি আপলোড করুন।', 'কাঙ্ক্ষিত প্রস্থ ও/অথবা উচ্চতা লিখুন (খালি রাখলে অরিজিনাল সাইজ ব্যবহৃত হবে)।', '"RESIZE IMAGE" ক্লিক করে ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['আমি কি শুধু প্রস্থ দিলে, উচ্চতা অটোমেটিক সমন্বয় হবে?', 'না, এই টুলে আপনি যা লিখবেন ঠিক সেই এক্সাক্ট ডাইমেনশনে রিসাইজ হবে। অ্যাসপেক্ট রেশিও বজায় রাখতে চাইলে প্রস্থ ও উচ্চতা উভয়ই সঠিক অনুপাতে হিসাব করে লিখুন।'],
        ['বড় সাইজে রিসাইজ করলে (আপস্কেল) কোয়ালিটি কেমন হবে?', 'ছোট ছবিকে বড় করলে (আপস্কেলিং) নতুন পিক্সেল অনুমান করে তৈরি করা হয়, তাই ছবি কিছুটা ঝাপসা দেখাতে পারে। সেরা ফলাফলের জন্য মূল সাইজের চেয়ে ছোট বা সমান সাইজে রিসাইজ করুন।'],
      ]}
      relatedToolIds={['image-compressor', 'image-converter', 'bulk-metadata-remover']}
    />
  );
}
