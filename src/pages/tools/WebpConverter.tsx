import { RefreshCw } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function WebpConverter() {
  return (
    <ImageTransformTool
      icon={RefreshCw}
      pageTitle="WebP কনভার্টার"
      headline="ACTIVATE WEBP MODE"
      description="সাপোর্টেড ছবি WebP-তে কনভার্ট করুন - সাধারণত সমান কোয়ালিটিতে JPEG-এর চেয়ে ছোট ফাইল সাইজ দেয়।"
      ctaLabel="CONVERT TO WEBP"
      busyLabel="কনভার্ট করা হচ্ছে…"
      suffix="converted"
      fixedFormat="webp"
      showQuality
      howToUse={['একটি JPEG বা PNG ছবি আপলোড করুন।', 'প্রয়োজনে কোয়ালিটি সমন্বয় করুন।', '"CONVERT TO WEBP" ক্লিক করে ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['সব ব্রাউজার ও অ্যাপ কি WebP সাপোর্ট করে?', 'আধুনিক সব ব্রাউজার (Chrome, Firefox, Safari, Edge) WebP সাপোর্ট করে। তবে কিছু পুরনো সফটওয়্যার বা ডিভাইস সাপোর্ট নাও করতে পারে।'],
        ['WebP কি সবসময় JPEG-এর চেয়ে ছোট হয়?', 'সাধারণত হ্যাঁ, একই ভিজুয়াল কোয়ালিটিতে WebP JPEG-এর চেয়ে ছোট ফাইল সাইজ দেয়, তবে এটি ছবির কন্টেন্টের উপর নির্ভর করে পরিবর্তিত হতে পারে।'],
      ]}
      relatedToolIds={['image-converter', 'image-compressor', 'png-to-jpg']}
    />
  );
}
