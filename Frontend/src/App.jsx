import Navbar from './components/Navbar';
import Home from './pages/Home';
import SoftBackdrop from './components/SoftBackdrop';
import Footer from './components/Footer';
import LenisScroll from './components/lenis';
import { Route, Routes, useLocation } from 'react-router-dom';
import Result from './pages/Result';
import Community from './pages/Community';
import Plans from './pages/Plans';
import Generator from './pages/Generator';
import MyGenerations from './pages/MyGenerations';
import Loading from './pages/Loading';
import { Toaster } from 'react-hot-toast';
import FAQ from './pages/FAQ';
import FeaturesPage from './pages/FeaturesPage';
import EditGeneration from './pages/EditGeneration';
import CreatorLounge from './pages/CreatorLounge';
import Billing from './pages/Billing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ProfessionalEdit from './pages/ProfessionalEdit/index';
import QueueManager from './components/QueueManager';
import GrowthSocialProof from './components/GrowthSocialProof';
import AdminSettings from './pages/AdminSettings';
import BrandHub from './pages/BrandHub';
import SharedReview from './pages/SharedReview';

function App() {
    const location = useLocation();
    const isProEdit = location.pathname.startsWith('/pro-edit');
    const isReview = location.pathname.startsWith('/review/');

    return (
        <>
            <Toaster toastOptions={{ style: { background: "#333", color: "#fff" } }} />
            <SoftBackdrop />
            <LenisScroll />
            {!isProEdit && !isReview && <Navbar />}
            {!isProEdit && !isReview && <QueueManager />}
            {!isProEdit && !isReview && <GrowthSocialProof />}

            <Routes>
                <Route path="/" element={<Home />} />

                <Route path="/community" element={<Community />} />
                <Route path="/creator-lounge" element={<CreatorLounge />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/generate" element={<Generator />} />
                <Route path="/brand-hub" element={<BrandHub />} />
                <Route path="/review/:projectId" element={<SharedReview />} />
                <Route path="/my-generations" element={<MyGenerations />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/result/:projectId" element={<Result />} />
                <Route path="/edit/:projectId" element={<EditGeneration />} />
                <Route path="/pro-edit/:projectId" element={<ProfessionalEdit />} />
                <Route path="/loading" element={<Loading />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
            </Routes>

            {!isProEdit && <Footer />}
        </>
    );
}
export default App;
