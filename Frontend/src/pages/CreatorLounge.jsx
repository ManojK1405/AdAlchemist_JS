import DiscussionPanel from "../components/DiscussionPanel";
import Leaderboard from "../components/Leaderboard";
import { Sparkles, Trophy } from "lucide-react";

const CreatorLounge = () => {
    return (
        <div className="relative min-h-screen text-white p-6 md:p-12 mt-28 selection:bg-cyan-500/30 overflow-hidden">
            {/* Premium Background Elements */}
            <div className="absolute top-0 left-[-10%] w-[600px] h-[600px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-fuchsia-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />

            <div className="max-w-7xl mx-auto relative">
                <header className="mb-20 relative flex flex-col items-center text-center">
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] mb-8 shadow-2xl shadow-cyan-500/10">
                        <Sparkles size={14} className="animate-pulse" />
                        Neural Synergy Hub
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter leading-none">
                        Creator <span className="text-cyan-500 italic drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">Lounge.</span>
                    </h1>
                    <p className="text-gray-500 max-w-2xl text-lg font-medium leading-relaxed opacity-80">
                        The epicenter of collaborative intelligence. Exchange blueprints, debug prompts, and architect the future of AI media.
                    </p>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    {/* Left Side: Discussions */}
                    <div className="lg:col-span-2 space-y-8">
                        <DiscussionPanel />
                    </div>

                    {/* Right Side: Leaderboard */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-28">
                            <Leaderboard />
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    )
}

export default CreatorLounge;
