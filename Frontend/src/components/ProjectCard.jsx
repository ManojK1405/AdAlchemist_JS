import { useNavigate } from "react-router-dom"
import { useState } from "react"
import { EllipsisIcon, Heart, ImageIcon, Loader2Icon, MessageCircle, Share2Icon, Trash2Icon, VideoIcon, Coins, Copy } from "lucide-react"
import { PrimaryButton } from "./Buttons"
import { useAuth, useUser } from "@clerk/clerk-react"
import toast from "react-hot-toast"
import api from "../configs/axios"
import CommentSection from "./CommentSection"


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

    const isLiked = gen.projectLikes?.some(l => l.userId === user?.id)

    const handleDelete = async (id) => {
        const confirm = window.confirm('Are you sure you want to delete this project?');
        if (!confirm) return;

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

        const confirm = window.confirm(`Tip 5 credits to ${gen.user?.name || 'this creator'}?`);
        if (!confirm) return;

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


    return (
        <div key={gen.id} className="mb-6 break-inside-avoid animate-in fade-in zoom-in-95 duration-500">
            <div className="bg-[#13131a] border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/10 transition-all duration-300 group shadow-xl hover:shadow-cyan-500/5">

                {/* preview image */}
                <div className={`${gen?.aspectRatio === '9:16' ? 'aspect-9/16' : 'aspect-video'} relative overflow-hidden`}>

                    {gen.generatedImage && (
                        <img
                            src={gen.generatedImage}
                            alt={gen.productName}
                            className={`absolute inset-0 w-full h-full object-cover transition duration-700 ${gen.generatedVideo ? 'group-hover:opacity-0' : 'group-hover:scale-110'}`}
                        />
                    )}

                    {gen.generatedVideo && (
                        <video
                            src={gen.generatedVideo}
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-700"
                            onMouseEnter={(e) => e.currentTarget.play()}
                            onMouseLeave={(e) => e.currentTarget.pause()}
                        />
                    )}

                    {(!gen?.generatedImage && !gen?.generatedVideo) && (
                        <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Loader2Icon className="size-8 animate-spin text-cyan-500" />
                        </div>
                    )}

                    <div className="absolute left-4 top-4 flex gap-2 items-center">
                        {gen.isGenerating && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-full backdrop-blur-md">
                                Generating
                            </span>
                        )}
                        {gen.isPublished && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 bg-green-500/20 text-green-500 border border-green-500/20 rounded-full backdrop-blur-md">
                                Live
                            </span>
                        )}
                    </div>

                    {/*Actions for creator*/}
                    {!forCommunity && (
                        <div className="absolute right-4 top-4 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2"  >

                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen((prev) => !prev)}
                                    className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-2 hover:bg-black/80 transition-colors"
                                >
                                    <EllipsisIcon size={18} />
                                </button>

                                <ul className={`absolute right-0 mt-3 text-xs ${menuOpen ? 'block' : 'hidden'} overflow-hidden w-48 bg-[#1a1a1f] backdrop-blur-xl text-white border border-white/10 rounded-2xl shadow-2xl py-2 z-20 animate-in fade-in slide-in-from-top-2`}>
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
                            <h3 className="font-bold text-xl text-white/90 group-hover:text-white transition-colors">
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
                                <button
                                    onClick={handleTip}
                                    className="flex items-center gap-1.5 transition-colors text-gray-500 hover:text-yellow-400"
                                >
                                    <Coins size={20} />
                                    <span className="text-xs font-bold">Tip</span>
                                </button>
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

                        {!forCommunity && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate(`/result/${gen.id}`)}
                                    className="p-2 text-gray-500 hover:text-white transition-colors"
                                >
                                    <ImageIcon size={18} />
                                </button>
                                <PrimaryButton
                                    onClick={() => togglePublish(gen.id)}
                                    className="text-[10px] py-1.5 px-4 rounded-full"
                                >
                                    {gen.isPublished ? 'Unpublish' : 'Publish'}
                                </PrimaryButton>
                            </div>
                        )}
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
        </div>
    )
}

export default ProjectCard
