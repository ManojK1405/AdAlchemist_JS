import { useEffect, useState } from "react";
import { Loader2Icon, Sparkles, TrendingUp, Clock, LayoutGrid } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProjectCard from "../components/ProjectCard";
import api from "../configs/axios";

// --- Premium Skeleton Loader ---
const ProjectSkeleton = () => (
    <div className="bg-[#13131a] border border-white/5 rounded-[2rem] overflow-hidden p-0 animate-pulse">
        <div className="aspect-[9/16] bg-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] to-transparent" />
        </div>
        <div className="p-6 space-y-4">
            <div className="h-6 bg-white/5 rounded-lg w-3/4" />
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5" />
                <div className="space-y-2 flex-1">
                    <div className="h-2 bg-white/5 rounded-full w-1/2" />
                    <div className="h-2 bg-white/5 rounded-full w-1/3" />
                </div>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex justify-between">
                <div className="h-4 bg-white/5 rounded-full w-1/4" />
                <div className="h-4 bg-white/5 rounded-full w-1/4" />
            </div>
        </div>
    </div>
);

const Community = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filter, setFilter] = useState('recent'); // 'recent' or 'trending'

    const fetchProjects = async (pageNum = 1, append = false) => {
        try {
            if (!append) setLoading(true);
            const endpoint = filter === 'trending' ? `/api/project/trending?page=${pageNum}` : `/api/project/published?page=${pageNum}`;
            const { data } = await api.get(endpoint);
            if (!data) throw new Error("No data received");

            if (append) {
                setProjects(prev => [...prev, ...data.projects]);
            } else {
                setProjects(data.projects);
            }

            if (data.projects.length < (data.limit || 20)) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        setPage(1);
        setHasMore(true);
        fetchProjects(1, false);
    }, [filter]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchProjects(nextPage, true);
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0, scale: 0.98 },
        visible: {
            y: 0,
            opacity: 1,
            scale: 1,
            transition: { type: "spring", stiffness: 300, damping: 25 }
        }
    };

    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28 selection:bg-cyan-500/30 overflow-x-hidden">
            <div className="max-w-[1600px] mx-auto">
                <header className="mb-20 relative px-4 md:px-0">
                    <div className="absolute top-[-100%] right-[-10%] w-[800px] h-[800px] bg-cyan-500/[0.03] blur-[150px] rounded-full pointer-events-none -z-10" />
                    
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 text-cyan-400 text-[11px] font-black uppercase tracking-[0.4em] mb-8"
                    >
                        <LayoutGrid size={15} className="text-cyan-500/80" />
                        Decentralized Feed
                    </motion.div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-6xl md:text-9xl font-black mb-10 tracking-tight leading-[0.9]"
                    >
                        Collective <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-600 italic drop-shadow-[0_0_40px_rgba(6,182,212,0.2)]">Lab.</span>
                    </motion.h1>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 border-b border-white/5 pb-16">
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-500 max-w-2xl text-xl font-medium leading-relaxed"
                        >
                            The source of truth for elite AI generations. High-fidelity results from the world's most advanced creative engines.
                        </motion.p>

                        <div className="flex items-center p-2 bg-white/[0.03] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] shadow-3xl shrink-0 group hover:border-white/10 transition-colors duration-500">
                            <button
                                onClick={() => setFilter('recent')}
                                className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] transition-all duration-700 ${filter === 'recent' ? 'bg-white text-black shadow-2xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest'}`}
                            >
                                <Clock size={18} strokeWidth={3} className={filter === 'recent' ? "text-cyan-600" : ""} />
                                <span className={filter === 'recent' ? "font-black text-[11px] uppercase tracking-widest" : ""}>Recent</span>
                            </button>
                            <button
                                onClick={() => setFilter('trending')}
                                className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] transition-all duration-700 relative ${filter === 'trending' ? 'bg-cyan-500 text-black shadow-2xl scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5 text-[11px] font-bold uppercase tracking-widest'}`}
                            >
                                <TrendingUp size={18} strokeWidth={3} />
                                <span className={filter === 'trending' ? "font-black text-[11px] uppercase tracking-widest" : ""}>Trending</span>
                                {filter === 'trending' && (
                                    <span className="absolute -top-1 -right-1 px-2 py-0.5 bg-fuchsia-600 text-[9px] font-black text-white rounded-full border-2 border-[#0a0a0f] animate-pulse">FIRE</span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {loading && page === 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 px-4 md:px-0">
                        {[...Array(8)].map((_, i) => <ProjectSkeleton key={i} />)}
                    </div>
                ) : (
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="px-4 md:px-0"
                    >
                        <div className="space-y-16">
                            {projects.length === 0 ? (
                                <div className="text-center py-40 border border-white/5 rounded-[3rem] bg-white/[0.01]">
                                    <Sparkles className="mx-auto size-12 text-gray-700 mb-6 opacity-20" />
                                    <p className="text-gray-600 font-bold uppercase tracking-[0.3em] text-sm">Waiting for incoming transmission...</p>
                                </div>
                            ) : (
                                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8">
                                    <AnimatePresence mode="popLayout">
                                        {projects.map((project, index) => (
                                            <motion.div 
                                                key={project.id} 
                                                variants={itemVariants}
                                                layout
                                                className="break-inside-avoid relative"
                                            >
                                                <ProjectCard gen={project} setGenerations={setProjects} forCommunity={true} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}

                            {hasMore && (
                                <div className="flex justify-center py-24 mb-20 border-t border-white/5">
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleLoadMore}
                                        disabled={loading}
                                        className="group relative px-20 py-7 bg-white/[0.02] hover:bg-cyan-500 text-gray-400 hover:text-black border border-white/10 hover:border-cyan-400 rounded-[2rem] transition-all duration-700 disabled:opacity-30 disabled:cursor-wait font-black uppercase tracking-[0.5em] text-[10px]"
                                    >
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="relative flex items-center justify-center gap-4">
                                            {loading ? (
                                                <>
                                                    <Loader2Icon className="size-5 animate-spin" />
                                                    Decrypting...
                                                </>
                                            ) : (
                                                'Request More Intelligence'
                                            )}
                                        </span>
                                    </motion.button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default Community;
