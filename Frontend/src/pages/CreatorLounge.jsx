import DiscussionPanel from "../components/DiscussionPanel";
import { Sparkles } from "lucide-react";

const CreatorLounge = () => {
    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28 selection:bg-indigo-500/30">
            <div className="max-w-4xl mx-auto">
                <header className="mb-12 relative flex flex-col items-center text-center">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-[0.3em] mb-4">
                        <Sparkles size={14} />
                        Discussions
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter">Creator <span className="text-indigo-500">Lounge.</span></h1>
                    <p className="text-gray-500 max-w-xl text-md font-light leading-relaxed">
                        Share ideas, ask questions, and collaborate with fellow creators.
                    </p>
                </header>

                <DiscussionPanel />
            </div>
        </div>
    )
}

export default CreatorLounge;
