import { useState, useEffect } from 'react';
import { Facebook, Instagram, X, Loader2Icon, SendIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';
import CustomDropdown from './CustomDropdown';

const SocialPublishModal = ({ isOpen, onClose, project, initialPlatform = 'Facebook' }) => {
    const { getToken } = useAuth();
    const [platform, setPlatform] = useState(initialPlatform);
    const [pages, setPages] = useState([]);
    const [selectedPage, setSelectedPage] = useState(null);
    const [caption, setCaption] = useState(project?.productName + ' - ' + project?.productDescription);

    const [isLoadingPages, setIsLoadingPages] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize Facebook SDK
    useEffect(() => {
        window.fbAsyncInit = function () {
            window.FB.init({
                appId: import.meta.env.VITE_META_APP_ID, // Ensure you have this in Frontend/.env
                cookie: true,
                xfbml: true,
                version: 'v19.0'
            });
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) { return; }
            js = d.createElement(s); js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    }, []);

    // Fetch pages if modal is open
    useEffect(() => {
        if (isOpen) {
            setPlatform(initialPlatform || 'Facebook');
            checkConnectionAndFetchPages();
        }
    }, [isOpen, initialPlatform]);

    const checkConnectionAndFetchPages = async () => {
        setIsLoadingPages(true);
        try {
            const token = await getToken();
            const { data } = await api.get('/api/meta/pages', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // If we successfully get arrays of pages, it means the user's token is valid
            setPages(data || []);
            setIsConnected(true);
            if (data?.length > 0) setSelectedPage(data[0]);
        } catch (error) {
            // Connection failed or not connected yet
            setIsConnected(false);
            setPages([]);
        } finally {
            setIsLoadingPages(false);
        }
    };

    const handleFacebookLogin = () => {
        setIsConnecting(true);
        window.FB.login(function (response) {
            if (response.authResponse) {
                // Connected successfully
                const accessToken = response.authResponse.accessToken;
                saveMetaTokenToBackend(accessToken);
            } else {
                toast.error('User cancelled login or did not fully authorize.');
                setIsConnecting(false);
            }
        }, { scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish', return_scopes: true });
    };

    const saveMetaTokenToBackend = async (accessToken) => {
        try {
            const token = await getToken();
            await api.post('/api/meta/connect', { accessToken }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Meta Account successfully connected!");
            checkConnectionAndFetchPages(); // Refresh the list
        } catch (error) {
            toast.error("Failed to save Meta connection.");
        } finally {
            setIsConnecting(false);
        }
    };

    const handlePublish = async () => {
        if (!selectedPage) return toast.error("Please select a page to publish to.");

        setIsPublishing(true);
        try {
            const token = await getToken();
            await api.post('/api/meta/publish', {
                pageId: selectedPage.id,
                pageAccessToken: selectedPage.access_token,
                imageUrl: project.generatedImage, // Will publish the top generated image
                message: caption,
                platform: platform.toLowerCase()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success(`Successfully published to ${platform}!`);
            onClose();
        } catch (error) {
            const backendErrorMsg = error?.response?.data?.message;
            toast.error(backendErrorMsg || `Failed to publish to ${platform}`);
        } finally {
            setIsPublishing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#13131a] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="p-6 md:p-8">
                    <h2 className="text-2xl font-bold mb-2 text-white flex items-center gap-2">
                        {platform === 'Facebook' ? <Facebook className="text-[#1877F2]" /> : <Instagram className="text-[#E4405F]" />}
                        Publish to {platform}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Instantly push your generated advertisement directly to your linked professional pages.
                    </p>

                    {!isConnected ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-white/5 rounded-xl border border-white/10">
                            <p className="mb-4 text-sm text-gray-300">You need to connect your Meta account first to authorize AdAlchemist.</p>
                            <button
                                onClick={handleFacebookLogin}
                                disabled={isConnecting}
                                className="px-6 py-3 bg-[#1877F2] hover:bg-[#1877F2]/90 rounded-xl font-semibold flex items-center gap-2 transition disabled:opacity-50"
                            >
                                {isConnecting ? <Loader2Icon className="animate-spin size-5" /> : <Facebook size={20} />}
                                {isConnecting ? "Connecting..." : "Connect with Facebook"}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Media Preview (Simplified) */}
                            <div className="flex gap-4 p-3 bg-white/5 rounded-xl border border-white/10">
                                <img src={project?.generatedImage} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
                                <div className="flex-1">
                                    <textarea
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        rows={3}
                                        className="w-full bg-transparent text-sm resize-none focus:outline-none placeholder-gray-500 text-gray-200"
                                        placeholder="Write a caption..."
                                    />
                                </div>
                            </div>

                            {/* Page Selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-300">Target Page / Account</label>
                                {isLoadingPages ? (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <Loader2Icon className="animate-spin size-4" /> Loading pages...
                                    </div>
                                ) : pages.length === 0 ? (
                                    <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                                        No Facebook Pages found. Make sure you own a page and granted permissions.
                                    </p>
                                ) : (
                                    <CustomDropdown
                                        label="Select Page"
                                        value={selectedPage?.id}
                                        onChange={(val) => setSelectedPage(pages.find(p => p.id === val))}
                                        options={pages.map(page => ({ label: page.name, value: page.id }))}
                                    />
                                )}
                            </div>


                            {/* Action Button */}
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing || pages.length === 0}
                                className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition disabled:opacity-50 ${platform === 'Facebook' ? 'bg-[#1877F2]' : 'bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#bc1888]'
                                    }`}
                            >
                                {isPublishing ? <Loader2Icon className="animate-spin size-5" /> : <SendIcon size={18} />}
                                {isPublishing ? "Publishing to Meta..." : `Publish to ${platform}`}
                            </button>

                            <p className="text-[10px] text-gray-500 text-center px-4">
                                By publishing, you agree to Meta's automated posting policies.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SocialPublishModal;
