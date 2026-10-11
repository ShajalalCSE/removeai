import { ArrowLeftRight } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function JpgToPng() {
  return (
    <ImageTransformTool
      icon={ArrowLeftRight}
      pageTitle="JPG থেকে PNG কনভার্টার"
      headline="JPG → PNG"
      description="JPG ছবিকে PNG ফাইলে কনভার্ট করুন।"
      ctaLabel="CONVERT JPG → PNG"
      busyLabel="কনভার্ট করা হচ্ছে…"
      suffix="converted"
      fixedFormat="png"
      howToUse={['একটি JPG ছবি আপলোড করুন।', '"CONVERT JPG → PNG" ক্লিক করুন।', 'ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['এই কনভার্সন কি JPEG-এর কম্প্রেশন আর্টিফ্যাক্ট ঠিক করে দেয়?', 'না। JPEG-এ ইতিমধ্যে যে ইমেজ কোয়ালিটি লস হয়েছে তা PNG-তে কনভার্ট করলে ফিরে আসে না - PNG শুধু ফলাফল লসলেসভাবে সংরক্ষণ করে, যা ইতিমধ্যে আছে তার বাইরে নতুন ডিটেইল যোগ করে না।'],
        ['PNG ফাইল কি JPG-এর চেয়ে বড় হবে?', 'সাধারণত হ্যাঁ, কারণ PNG লসলেস কম্প্রেশন ব্যবহার করে, যা একই ছবির জন্য JPEG-এর চেয়ে বড় ফাইল সাইজ দেয়।'],
      ]}
      relatedToolIds={['png-to-jpg', 'image-converter', 'image-resizer']}
    />
  );
}
