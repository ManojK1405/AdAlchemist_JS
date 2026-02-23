import { useEffect, useState } from "react";
import { Loader2Icon, Sparkles } from "lucide-react";
import ProjectCard from "../components/ProjectCard";
import api from "../configs/axios";


const Community = () => {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            const { data } = await api.get("/api/project/published");
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
    }, [])


    return loading ? (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2Icon className="size-10 animate-spin text-indigo-500" />
        </div>
    ) : (
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
                </header>

                <div className="grid grid-cols-1 gap-12 items-start">
                    <div className="space-y-8">
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} gen={project} setGenerations={setProjects} forCommunity={true} />
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default Community
