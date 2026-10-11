import { Link } from 'react-router-dom';
import { useDocumentMeta } from '../lib/use-document-meta';

export default function About() {
  useDocumentMeta(
    'আমাদের সম্পর্কে — Mission Hackers Bangladesh',
    'Mission Hackers Bangladesh সম্পর্কে জানুন - বাংলাদেশের একটি সাইবার সিকিউরিটি শিক্ষা প্ল্যাটফর্ম, যারা ফ্রি ব্রাউজার-ভিত্তিক ইমেজ প্রাইভেসি টুল তৈরি করেছে।',
    '/about',
  );

  return (
    <div className="bg-cyber-950 text-cyber-100">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">আমাদের সম্পর্কে</h1>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-cyber-200">
          <p>
            এই টুলগুলো তৈরি করেছে{' '}
            <a href="https://missionhacker.com" target="_blank" rel="noreferrer" className="text-neon-400 underline hover:text-neon-300">
              Mission Hackers Bangladesh
            </a>
            , বাংলাদেশের একটি সাইবার সিকিউরিটি শিক্ষা প্ল্যাটফর্ম যা নৈতিক হ্যাকিং ও পেনিট্রেশন টেস্টিং নিয়ে প্রশিক্ষণ দেয়।
            এই ইমেজ প্রাইভেসি ও সাইবার ফরেনসিক্স টুলসেটটি সাধারণ ব্যবহারকারীদের ডিজিটাল প্রাইভেসি সচেতনতা বাড়ানোর লক্ষ্যে
            তৈরি করা হয়েছে।
          </p>
          <p>
            প্রতিটি টুল সম্পূর্ণ আপনার ব্রাউজারে চলে - কোনো ছবি বা ফাইল কোনো সার্ভারে আপলোড করা হয় না। এর মানে আপনার ফাইল
            সবসময় আপনার নিয়ন্ত্রণে থাকে।
          </p>
          <p>
            আমরা বিশ্বাস করি সাইবার সিকিউরিটি ও ডিজিটাল প্রাইভেসি জ্ঞান সবার জন্য সহজলভ্য হওয়া উচিত - এজন্যই এই টুলগুলো
            সম্পূর্ণ ফ্রি ও কোনো রেজিস্ট্রেশন ছাড়াই ব্যবহার করা যায়।
          </p>
          <p>
            আরও জানতে বা সাইবার সিকিউরিটি কোর্স সম্পর্কে জানতে{' '}
            <a href="https://missionhacker.com" target="_blank" rel="noreferrer" className="text-neon-400 underline hover:text-neon-300">
              missionhacker.com
            </a>{' '}
            ভিজিট করুন, অথবা আমাদের{' '}
            <Link to="/tools" className="text-neon-400 underline hover:text-neon-300">
              সব টুল
            </Link>{' '}
            দেখুন।
          </p>
        </div>
      </div>
    </div>
  );
}
