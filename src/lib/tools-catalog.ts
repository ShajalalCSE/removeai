// Catalog for the "Explore More Free Tools" platform grid. Tools marked
// status: 'available' have a real, working implementation and an entry in
// App.tsx's routes. Tools marked 'coming-soon' render a disabled card and
// link nowhere - per the brief, we never ship a tool card as if it works
// when it doesn't.

import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeftRight,
  Crop,
  Crosshair,
  Eraser,
  FileSearch,
  FileSearch2,
  FileText,
  FileX,
  Fingerprint,
  GitCompare,
  Layers,
  MapPin,
  MapPinOff,
  Minimize2,
  Music,
  Music2,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  Tag,
  Trash2,
  Video,
  VideoOff,
} from 'lucide-react';

export type ToolCategory =
  | 'image-forensics'
  | 'image-privacy'
  | 'image-optimization'
  | 'document-forensics'
  | 'video'
  | 'audio';

export type ToolStatus = 'available' | 'coming-soon';

export interface ToolDef {
  id: string;
  category: ToolCategory;
  icon: LucideIcon;
  title: string;
  headline: string;
  description: string;
  cta: string;
  route: string;
  status: ToolStatus;
}

export const CATEGORY_LABELS: Record<'all' | ToolCategory, string> = {
  all: 'সব টুল',
  'image-forensics': 'ইমেজ ফরেনসিক্স',
  'image-privacy': 'ইমেজ প্রাইভেসি',
  'image-optimization': 'ইমেজ অপ্টিমাইজেশন',
  'document-forensics': 'ডকুমেন্ট ফরেনসিক্স',
  video: 'ভিডিও টুলস',
  audio: 'অডিও টুলস',
};

export const TOOLS: ToolDef[] = [
  // Category A: Image Forensics & Privacy
  {
    id: 'exif-viewer',
    category: 'image-forensics',
    icon: ScanSearch,
    title: 'EXIF মেটাডেটা ভিউয়ার',
    headline: 'REVEAL HIDDEN PHOTO DATA',
    description: 'ক্যামেরার তথ্য, টাইমস্ট্যাম্প, GPS ফিল্ড ও অন্যান্য সাপোর্টেড মেটাডেটা পরীক্ষা করুন।',
    cta: 'START FORENSIC SCAN',
    route: '/exif-viewer',
    status: 'available',
  },
  {
    id: 'gps-location-checker',
    category: 'image-forensics',
    icon: MapPin,
    title: 'ফটো GPS লোকেশন চেকার',
    headline: 'FIND PHOTO LOCATION',
    description: 'একটি ছবিতে GPS কোঅর্ডিনেট আছে কিনা যাচাই করুন, যা ছবিটি কোথায় তোলা হয়েছে তা প্রকাশ করতে পারে।',
    cta: 'RUN LOCATION SCAN',
    route: '/gps-location-checker',
    status: 'available',
  },
  {
    id: 'gps-metadata-remover',
    category: 'image-privacy',
    icon: MapPinOff,
    title: 'GPS মেটাডেটা রিমুভার',
    headline: 'HIDE MY LOCATION',
    description: 'আপনার ছবি থেকে সাপোর্টেড GPS লোকেশন ফিল্ড রিমুভ করুন।',
    cta: 'REMOVE GPS DATA',
    route: '/gps-metadata-remover',
    status: 'available',
  },
  {
    id: 'c2pa-checker',
    category: 'image-forensics',
    icon: Fingerprint,
    title: 'C2PA কন্টেন্ট ক্রেডেনশিয়ালস চেকার',
    headline: 'SCAN AI FOOTPRINTS',
    description: 'একটি ছবিতে সাপোর্টেড C2PA কন্টেন্ট ক্রেডেনশিয়ালস ও প্রোভেন্যান্স তথ্য পরীক্ষা করুন।',
    cta: 'ANALYZE IMAGE',
    route: '/c2pa-checker',
    status: 'coming-soon',
  },
  {
    id: 'ai-provenance-inspector',
    category: 'image-forensics',
    icon: Crosshair,
    title: 'AI প্রোভেন্যান্স ইন্সপেক্টর',
    headline: 'TRACE IMAGE ORIGIN',
    description: 'একটি ছবির সাথে যুক্ত উপলব্ধ প্রোভেন্যান্স রেকর্ড ও সাপোর্টেড ইন্ডিকেটর পরীক্ষা করুন।',
    cta: 'INVESTIGATE ORIGIN',
    route: '/ai-provenance-inspector',
    status: 'coming-soon',
  },
  {
    id: 'image-privacy-checker',
    category: 'image-privacy',
    icon: ShieldCheck,
    title: 'ইমেজ প্রাইভেসি চেকার',
    headline: 'SCAN FOR HIDDEN DATA',
    description: 'একটি ছবি বা এর নির্মাতা সম্পর্কে তথ্য প্রকাশ করতে পারে এমন সাপোর্টেড মেটাডেটা ফিল্ড যাচাই করুন।',
    cta: 'RUN PRIVACY SCAN',
    route: '/image-privacy-checker',
    status: 'available',
  },
  {
    id: 'exif-metadata-remover',
    category: 'image-privacy',
    icon: Eraser,
    title: 'EXIF মেটাডেটা রিমুভার',
    headline: 'WIPE HIDDEN METADATA',
    description: 'প্রসেসিং পদ্ধতি যতটা সম্ভব নির্ভুলভাবে ছবির দৃশ্যমান অংশ অক্ষুণ্ণ রেখে সাপোর্টেড EXIF ফিল্ড রিমুভ করুন।',
    cta: 'CLEAN IMAGE',
    route: '/exif-metadata-remover',
    status: 'available',
  },
  {
    id: 'iptc-xmp-cleaner',
    category: 'image-privacy',
    icon: Trash2,
    title: 'IPTC ও XMP মেটাডেটা ক্লিনার',
    headline: 'PURGE IMAGE FOOTPRINTS',
    description: 'সাপোর্টেড IPTC ও XMP মেটাডেটা ফিল্ড পরীক্ষা করুন ও রিমুভ করুন।',
    cta: 'CLEAN METADATA',
    route: '/iptc-xmp-cleaner',
    status: 'coming-soon',
  },
  {
    id: 'bulk-metadata-remover',
    category: 'image-privacy',
    icon: Layers,
    title: 'বাল্ক ইমেজ মেটাডেটা রিমুভার',
    headline: 'CLEAN FILES IN BULK',
    description: 'একসাথে একাধিক সাপোর্টেড ছবি প্রসেস করুন এবং পরিষ্কার করা ফাইলগুলো একসাথে ডাউনলোড করুন।',
    cta: 'START BULK CLEANUP',
    route: '/bulk-metadata-remover',
    status: 'coming-soon',
  },
  {
    id: 'metadata-comparison',
    category: 'image-forensics',
    icon: GitCompare,
    title: 'ইমেজ মেটাডেটা তুলনা',
    headline: 'COMPARE BEFORE & AFTER',
    description: 'অরিজিনাল ও প্রসেস করা ইমেজ ফাইলের মেটাডেটা রিপোর্ট পাশাপাশি তুলনা করুন।',
    cta: 'COMPARE FILES',
    route: '/metadata-comparison',
    status: 'available',
  },

  // Category B: Image Optimization
  {
    id: 'image-compressor',
    category: 'image-optimization',
    icon: Minimize2,
    title: 'ইমেজ কম্প্রেসর',
    headline: 'SHRINK IMAGE SIZE',
    description: 'সাপোর্টেড কম্প্রেশন অপশন ব্যবহার করে ছবির ফাইল সাইজ কমান।',
    cta: 'OPTIMIZE IMAGE',
    route: '/image-compressor',
    status: 'coming-soon',
  },
  {
    id: 'image-converter',
    category: 'image-optimization',
    icon: RefreshCw,
    title: 'ইমেজ ফরম্যাট কনভার্টার',
    headline: 'TRANSFORM IMAGE FORMAT',
    description: 'সাপোর্টেড ছবি সাধারণ ফরম্যাটের মধ্যে কনভার্ট করুন।',
    cta: 'CONVERT IMAGE',
    route: '/image-converter',
    status: 'coming-soon',
  },
  {
    id: 'image-resizer',
    category: 'image-optimization',
    icon: Crop,
    title: 'ইমেজ রিসাইজার',
    headline: 'RESIZE LIKE A PRO',
    description: 'ছবি আপনার পছন্দমতো কাস্টম ডাইমেনশনে রিসাইজ করুন।',
    cta: 'RESIZE IMAGE',
    route: '/image-resizer',
    status: 'coming-soon',
  },
  {
    id: 'png-to-jpg',
    category: 'image-optimization',
    icon: ArrowLeftRight,
    title: 'PNG থেকে JPG কনভার্টার',
    headline: 'PNG → JPG',
    description: 'PNG ছবিকে JPG ফাইলে কনভার্ট করুন।',
    cta: 'CONVERT PNG → JPG',
    route: '/png-to-jpg',
    status: 'coming-soon',
  },
  {
    id: 'jpg-to-png',
    category: 'image-optimization',
    icon: ArrowLeftRight,
    title: 'JPG থেকে PNG কনভার্টার',
    headline: 'JPG → PNG',
    description: 'JPG ছবিকে PNG ফাইলে কনভার্ট করুন।',
    cta: 'CONVERT JPG → PNG',
    route: '/jpg-to-png',
    status: 'coming-soon',
  },
  {
    id: 'webp-converter',
    category: 'image-optimization',
    icon: RefreshCw,
    title: 'WebP কনভার্টার',
    headline: 'ACTIVATE WEBP MODE',
    description: 'ব্রাউজার ও প্রসেসিং লাইব্রেরি সাপোর্ট করলে সাপোর্টেড ছবি WebP-তে কনভার্ট করুন।',
    cta: 'CONVERT TO WEBP',
    route: '/webp-converter',
    status: 'coming-soon',
  },

  // Category C: Document Forensics
  {
    id: 'pdf-metadata-viewer',
    category: 'document-forensics',
    icon: FileSearch,
    title: 'PDF মেটাডেটা ভিউয়ার',
    headline: 'INSPECT PDF SECRETS',
    description: 'উপলব্ধ PDF প্রোপার্টি, ডকুমেন্ট তথ্য ও সাপোর্টেড মেটাডেটা ফিল্ড পরীক্ষা করুন।',
    cta: 'SCAN PDF',
    route: '/pdf-metadata-viewer',
    status: 'coming-soon',
  },
  {
    id: 'pdf-metadata-remover',
    category: 'document-forensics',
    icon: FileX,
    title: 'PDF মেটাডেটা রিমুভার',
    headline: 'CLEAN PDF FOOTPRINTS',
    description: 'কম্প্যাটিবল PDF ফাইল থেকে সাপোর্টেড ডকুমেন্ট মেটাডেটা রিমুভ করুন।',
    cta: 'CLEAN PDF',
    route: '/pdf-metadata-remover',
    status: 'coming-soon',
  },
  {
    id: 'docx-metadata-cleaner',
    category: 'document-forensics',
    icon: FileText,
    title: 'DOCX মেটাডেটা ক্লিনার',
    headline: 'PURGE DOCUMENT DATA',
    description: 'DOCX ফাইলে সাপোর্টেড ডকুমেন্ট প্রোপার্টি পরীক্ষা ও পরিষ্কার করুন।',
    cta: 'CLEAN DOCUMENT',
    route: '/docx-metadata-cleaner',
    status: 'coming-soon',
  },
  {
    id: 'document-inspector',
    category: 'document-forensics',
    icon: FileSearch2,
    title: 'ডকুমেন্ট প্রোপার্টিজ ইন্সপেক্টর',
    headline: 'INVESTIGATE DOCUMENT',
    description: 'সাপোর্টেড ডকুমেন্ট প্রোপার্টি পরীক্ষা করুন ও সম্ভাব্য সংবেদনশীল তথ্য শনাক্ত করুন।',
    cta: 'INSPECT FILE',
    route: '/document-inspector',
    status: 'coming-soon',
  },

  // Category D: Video Forensics
  {
    id: 'video-metadata-viewer',
    category: 'video',
    icon: Video,
    title: 'ভিডিও মেটাডেটা ভিউয়ার',
    headline: 'SCAN VIDEO FOOTPRINTS',
    description: 'সাপোর্টেড ভিডিও কন্টেইনার মেটাডেটা ও উপলব্ধ টেকনিক্যাল প্রোপার্টি পরীক্ষা করুন।',
    cta: 'SCAN VIDEO',
    route: '/video-metadata-viewer',
    status: 'coming-soon',
  },
  {
    id: 'video-metadata-remover',
    category: 'video',
    icon: VideoOff,
    title: 'ভিডিও মেটাডেটা রিমুভার',
    headline: 'CLEAN VIDEO METADATA',
    description: 'কম্প্যাটিবল ভিডিও ফাইল থেকে সাপোর্টেড মেটাডেটা রিমুভ করুন।',
    cta: 'CLEAN VIDEO',
    route: '/video-metadata-remover',
    status: 'coming-soon',
  },

  // Category E: Audio Forensics
  {
    id: 'audio-metadata-viewer',
    category: 'audio',
    icon: Music,
    title: 'অডিও মেটাডেটা ভিউয়ার',
    headline: 'DECODE AUDIO TAGS',
    description: 'সাপোর্টেড অডিও ট্যাগ ও ফাইল প্রোপার্টি পরীক্ষা করুন।',
    cta: 'SCAN AUDIO',
    route: '/audio-metadata-viewer',
    status: 'coming-soon',
  },
  {
    id: 'mp3-tag-cleaner',
    category: 'audio',
    icon: Tag,
    title: 'MP3 ID3 ট্যাগ ক্লিনার',
    headline: 'WIPE AUDIO FOOTPRINTS',
    description: 'MP3 ফাইল থেকে সাপোর্টেড ID3 ট্যাগ রিমুভ করুন।',
    cta: 'CLEAN AUDIO TAGS',
    route: '/mp3-tag-cleaner',
    status: 'coming-soon',
  },
  {
    id: 'audio-metadata-remover',
    category: 'audio',
    icon: Music2,
    title: 'অডিও মেটাডেটা রিমুভার',
    headline: 'CLEAN AUDIO METADATA',
    description: 'কম্প্যাটিবল অডিও ফাইল থেকে সাপোর্টেড মেটাডেটা রিমুভ করুন।',
    cta: 'CLEAN AUDIO',
    route: '/audio-metadata-remover',
    status: 'coming-soon',
  },
];
