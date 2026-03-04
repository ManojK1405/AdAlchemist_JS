import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    MessageCircle,
    ShieldCheck,
    Share2,
    Send,
    User,
    CheckCircle2,
    Lock,
    Loader2
} from "lucide-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";

const SharedReview = () => {
    const { projectId } = useParams();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchReviewData = async () => {
            try {
                const { data } = await api.get(`/api/project/review/${projectId}`);
                setProject(data);
            } catch (error) {
                toast.error(error.response?.data?.message || "Link expired or access denied.");
            } finally {
                setLoading(false);
            }
        };
        fetchReviewData();
    }, [projectId]);

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setIsSubmitting(true);
        try {
            await api.post(`/api/social/comments`, {
                projectId,
                content: comment,
                isClientReview: true
            });
            toast.success("Feedback submitted!");
            setComment("");
            // Refresh comments
            const { data } = await api.get(`/api/project/review/${projectId}`);
            setProject(data);
        } catch (error) {
            toast.error("Failed to post comment. Guest comments might require login if configured.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-500" size={40} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
                <Lock className="text-gray-700 mb-6" size={80} />
                <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Review Access Revoked</h1>
                <p className="text-gray-500 max-w-sm mt-4 text-sm font-bold">This sharing link has been deactivated by the creator or the project is no longer available.</p>
            </div>
        );
    }

    const { user, brandLogo } = project;
    const bk = user?.brandKit;

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* White Label Header */}
            <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {bk?.logoLight || bk?.logoDark ? (
                        <img src={bk.logoLight || bk.logoDark} className="h-8 object-contain" alt="Provider Logo" />
                    ) : (
                        <div className="px-3 py-1 bg-cyan-600 rounded-lg text-[10px] font-black uppercase tracking-widest">AdAlchemist Proofing</div>
                    )}
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Client Review Portal</span>
                </div>

                <div className="hidden md:flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 uppercase">Shared By</p>
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">{user?.name || "The Creator"}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12 lg:p-20 grid grid-cols-1 lg:grid-cols-12 gap-12">

                {/* Visual Preview */}
                <div className="lg:col-span-8 flex flex-col gap-8">
                    <div className="bg-[#0A0A0A] rounded-[3rem] p-4 border border-white/5 shadow-2xl overflow-hidden relative group">
                        <div className={`mx-auto rounded-[2rem] overflow-hidden bg-black ${project.aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-video w-full'}`}>
                            {project.generatedVideo ? (
                                <video src={project.generatedVideo} controls autoPlay loop className="w-full h-full object-cover" />
                            ) : (
                                <img src={project.generatedImage} className="w-full h-full object-cover" alt="Preview" />
                            )}
                        </div>
                    </div>

                    <div className="px-8 space-y-4">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-white/90">{project.productName}</h1>
                        <p className="text-gray-500 text-sm font-medium leading-relaxed max-w-2xl">{project.productDescription}</p>

                        <div className="flex flex-wrap gap-4 pt-4">
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                                <CheckCircle2 size={16} className="text-green-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ready for Final Polish</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
                                <ShieldCheck size={16} className="text-cyan-500" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">AI Composition Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collaborative Sidebar */}
                <div className="lg:col-span-4 flex flex-col h-full space-y-8">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-8 flex flex-col h-[700px] shadow-2xl sticky top-32">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-[11px] font-black text-cyan-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <MessageCircle size={18} /> Feedback Log
                            </h2>
                            <span className="text-[10px] font-bold text-gray-600 uppercase bg-white/5 px-2 py-0.5 rounded-full">{project.comments?.length || 0} Events</span>
                        </div>

                        {/* Comments Flow */}
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-hide mb-8">
                            {project.comments?.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 text-center">
                                    <Send size={32} />
                                    <p className="text-xs font-bold uppercase tracking-widest">No feedback yet.<br />Start the thread below.</p>
                                </div>
                            ) : (
                                project.comments.map(c => (
                                    <div key={c.id} className="space-y-3">
                                        <div className="flex items-start gap-4">
                                            <div className="size-8 rounded-full bg-linear-to-b from-white/10 to-transparent flex items-center justify-center text-xs font-black ring-1 ring-white/5 shrink-0">
                                                {c.user?.name?.[0] || <User size={14} />}
                                            </div>
                                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-tl-none flex-1">
                                                <p className="text-[9px] font-black text-gray-500 uppercase mb-1">{c.user?.name || "Client Reviewer"}</p>
                                                <p className="text-xs font-medium text-gray-300 leading-relaxed">{c.content}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Composer */}
                        <form onSubmit={handleComment} className="mt-auto relative group">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add technical feedback or approve scene..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-medium outline-none focus:border-cyan-500 transition-all resize-none h-32 pr-20"
                            />
                            <button
                                type="submit"
                                disabled={isSubmitting || !comment.trim()}
                                className="absolute bottom-4 right-4 p-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 disabled:opacity-50 transition-all active:scale-95"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            </button>
                        </form>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default SharedReview;
