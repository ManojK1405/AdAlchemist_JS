import { useEffect, useState } from "react";
import {
    Edit2Icon,
    ImageIcon,
    Loader2Icon,
    RefreshCwIcon,
    SparkleIcon,
    VideoIcon,
    Facebook,
    Instagram,
    SendIcon,
    Coins,
    Settings2,
    Layers,
    PlayCircle
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { GhostButton, PrimaryButton } from "../components/Buttons";
import { useAuth, useUser } from "@clerk/clerk-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";
import SocialPublishModal from "../components/SocialPublishModal";

const Result = () => {

    const { projectId } = useParams();
    const { getToken } = useAuth();
    const { user, isLoaded } = useUser();
    const navigate = useNavigate();

    const [project, setProjectData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const [viewMode, setViewMode] = useState("image");
    const [selectedImageIdx, setSelectedImageIdx] = useState(-1);
    const [selectedVideoIdx, setSelectedVideoIdx] = useState(-1);
    const [detectedRatio, setDetectedRatio] = useState(null); // String like "9/16" or "16/9"

    // Facebook Publish States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetPlatform, setTargetPlatform] = useState('Facebook');

    // Fetch project
    const fetchProjectData = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/project/${projectId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setProjectData(data);
            setIsGenerating(data.isGenerating);

            // Set initial view mode and indices
            if (data.generatedVideo) {
                setViewMode("video");
            } else {
                setViewMode("image");
            }

            if (data.imageVersions?.length > 0) {
                setSelectedImageIdx(data.imageVersions.length - 1);
            } else {
                setSelectedImageIdx(-1);
            }

            if (data.videoVersions?.length > 0) {
                setSelectedVideoIdx(data.videoVersions.length - 1);
            } else {
                setSelectedVideoIdx(-1);
            }

            setLoading(false);

        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to load project data");
        }
    };

    // Simulate video generation
    const handleGenerateVideo = async () => {
        try {
            setIsGenerating(true);

            const token = await getToken();

            const { data } = await api.post(
                `/api/project/video`,
                { projectId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setProjectData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    generatedVideo: data.videoUrl,
                    isGenerating: false
                };
            });

            toast.success("Video generated successfully!");
            setIsGenerating(false);

        } catch (error) {
            // toast.error("Video Generation Disabled By Manoj K.");
            toast.error(error?.response?.data?.message || "Failed to generate video");
            setIsGenerating(false);
        }
    };

    const handleSocialPublish = (platform) => {
        setTargetPlatform(platform);
        setIsModalOpen(true);
    };

    const handleSetMaster = async (url, type) => {
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/project/${projectId}/set-master`, {
                url,
                type
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setProjectData(data);
            toast.success("Primary version updated");
        } catch (error) {
            toast.error("Failed to update primary version");
        }
    };


    useEffect(() => {
        if (!isLoaded) return;

        if (!user) {
            navigate("/");
            return;
        }

        if (!project?.id) {
            fetchProjectData();
        }
    }, [user, isLoaded, project?.id]);

    //fetch project every 10 seconds to check for video generation status
    useEffect(() => {
        if (!user || !isGenerating) return;

        const interval = setInterval(() => {
            fetchProjectData();
        }, 10000);

        return () => clearInterval(interval);
    }, [user, isGenerating]);



    //Helper Function
    const handleDownload = async (url, filename) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();

            const urlObj = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = urlObj;
            link.download = filename;
            link.click();
            // Small delay to ensure browser triggers download before revoking
            setTimeout(() => window.URL.revokeObjectURL(urlObj), 100);
        } catch (err) {
            console.error("Download failed", err);
        }
    };




    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.target;
        const ratio = (naturalWidth / naturalHeight).toFixed(2);
        if (ratio < 0.8) setDetectedRatio("9/16");
        else if (ratio > 1.2) setDetectedRatio("16/9");
        else setDetectedRatio("1/1");
    };

    const handleVideoMetadata = (e) => {
        const { videoWidth, videoHeight } = e.target;
        const ratio = (videoWidth / videoHeight).toFixed(2);
        if (ratio < 0.8) setDetectedRatio("9/16");
        else if (ratio > 1.2) setDetectedRatio("16/9");
        else setDetectedRatio("1/1");
    };

    // Loading Screen
    if (loading || !project) {
        return (
            <div className="h-screen w-full flex items-center justify-center">
                <Loader2Icon className="animate-spin text-cyan-400 size-9" />
            </div>
        );
    }

    // Determine which aspect ratio class to use
    const currentRatio = detectedRatio || project.aspectRatio.replace(":", "/");
    const ratioClass = currentRatio === "9/16"
        ? "aspect-[9/16] max-w-sm"
        : currentRatio === "1/1" || currentRatio === "1:1"
            ? "aspect-square max-w-2xl"
            : "aspect-video w-full";

    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-20">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-medium">
                        Generation Result
                    </h1>

                    <div className="flex gap-3">
                        <Link
                            to={`/edit/${project.id}`}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl text-white transition"
                        >
                            <Edit2Icon className="w-4 h-4" />
                            Edit Generation
                        </Link>

                        <Link
                            to={`/pro-edit/${project.id}`}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-3 rounded-xl text-white transition font-bold shadow-lg shadow-cyan-500/10"
                        >
                            <Settings2 className="w-4 h-4" />
                            Pro Studio
                        </Link>


                        <Link
                            to="/generate"
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-5 py-3 rounded-xl text-white transition"
                        >
                            <RefreshCwIcon className="w-4 h-4" />
                            <span className="hidden sm:block">New Generation</span>
                        </Link>
                    </div>
                </header>


                {/* Grid Layout */}
                <div className="grid lg:grid-cols-3 gap-10">

                    {/* Main Result Display */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Toggle */}
                        {project.generatedVideo && (
                            <div className="flex justify-center">
                                <div className="bg-white/5 backdrop-blur-md p-1.5 rounded-2xl flex border border-white/10 shadow-2xl">
                                    <button
                                        onClick={() => setViewMode("image")}
                                        className={`px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-bold ${viewMode === "image"
                                            ? "bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                            : "text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        <ImageIcon size={16} />
                                        Image
                                    </button>

                                    <button
                                        onClick={() => setViewMode("video")}
                                        className={`px-6 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 text-sm font-bold ${viewMode === "video"
                                            ? "bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                            : "text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        <VideoIcon size={16} />
                                        Video
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="glass-panel p-3 rounded-3xl w-full shadow-2xl border border-white/10">
                            <div className={`${ratioClass} transition-all duration-500 mx-auto rounded-2xl overflow-hidden bg-gray-950 relative`}>
                                {viewMode === "video" && project.generatedVideo ? (
                                    <video
                                        key={selectedVideoIdx}
                                        src={selectedVideoIdx === -1 ? project.generatedVideo : (project.videoVersions?.[selectedVideoIdx] || project.generatedVideo)}
                                        onLoadedMetadata={handleVideoMetadata}
                                        controls
                                        autoPlay
                                        loop
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <img
                                        key={selectedImageIdx}
                                        src={selectedImageIdx === -1 ? project.generatedImage : (project.imageVersions?.[selectedImageIdx] || project.generatedImage)}
                                        onLoad={handleImageLoad}
                                        alt="Generated Result"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Version History In Results */}
                        <div className="space-y-6">
                            {viewMode === "image" && (
                                <div className="flex flex-col gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Layers size={14} className="text-cyan-500" /> Image History
                                        </h3>
                                        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter">
                                            {Math.max((project.imageVersions || []).length, 1)} Variations
                                        </span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide min-h-[160px]">
                                        {/* Final Master Fallback */}
                                        {project.generatedImage && (
                                            <button
                                                onClick={() => setSelectedImageIdx(-1)}
                                                className={`relative shrink-0 w-28 h-40 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selectedImageIdx === -1 ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                            >
                                                <img src={project.generatedImage} className="w-full h-full object-cover" alt="Master" />
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 text-white">Latest</div>
                                                {selectedImageIdx === -1 && (
                                                    <div className="absolute inset-x-2 bottom-2 bg-cyan-600/90 backdrop-blur-sm py-1 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest shadow-lg">Active</div>
                                                )}
                                            </button>
                                        )}

                                        {(project.imageVersions || []).map((ver, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedImageIdx(idx)}
                                                className={`relative shrink-0 w-28 h-40 rounded-2xl overflow-hidden border-2 transition-all duration-300 group/item ${selectedImageIdx === idx ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                            >
                                                <img src={ver} alt={`Version ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover/item:scale-110" />
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 text-white shadow-xl">V{idx + 1}</div>
                                                {selectedImageIdx === idx && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetMaster(ver, "image");
                                                            }}
                                                            className="px-3 py-1.5 bg-cyan-600 rounded-lg text-[10px] font-bold shadow-xl hover:bg-cyan-500 transition-colors"
                                                        >
                                                            Set as Main
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedImageIdx === idx && (
                                                    <div className="absolute inset-x-2 bottom-2 bg-cyan-600/90 backdrop-blur-sm py-1 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest shadow-lg">Active</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewMode === "video" && project.generatedVideo && (
                                <div className="flex flex-col gap-4 p-6 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Layers size={14} className="text-cyan-500" /> Video History
                                        </h3>
                                        <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter">
                                            {Math.max((project.videoVersions || []).length, 1)} Variations
                                        </span>
                                    </div>
                                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide min-h-[120px]">
                                        {project.generatedVideo && (
                                            <button
                                                onClick={() => setSelectedVideoIdx(-1)}
                                                className={`relative shrink-0 w-40 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selectedVideoIdx === -1 ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                            >
                                                <video src={project.generatedVideo} className="w-full h-full object-cover opacity-40" />
                                                <PlayCircle className="absolute inset-0 m-auto size-8 text-white" />
                                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 text-white">Latest</div>
                                                {selectedVideoIdx === -1 && (
                                                    <div className="absolute inset-x-2 bottom-2 bg-cyan-600/90 backdrop-blur-sm py-1 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest shadow-lg">Active</div>
                                                )}
                                            </button>
                                        )}

                                        {(project.videoVersions || []).map((ver, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedVideoIdx(idx)}
                                                className={`relative shrink-0 w-40 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 group/item ${selectedVideoIdx === idx ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20'}`}
                                            >
                                                <video src={ver} className="w-full h-full object-cover absolute inset-0 opacity-40 group-hover/item:opacity-60 transition-opacity" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <PlayCircle className={`size-8 transition-transform duration-300 group-hover/item:scale-110 ${selectedVideoIdx === idx ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'text-white'}`} />
                                                </div>
                                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 text-white z-10">V{idx + 1}</div>
                                                {selectedVideoIdx === idx && (
                                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity z-20">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetMaster(ver, "video");
                                                            }}
                                                            className="px-3 py-1.5 bg-cyan-600 rounded-lg text-[10px] font-bold shadow-xl hover:bg-cyan-500 transition-colors"
                                                        >
                                                            Set as Main
                                                        </button>
                                                    </div>
                                                )}
                                                {selectedVideoIdx === idx && (
                                                    <div className="absolute inset-x-2 bottom-2 bg-cyan-600/90 backdrop-blur-sm py-1 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest shadow-lg z-10">Active</div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">

                        {/* Download Section */}
                        <div className="glass-panel p-6 rounded-2xl">
                            <h3 className="text-xl font-semibold mb-4">Actions</h3>

                            <div className="flex flex-col gap-3">

                                <GhostButton
                                    onClick={() =>
                                        handleDownload(
                                            selectedImageIdx === -1 ? project?.generatedImage : project.imageVersions?.[selectedImageIdx],
                                            `image-${project?.id}-v${selectedImageIdx + 2}.jpg`
                                        )
                                    }
                                    disabled={!project?.generatedImage}
                                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ImageIcon className="size-4" />
                                    Download Image
                                </GhostButton>


                                <GhostButton
                                    onClick={() => handleDownload(
                                        selectedVideoIdx === -1 ? project?.generatedVideo : project.videoVersions?.[selectedVideoIdx],
                                        `video-${project?.id}-v${selectedVideoIdx + 2}.mp4`
                                    )}
                                    disabled={!project?.generatedVideo || project?.generatedVideo.trim() === ""}
                                    className="w-full justify-center rounded-md py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <VideoIcon className="size-4" />
                                    Download Video
                                </GhostButton>



                            </div>
                        </div>

                        {/* Video Magic Section */}
                        <div className="glass-panel p-6 rounded-2xl relative">

                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <VideoIcon className="size-24" />
                            </div>

                            <h3 className="text-xl font-semibold mb-2">
                                Video Magic
                            </h3>

                            <p className="text-gray-400 text-sm mb-6">
                                Turn this static image into a dynamic video for social media.
                            </p>

                            {isGenerating ? (
                                <PrimaryButton disabled className="w-full justify-center">
                                    <Loader2Icon className="size-4 animate-spin" />
                                    Generating Video...
                                </PrimaryButton>
                            ) : !project.generatedVideo ? (
                                <PrimaryButton
                                    onClick={handleGenerateVideo}
                                    className="w-full justify-center flex-col gap-1 py-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <SparkleIcon className="size-4" />
                                        Generate Video
                                    </div>
                                    <div className="flex items-center gap-1 opacity-60">
                                        <Coins size={10} className="text-yellow-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter">Costs 40 Credits</span>
                                    </div>
                                </PrimaryButton>
                            ) : (
                                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                                    Video Generated Successfully!
                                </div>
                            )}

                        </div>

                        {/* Social Auto-Publish Section */}
                        <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
                            <h3 className="text-xl font-semibold mb-2">Social Publish</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Post directly to your linked connected professional pages.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSocialPublish("Facebook")}
                                    className="flex-1 py-3 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-xl flex items-center justify-center gap-2 transition font-medium"
                                >
                                    <Facebook size={18} />
                                    Facebook
                                </button>
                                <button
                                    onClick={() => handleSocialPublish("Instagram")}
                                    className="flex-1 py-3 bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 rounded-xl flex items-center justify-center gap-2 transition font-medium"
                                >
                                    <Instagram size={18} />
                                    Instagram
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <SocialPublishModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                project={project}
                initialPlatform={targetPlatform}
            />
        </div>
    );
};

export default Result;
