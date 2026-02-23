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
        <div className="min-h-screen text-white p-6 md:p-12 mt-28 selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto">
                <header className="mb-16 relative">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                        <Sparkles size={14} />
                        Showcase
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Community <span className="text-indigo-500">Hall.</span></h1>
                    <p className="text-gray-500 max-w-2xl text-lg font-light leading-relaxed">
                        Witness the evolution of advertising. Explore, learn, and collaborate with creators from around the world using AdAlchemist.
                    </p>
                    <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
                        <button
                            onClick={() => setFilter('recent')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${filter === 'recent' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Clock size={16} />
                            <span className="font-medium text-sm">Most Recent</span>
                        </button>
                        <button
                            onClick={() => setFilter('trending')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition ${filter === 'trending' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <TrendingUp size={16} />
                            <span className="font-medium text-sm">Trending Now</span>
                        </button>
                    </div>

                </header>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2Icon className="size-10 animate-spin text-indigo-500" />
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
