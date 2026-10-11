import { ArrowLeftRight } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function PngToJpg() {
  return (
    <ImageTransformTool
      icon={ArrowLeftRight}
      pageTitle="PNG থেকে JPG কনভার্টার"
      headline="PNG → JPG"
      description="PNG ছবিকে JPG ফাইলে কনভার্ট করুন। ট্রান্সপারেন্ট অংশ সাদা ব্যাকগ্রাউন্ড দিয়ে ভরাট হবে।"
      ctaLabel="CONVERT PNG → JPG"
      busyLabel="কনভার্ট করা হচ্ছে…"
      suffix="converted"
      fixedFormat="jpeg"
      showQuality
      howToUse={['একটি PNG ছবি আপলোড করুন।', 'প্রয়োজনে কোয়ালিটি সমন্বয় করুন।', '"CONVERT PNG → JPG" ক্লিক করে ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['আমার ছবির ট্রান্সপারেন্সির কী হবে?', 'JPEG ফরম্যাটে ট্রান্সপারেন্সি সাপোর্ট নেই, তাই ট্রান্সপারেন্ট অংশ সাদা রঙে ভরাট হয়ে যাবে।'],
        ['আমি কি JPG থেকে আবার PNG-তে ফিরে যেতে পারব?', 'হ্যাঁ, কিন্তু JPEG কনভার্সনে যে ডিটেইল হারিয়েছে তা ফিরে আসবে না - JPG থেকে PNG কনভার্সন শুধু ফরম্যাট পরিবর্তন করে, হারানো কোয়ালিটি পুনরুদ্ধার করে না।'],
      ]}
      relatedToolIds={['jpg-to-png', 'image-converter', 'image-compressor']}
    />
  );
}
