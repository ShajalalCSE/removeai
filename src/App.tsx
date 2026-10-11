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

          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
