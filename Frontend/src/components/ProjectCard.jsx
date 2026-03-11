import { useNavigate } from "react-router-dom"
import { useState, useRef } from "react"
import { EllipsisIcon, Heart, ImageIcon, Loader2Icon, MessageCircle, Share2Icon, Trash2Icon, VideoIcon, Coins, Copy, Play, Info } from "lucide-react"
import { PrimaryButton } from "./Buttons"
import { useAuth, useUser } from "@clerk/clerk-react"
import toast from "react-hot-toast"
import api from "../configs/axios"
import CommentSection from "./CommentSection"
import Modal from "./Modal"
import { optimizeImage, optimizeVideo } from "../utils/cdn"


const ProjectCard = ({
    gen,
    setGenerations,
    forCommunity = false
}) => {

    const { getToken } = useAuth();
    const { user } = useUser();


    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [showComments, setShowComments] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const videoRef = useRef(null)

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const isLiked = gen.projectLikes?.some(l => l.userId === user?.id)

    const handleDelete = async (id) => {
        openConfirm({
            title: "Delete Project",
            message: "Are you sure you want to delete this project? This action cannot be undone.",
            confirmText: "Delete Project",
            cancelText: "Dismiss",
            type: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();

                    // optimistic remove
                    setGenerations?.(prev => prev.filter(gen => gen.id !== id));

                    await api.delete(`/api/project/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    toast.success("Project deleted successfully");

                } catch (error) {
                    toast.error(error?.response?.data?.message || "Delete failed");
                    console.log(error);
                }
            }
        });
    }

    const togglePublish = async (projectId) => {
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/user/projects/${projectId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setGenerations?.((generations) => generations.map((gen) => gen.id === projectId ? { ...gen, isPublished: data.isPublished } : gen));
            toast.success(data.isPublished ? 'Project published' : 'Project unpublished');
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
            console.log(error);
        }
    }

    const toggleLike = async () => {
        if (!user) {
            toast.error('Please login to like projects');
            return;
        }
        try {
            const token = await getToken();
            const { data } = await api.post(`/api/social/projects/${gen.id}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setGenerations?.(prev => prev.map(p => {
                if (p.id === gen.id) {
                    const currentLikes = p.projectLikes || [];
                    return {
                        ...p,
                        projectLikes: data.liked
                            ? [...currentLikes, { id: 'temp', userId: user.id, projectId: p.id }]
                            : currentLikes.filter(l => l.userId !== user.id)
                    };
                }
                return p;
            }));
        } catch (error) {
            toast.error('Failed to update like');
        }
    }

    const handleTip = async () => {
        if (!user) {
            toast.error('Please login to tip creators');
            return;
        }

        openConfirm({
            title: "Support Creator",
            message: `Send 5 credits to ${gen.user?.name || 'this creator'} as a token of appreciation?`,
            confirmText: "Send 5 Credits",
            type: "info",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();
                    await api.post('/api/social/tip', { recipientId: gen.userId, amount: 5 }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('Successfully tipped 5 credits!');
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Failed to tip creator');
                }
            }
        });
    }

    const showTippingRules = (e) => {
        e.stopPropagation();
        toast((t) => (
            <div className="text-xs space-y-2">
                <p className="font-bold underline">Creator Economy Rules:</p>
                <p>• Only <span className="text-cyan-400">Paying Users</span> with <span className="text-cyan-400">5+ Generations</span> can send tips.</p>
                <p>• First 50 credits you receive are <span className="text-green-500">Free</span>.</p>
                <p>• After 50 credits, a <span className="text-yellow-500">20% Maintenance Fee</span> applies to incoming tips.</p>
            </div>
        ), { duration: 5000, icon: '🛡️' });
    }


    const handleToggleVideo = (e) => {
        if (e && e.target.closest('button')) return;
        if (!gen.generatedVideo || !videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
        } else {
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') console.error('Video play error:', err);
                });
            }
            setIsPlaying(true);
        }
    };

    const handleMouseEnter = () => {
        if (window.matchMedia("(hover: hover)").matches) {
            if (!gen.generatedVideo || !videoRef.current) return;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    if (err.name !== 'AbortError') console.error('Video play error:', err);
                });
            }
            setIsPlaying(true);
        }
    };

    const handleMouseLeave = () => {
        if (!gen.generatedVideo || !videoRef.current) return;
        videoRef.current.pause();
        setIsPlaying(false);
    };

    return (
        <div key={gen.id} className="mb-6 break-inside-avoid animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-[#13131a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all duration-300 group shadow-xl hover:shadow-cyan-500/5">

                {/* preview image */}
                <div
                    className={`${gen?.aspectRatio === '9:16' ? 'aspect-[9/16]' : gen?.aspectRatio === '1:1' ? 'aspect-square' : 'aspect-video'} relative overflow-hidden cursor-pointer`}
                    onClick={handleToggleVideo}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >

                    {gen.generatedImage && (
                        <img
                            src={optimizeImage(gen.generatedImage, { width: 500, quality: 'auto:eco' })}
                            alt={gen.productName}
                            className={`absolute inset-0 w-full h-full object-cover transition duration-700 ${(gen.generatedVideo && isPlaying) ? 'opacity-0' : 'opacity-100 group-hover:scale-110'}`}
                            loading="lazy"
                        />
                    )}

                    {gen.generatedVideo && (
                        <>
                            <video
                                ref={videoRef}
                                src={optimizeVideo(gen.generatedVideo)}
                                muted
                                loop
                                playsInline
                                className={`absolute inset-0 w-full h-full object-cover transition duration-700 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}
                            />
                            {!isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none md:hidden z-10">
                                    <div className="w-12 h-12 bg-black/50 backdrop-blur text-white flex items-center justify-center rounded-full border border-white/20 shadow-xl">
                                        <Play fill="white" size={20} className="ml-1 opacity-80" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {(!gen?.generatedImage && !gen?.generatedVideo) && (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Loader2Icon className="size-8 animate-spin text-cyan-500" />
                        </div>
                    )}

                    {/* Actions Overlay */}
                    {!forCommunity && (
                        <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] pointer-events-none group-hover:pointer-events-auto">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/result/${gen.id}`);
                                }}
                                className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-full shadow-2xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                Show More Details
                            </button>
                        </div>
                    )}

                    <div className="absolute left-4 top-4 flex gap-2 items-center z-20">
                        {gen.isGenerating && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-full backdrop-blur-md">
                                Generating
                            </span>
                        )}
                        {gen.isPublished && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-cyan-500/20 text-cyan-500 border border-cyan-500/20 rounded-full backdrop-blur-md">
                                Live
                            </span>
                        )}
                    </div>

                    {/* Management Controls Group (Top Right) */}
                    {!forCommunity && (
                        <div className="absolute right-4 top-4 flex items-center gap-3 z-20 sm:opacity-0 group-hover:opacity-100 transition-all duration-300">

                            {/* Publish Slash Toggle */}
                            <div className="flex items-center gap-1.5 p-1 bg-black/40 backdrop-blur-md border border-white/5 rounded-full px-2">
                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter hidden xs:inline">
                                    {gen.isPublished ? 'Live' : 'Hidden'}
                                </span>
                                <button
                                    onClick={() => togglePublish(gen.id)}
                                    className={`relative inline-flex h-4 w-8 items-center rounded-full transition-all duration-300 focus:outline-none ${gen.isPublished ? 'bg-cyan-500' : 'bg-white/20'}`}
                                >
                                    <span
                                        className={`${gen.isPublished ? 'translate-x-4' : 'translate-x-0'} inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-300`}
                                    />
                                </button>
                            </div>

                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 hover:bg-black/80 transition-colors"
                                >
                                    <EllipsisIcon size={16} />
                                </button>

                                <ul className={`absolute right-0 mt-3 text-xs ${menuOpen ? 'block' : 'hidden'} overflow-hidden w-48 bg-[#1a1a1f] backdrop-blur-xl text-white border border-white/10 rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in slide-in-from-top-2`}>
                                    {gen.generatedImage && (
                                        <a href={gen.generatedImage} download className="flex gap-3 items-center px-4 py-2.5 hover:bg-white/5 transition-colors">
                                            <ImageIcon size={14} className="text-gray-400" />
                                            Download Image
                                        </a>
                                    )}

                                    {gen.generatedVideo && (
                                        <a href={gen.generatedVideo} download className="flex gap-3 items-center px-4 py-2.5 hover:bg-white/5 transition-colors">
                                            <VideoIcon size={14} className="text-gray-400" />
                                            Download Video
                                        </a>
                                    )}

                                    {(gen.generatedVideo || gen.generatedImage) && (
                                        <button onClick={() => navigator.share({ url: gen.generatedVideo || gen.generatedImage, title: gen.productName, text: gen.productDescription })} className="w-full flex gap-3 items-center px-4 py-2.5 hover:bg-white/5 transition-colors">
                                            <Share2Icon size={14} className="text-gray-400" />
                                            Share
                                        </button>
                                    )}

                                    <div className="h-px bg-white/5 my-1" />

                                    <button onClick={() => handleDelete(gen.id)} className="w-full flex gap-3 items-center px-4 py-2.5 hover:bg-red-500/10 text-red-400 transition-colors">
                                        <Trash2Icon size={14} />
                                        Delete Project
                                    </button>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Source Images */}
                    <div className="absolute left-4 bottom-4 flex -space-x-4">
                        <div className="w-14 h-14 rounded-full border-2 border-[#13131a] overflow-hidden shadow-2xl transform hover:scale-110 transition-transform cursor-pointer">
                            <img src={gen.uploadedImages[0]?.replace('/upload/', '/upload/f_auto,q_auto/')} className="w-full h-full object-cover" alt="Source 1" />
                        </div>
                        <div className="w-14 h-14 rounded-full border-2 border-[#13131a] overflow-hidden shadow-2xl transform hover:scale-110 transition-transform cursor-pointer" style={{ transitionDelay: '50ms' }}>
                            <img src={gen.uploadedImages[1]?.replace('/upload/', '/upload/f_auto,q_auto/')} className="w-full h-full object-cover" alt="Source 2" />
                        </div>
                    </div>

                </div>

                {/* Details */}
                <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            <h3
                                onClick={() => !forCommunity && navigate(`/result/${gen.id}`)}
                                className={`font-bold text-xl text-white/90 transition-colors ${!forCommunity ? 'group-hover:text-cyan-400 cursor-pointer hover:underline decoration-cyan-500/50 underline-offset-4' : ''}`}
                            >
                                {gen.productName}
                            </h3>

                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                                    <span className="text-xs font-bold text-cyan-400">{gen.user?.name?.[0] || 'A'}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider leading-none">{gen.user?.name || 'AdAlchemist'}</span>
                                    <span className="text-[8px] text-gray-700 font-bold uppercase mt-1 leading-none">{new Date(gen.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                            <span className="text-[10px] font-bold px-3 py-1 bg-white/5 border border-white/5 text-gray-400 rounded-full uppercase tracking-tighter">
                                {gen.aspectRatio}
                            </span>
                        </div>
                    </div>

                    {gen.productDescription && (
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 italic font-light">"{gen.productDescription}"</p>
                        </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                        <div className="flex items-center gap-4">
                            {!forCommunity && (
                                <button
                                    onClick={() => navigate(`/result/${gen.id}`)}
                                    className="flex sm:hidden items-center gap-1.5 transition-all duration-300 text-gray-500 hover:text-cyan-400"
                                    title="View Details"
                                >
                                    <Info size={20} />
                                    <span className="text-xs font-bold">Details</span>
                                </button>
                            )}
                            <button
                                onClick={toggleLike}
                                className={`flex items-center gap-1.5 transition-all duration-300 ${isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                            >
                                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110' : ''} />
                                <span className="text-xs font-bold">{gen.projectLikes?.length || 0}</span>
                            </button>
                            <button
                                onClick={() => setShowComments(!showComments)}
                                className={`flex items-center gap-1.5 transition-colors ${showComments ? 'text-cyan-400' : 'text-gray-500 hover:text-cyan-400'}`}
                            >
                                <MessageCircle size={20} />
                                <span className="text-xs font-bold">{gen.comments?.length || 0}</span>
                            </button>
                            {user?.id !== gen.userId && (
                                <div className="flex items-center gap-1 group/tip">
                                    <button
                                        onClick={handleTip}
                                        className="flex items-center gap-1.5 transition-colors text-gray-500 hover:text-yellow-400"
                                    >
                                        <Coins size={20} />
                                        <span className="text-xs font-bold">Tip</span>
                                    </button>
                                    <button onClick={showTippingRules} className="text-gray-700 hover:text-white transition-colors">
                                        <Info size={12} />
                                    </button>
                                </div>
                            )}
                            {gen.userPrompt && (
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(gen.userPrompt);
                                        toast.success("Prompt copied to clipboard!");
                                    }}
                                    className="flex items-center gap-1.5 transition-colors text-gray-500 hover:text-cyan-400"
                                    title="Copy Prompt"
                                >
                                    <Copy size={18} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expanding Comment Section */}
                    {showComments && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                            <CommentSection
                                projectId={gen.id}
                                ownerId={gen.userId}
                                onCommentsChanged={(newCount) => {
                                    setGenerations?.(prev => prev.map(p => {
                                        if (p.id === gen.id) {
                                            return {
                                                ...p,
                                                comments: new Array(newCount).fill({}) // sync count
                                            }
                                        }
                                        return p;
                                    }))
                                }}
                            />
                        </div>
                    )}

                </div>

            </div>

            <Modal {...modalConfig} onClose={closeModal} />
        </div>
    )
}

export default ProjectCard
