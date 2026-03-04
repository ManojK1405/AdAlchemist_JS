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
    Copy,
    Coins,
    Settings2,
    Layers,
    PlayCircle,
    Clock,
    ShieldCheck,
    MessageSquare,
    Share2
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
    const [isQueuing, setIsQueuing] = useState(false);
    const [hasPipelineAccess, setHasPipelineAccess] = useState(false);

    const [viewMode, setViewMode] = useState("image");
    const [selectedImageIdx, setSelectedImageIdx] = useState(-1);
    const [selectedVideoIdx, setSelectedVideoIdx] = useState(-1);
    const [detectedRatio, setDetectedRatio] = useState(null); // String like "9/16" or "16/9"
    const [isEvaluating, setIsEvaluating] = useState(false);

    // Facebook Publish States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [targetPlatform, setTargetPlatform] = useState('Facebook');

    const fetchUserStatus = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/credits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasPipelineAccess(data.hasPipelineAccess);
        } catch (error) {
            console.error("Error fetching user status", error);
        }
    };

    // Fetch project
    const fetchProjectData = async () => {
        try {
            const token = await getToken();
            fetchUserStatus();
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
            toast.error(error?.response?.data?.message || "Failed to generate video");
            setIsGenerating(false);
        }
    };

    const handleQueueVideo = async () => {
        if (!hasPipelineAccess) {
            toast.error("Pipeline Scheduling is a Pro feature. Please unlock it to continue.");
            navigate('/plans');
            return;
        }
        try {
            setIsQueuing(true);
            const token = await getToken();

            // 1. Schedule video generation (deducts credits)
            await api.post(`/api/project/video`, { projectId, queueOnly: true }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Add to actual queue
            await api.post('/api/project/queue', {
                projectId,
                type: 'VIDEO',
                payload: {
                    productName: project.productName,
                    aspectRatio: project.aspectRatio
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Video added to pipeline!");
            setIsQueuing(false);
            navigate('/my-generations');
        } catch (error) {
            setIsQueuing(false);
            toast.error(error?.response?.data?.message || "Failed to schedule video");
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
    const handleDownload = (url, name) => {
        if (!url) return;
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleEvaluate = async () => {
        setIsEvaluating(true);
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/project/${projectId}/evaluate`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProjectData(prev => ({ ...prev, engagementScore: data.score, scoringFeedback: data.feedback }));
            toast.success("AI Analysis Complete!");
        } catch (error) {
            toast.error("Evaluation failed. Please try again later.");
        } finally {
            setIsEvaluating(false);
        }
    };

    const handleRegenerateWithSuggestion = async () => {
        setIsGenerating(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('userPrompt', project.scoringFeedback);
            formData.append('keepOriginalScene', 'true');

            await api.post(`/api/project/${projectId}/edit`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Regeneration started using AI feedback! (5 credits deducted)");
            fetchProjectData();
        } catch (error) {
            setIsGenerating(false);
            toast.error(error?.response?.data?.message || "AI Regeneration failed");
        }
    };

    const handleRegenerateVideoWithSuggestion = async () => {
        setIsGenerating(true);
        try {
            const token = await getToken();
            await api.post(`/api/project/edit-video`, { projectId, userPrompt: project.scoringFeedback }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Video regeneration started using AI feedback! (25 credits deducted)");
            fetchProjectData();
        } catch (error) {
            setIsGenerating(false);
            toast.error(error?.response?.data?.message || "AI Video Regeneration failed");
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
                                        src={(selectedVideoIdx === -1 ? project.generatedVideo : (project.videoVersions?.[selectedVideoIdx] || project.generatedVideo)) || null}
                                        onLoadedMetadata={handleVideoMetadata}
                                        controls
                                        autoPlay
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <img
                                        key={selectedImageIdx}
                                        src={(selectedImageIdx === -1 ? project.generatedImage : (project.imageVersions?.[selectedImageIdx] || project.generatedImage)) || null}
                                        onLoad={handleImageLoad}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
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

                                        {(project.imageVersions || [])
                                            .filter(ver => ver !== project.generatedImage)
                                            .map((ver, idx) => (
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
                                                <video src={project.generatedVideo || null} className="w-full h-full object-cover opacity-40" />
                                                <PlayCircle className="absolute inset-0 m-auto size-8 text-white" />
                                                <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded-md text-[10px] font-black border border-white/10 text-white">Latest</div>
                                                {selectedVideoIdx === -1 && (
                                                    <div className="absolute inset-x-2 bottom-2 bg-cyan-600/90 backdrop-blur-sm py-1 rounded-lg text-[9px] font-bold text-center uppercase tracking-widest shadow-lg">Active</div>
                                                )}
                                            </button>
                                        )}

                                        {(project.videoVersions || [])
                                            .filter(ver => ver !== project.generatedVideo)
                                            .map((ver, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedVideoIdx(idx)}
                                                    className={`relative shrink-0 w-40 h-28 rounded-2xl overflow-hidden border-2 transition-all duration-300 group/item ${selectedVideoIdx === idx ? 'border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] scale-[1.02]' : 'border-white/5 opacity-50 hover:opacity-100 hover:border-white/20 bg-black/40'}`}
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

                        {/* Performance Evaluator Card */}
                        {(project.engagementScore > 0 || isEvaluating) ? (
                            <div className="glass-panel p-6 rounded-[2.5rem] border border-cyan-500/20 bg-cyan-500/5 relative overflow-hidden group">
                                {isEvaluating ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                                        <Loader2Icon className="animate-spin text-cyan-500" size={40} />
                                        <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest animate-pulse">Running Predictive Models...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
                                            <SparkleIcon className="size-20 text-cyan-500" />
                                        </div>
                                        <h3 className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                                            <ShieldCheck size={14} /> AI Performance Prediction
                                        </h3>
                                        <div className="flex items-end gap-3 mb-6">
                                            <span className="text-7xl font-black tracking-tighter text-white">
                                                {project.engagementScore}
                                            </span>
                                            <span className="text-cyan-500 font-bold text-xl mb-3">%</span>
                                            <div className="flex-1 h-3 bg-white/10 rounded-full mb-4 relative overflow-hidden">
                                                <div
                                                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000"
                                                    style={{ width: `${project.engagementScore}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="p-5 bg-black/40 border border-white/5 rounded-2xl backdrop-blur-md">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <MessageSquare size={10} /> ROI Optimization Brief
                                            </p>
                                            <p className="text-xs font-bold text-gray-300 leading-relaxed mb-4">
                                                "{project.scoringFeedback}"
                                            </p>
                                            <button
                                                onClick={handleRegenerateWithSuggestion}
                                                disabled={isGenerating}
                                                className="w-full py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 mb-2 disabled:opacity-50"
                                            >
                                                {isGenerating ? <Loader2Icon size={12} className="animate-spin" /> : <SparkleIcon size={12} />}
                                                {isGenerating ? "Generating..." : "Regenerate Image with this feedback (5 Credits)"}
                                            </button>
                                            <button
                                                onClick={handleRegenerateVideoWithSuggestion}
                                                disabled={isGenerating || !project.generatedImage}
                                                className="w-full py-3 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                            >
                                                {isGenerating ? <Loader2Icon size={12} className="animate-spin" /> : <VideoIcon size={12} />}
                                                {isGenerating ? "Generating..." : "Regenerate Video with this feedback (25 Credits)"}
                                            </button>
                                        </div>
                                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] mt-5 text-center">
                                            Confidence Score: Predictive Engine V3.1
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-[2.5rem] border border-white/10 bg-white/5 space-y-4">
                                <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <ShieldCheck size={14} /> AI Performance Prediction
                                </h3>
                                <p className="text-xs text-gray-400 leading-relaxed font-bold">
                                    Get a predictive engagement score and tactical ROI feedback for this ad generation.
                                </p>
                                <button
                                    onClick={handleEvaluate}
                                    className="w-full py-4 rounded-2xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600/30 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                                >
                                    <SparkleIcon size={14} /> Analyze with Creative AI
                                </button>
                            </div>
                        )}

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

                                {/* Client Review Toggle */}
                                <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                                    <button
                                        onClick={async () => {
                                            const token = await getToken();
                                            const { data } = await api.post(`/api/project/${projectId}/review/toggle`, {}, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            setProjectData({ ...project, isReviewEnabled: data.isReviewEnabled });
                                            toast.success(data.message);
                                        }}
                                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[10px] tracking-widest ${project.isReviewEnabled
                                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                            : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                                            }`}
                                    >
                                        <Share2 className="size-4" />
                                        {project.isReviewEnabled ? 'Review Portal Active' : 'Enable Client Review'}
                                    </button>

                                    {project.isReviewEnabled && (
                                        <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3">
                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Client Access Link</p>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    readOnly
                                                    value={`${window.location.origin}/review/${projectId}`}
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] font-bold text-cyan-400 outline-none"
                                                />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(`${window.location.origin}/review/${projectId}`);
                                                        toast.success("Link copied to clipboard!");
                                                    }}
                                                    className="p-2 bg-cyan-600 rounded-lg text-white hover:bg-cyan-500 transition shadow-lg"
                                                >
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Client Reviews Panel */}
                        {project.clientReviews?.length > 0 && (
                            <div className="glass-panel p-6 rounded-2xl space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                        <MessageSquare size={14} />
                                        Client Reviews
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter">
                                        {project.clientReviews.length} {project.clientReviews.length === 1 ? 'Review' : 'Reviews'}
                                    </span>
                                </div>

                                <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                                    {project.clientReviews.map(r => (
                                        <div key={r.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-black text-cyan-400 shrink-0">
                                                    {r.user?.name?.[0]?.toUpperCase() || 'C'}
                                                </div>
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                                                    {r.user?.name || 'Client Reviewer'}
                                                </p>
                                                <span className="ml-auto text-[9px] text-gray-600">
                                                    {new Date(r.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-300 leading-relaxed pl-8">{r.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
                                <div className="flex flex-col gap-3">
                                    <PrimaryButton
                                        onClick={handleGenerateVideo}
                                        disabled={isQueuing}
                                        className="w-full justify-center flex-col gap-1 py-4"
                                    >
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                                            <SparkleIcon className="size-4" />
                                            Generate Now
                                        </div>
                                        <div className="flex items-center gap-1 opacity-60">
                                            <Coins size={10} className="text-yellow-500" />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter">Costs 40 Credits</span>
                                        </div>
                                    </PrimaryButton>

                                    <button
                                        onClick={handleQueueVideo}
                                        disabled={isQueuing}
                                        className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-1"
                                    >
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                            {isQueuing ? <Loader2Icon className="size-3 animate-spin" /> : <Clock className="size-3" />}
                                            Schedule in Pipeline
                                        </div>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tighter italic">Process in Background</span>
                                    </button>
                                </div>
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
