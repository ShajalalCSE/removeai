import { Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Faq from './pages/Faq';
import AllTools from './pages/AllTools';
import About from './pages/About';
import Contact from './pages/Contact';
import Terms from './pages/Terms';
import ExifViewer from './pages/tools/ExifViewer';
import GpsChecker from './pages/tools/GpsChecker';
import GpsRemover from './pages/tools/GpsRemover';
import ImagePrivacyChecker from './pages/tools/ImagePrivacyChecker';
import MetadataComparison from './pages/tools/MetadataComparison';
import ExifRemover from './pages/tools/ExifRemover';
import C2paChecker from './pages/tools/C2paChecker';
import AiProvenanceInspector from './pages/tools/AiProvenanceInspector';
import IptcXmpCleaner from './pages/tools/IptcXmpCleaner';
import BulkMetadataRemover from './pages/tools/BulkMetadataRemover';
import ImageCompressor from './pages/tools/ImageCompressor';
import ImageConverter from './pages/tools/ImageConverter';
import ImageResizer from './pages/tools/ImageResizer';
import PngToJpg from './pages/tools/PngToJpg';
import JpgToPng from './pages/tools/JpgToPng';
import WebpConverter from './pages/tools/WebpConverter';
import PdfMetadataViewer from './pages/tools/PdfMetadataViewer';
import PdfMetadataRemover from './pages/tools/PdfMetadataRemover';
import DocxMetadataCleaner from './pages/tools/DocxMetadataCleaner';
import DocumentInspector from './pages/tools/DocumentInspector';
import AudioMetadataViewer from './pages/tools/AudioMetadataViewer';
import Mp3TagCleaner from './pages/tools/Mp3TagCleaner';
import AudioMetadataRemover from './pages/tools/AudioMetadataRemover';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/tools" element={<AllTools />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />

          <Route path="/exif-viewer" element={<ExifViewer />} />
          <Route path="/gps-location-checker" element={<GpsChecker />} />
          <Route path="/gps-metadata-remover" element={<GpsRemover />} />
          <Route path="/image-privacy-checker" element={<ImagePrivacyChecker />} />
          <Route path="/metadata-comparison" element={<MetadataComparison />} />
          <Route path="/exif-metadata-remover" element={<ExifRemover />} />
          <Route path="/c2pa-checker" element={<C2paChecker />} />
          <Route path="/ai-provenance-inspector" element={<AiProvenanceInspector />} />
          <Route path="/iptc-xmp-cleaner" element={<IptcXmpCleaner />} />
          <Route path="/bulk-metadata-remover" element={<BulkMetadataRemover />} />
          <Route path="/image-compressor" element={<ImageCompressor />} />
          <Route path="/image-converter" element={<ImageConverter />} />
          <Route path="/image-resizer" element={<ImageResizer />} />
          <Route path="/png-to-jpg" element={<PngToJpg />} />
          <Route path="/jpg-to-png" element={<JpgToPng />} />
          <Route path="/webp-converter" element={<WebpConverter />} />
          <Route path="/pdf-metadata-viewer" element={<PdfMetadataViewer />} />
          <Route path="/pdf-metadata-remover" element={<PdfMetadataRemover />} />
          <Route path="/docx-metadata-cleaner" element={<DocxMetadataCleaner />} />
          <Route path="/document-inspector" element={<DocumentInspector />} />
          <Route path="/audio-metadata-viewer" element={<AudioMetadataViewer />} />
          <Route path="/mp3-tag-cleaner" element={<Mp3TagCleaner />} />
          <Route path="/audio-metadata-remover" element={<AudioMetadataRemover />} />

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
