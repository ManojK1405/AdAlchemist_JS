import { useEffect, useState } from "react";
import { Loader2Icon, Sparkles, TrendingUp, Clock } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import api from "../configs/axios";


const Community = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('recent'); // 'recent' or 'trending'

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const endpoint = filter === 'trending' ? "/api/project/trending" : "/api/project/published";
            const { data } = await api.get(endpoint);
            if (!data) throw new Error("No data received");
            setProjects(data.projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProjects();
    }, [filter]);


    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28 selection:bg-cyan-500/30">
            <div className="max-w-7xl mx-auto">
                <header className="mb-20 relative text-center md:text-left">
                    <div className="absolute top-[-50%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />
                    
                    <div className="flex items-center justify-center md:justify-start gap-2 text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] mb-6">
                        <Sparkles size={14} className="animate-pulse" />
                        Global Intelligence Feed
                    </div>
                    
                    <h1 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter leading-none">
                        Community <span className="text-cyan-500 italic drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">Hall.</span>
                    </h1>
                    
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 border-b border-white/5 pb-12">
                        <p className="text-gray-500 max-w-xl text-lg font-medium leading-relaxed">
                            The epicenter of AI-driven creativity. Explore, analyze, and remix professional generations from the global collective.
                        </p>

                        <div className="flex items-center p-1.5 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] shadow-2xl shrink-0 group">
                            <button
                                onClick={() => setFilter('recent')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] transition-all duration-500 ${filter === 'recent' ? 'bg-white text-black shadow-[0_0_25px_rgba(255,255,255,0.2)] scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                <Clock size={18} strokeWidth={filter === 'recent' ? 3 : 2} />
                                <span className="font-black text-[10px] uppercase tracking-widest">Recent Feed</span>
                            </button>
                            <button
                                onClick={() => setFilter('trending')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] transition-all duration-500 relative ${filter === 'trending' ? 'bg-cyan-500 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-105' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                                {filter === 'trending' && (
                                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-fuchsia-600 text-[8px] font-black text-white rounded-full animate-bounce">HOT</span>
                                )}
                                <TrendingUp size={18} strokeWidth={filter === 'trending' ? 3 : 2} />
                                <span className="font-black text-[10px] uppercase tracking-widest">Trending Now</span>
                            </button>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2Icon className="size-10 animate-spin text-cyan-500" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-12 items-start">
                        <div className="space-y-8">
                            {projects.length === 0 ? (
                                <div className="text-center py-20 text-gray-500">
                                    No projects found.
                                </div>
                            ) : (
                                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                                    {projects.map((project) => (
                                        <ProjectCard key={project.id} gen={project} setGenerations={setProjects} forCommunity={true} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Community
