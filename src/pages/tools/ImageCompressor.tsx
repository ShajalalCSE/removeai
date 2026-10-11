import { Minimize2 } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function ImageCompressor() {
  return (
    <ImageTransformTool
      icon={Minimize2}
      pageTitle="ইমেজ কম্প্রেসর"
      headline="SHRINK IMAGE SIZE"
      description="কোয়ালিটি স্লাইডার দিয়ে ছবির ফাইল সাইজ কমান - JPEG বা WebP আউটপুটে।"
      ctaLabel="OPTIMIZE IMAGE"
      busyLabel="কম্প্রেস করা হচ্ছে…"
      suffix="compressed"
      showQuality
      howToUse={['একটি ছবি আপলোড করুন।', 'কোয়ালিটি স্লাইডার সমন্বয় করুন - কম % মানে ছোট ফাইল সাইজ, বেশি কম্প্রেশন।', '"OPTIMIZE IMAGE" ক্লিক করে ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['কত % কোয়ালিটি ব্যবহার করা উচিত?', 'সাধারণত 70-85% ভালো ব্যালেন্স দেয় - ফাইল সাইজ অনেকটা কমে কিন্তু ভিজুয়াল কোয়ালিটি প্রায় অপরিবর্তিত থাকে। ওয়েবের জন্য 60-70% ও যথেষ্ট হতে পারে।'],
        ['PNG-তে কোয়ালিটি স্লাইডার কাজ করে না কেন?', 'PNG একটি লসলেস ফরম্যাট - এতে কোয়ালিটি লেভেল বলে কিছু নেই। PNG-তে সাইজ কমাতে চাইলে আউটপুট ফরম্যাট JPEG বা WebP-তে পরিবর্তন করুন।'],
      ]}
      relatedToolIds={['image-resizer', 'image-converter', 'exif-metadata-remover']}
    />
  );
}
