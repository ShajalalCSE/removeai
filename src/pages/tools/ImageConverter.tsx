import { RefreshCw } from 'lucide-react';
import ImageTransformTool from '../../components/platform/ImageTransformTool';

export default function ImageConverter() {
  return (
    <ImageTransformTool
      icon={RefreshCw}
      pageTitle="ইমেজ ফরম্যাট কনভার্টার"
      headline="TRANSFORM IMAGE FORMAT"
      description="সাপোর্টেড ছবি JPEG, PNG বা WebP-এর মধ্যে কনভার্ট করুন।"
      ctaLabel="CONVERT IMAGE"
      busyLabel="কনভার্ট করা হচ্ছে…"
      suffix="converted"
      showQuality
      howToUse={['একটি ছবি আপলোড করুন।', 'আউটপুট ফরম্যাট বেছে নিন (JPEG, PNG বা WebP)।', '"CONVERT IMAGE" ক্লিক করে ফলাফল ডাউনলোড করুন।']}
      faq={[
        ['PNG থেকে JPEG-এ কনভার্ট করলে ট্রান্সপারেন্সির কী হয়?', 'JPEG-এ ট্রান্সপারেন্সি সাপোর্ট নেই, তাই ট্রান্সপারেন্ট অংশ সাদা ব্যাকগ্রাউন্ড দিয়ে ভরাট হয়ে যাবে।'],
        ['এই কনভার্সন কি লসলেস?', 'JPEG বা WebP (লসি মোডে) আউটপুটের ক্ষেত্রে না - পিক্সেল রি-এনকোড হয়। PNG আউটপুট লসলেস থাকে।'],
      ]}
      relatedToolIds={['png-to-jpg', 'jpg-to-png', 'webp-converter']}
    />
  );
}
