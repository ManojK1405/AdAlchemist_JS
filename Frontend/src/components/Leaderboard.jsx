import { useState, useEffect } from 'react';
import { Trophy, Crown, Heart, Coins, Loader2Icon, Sparkles, Copy } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';

const Leaderboard = () => {
    const [data, setData] = useState({ topLiked: [], topTipped: [], trendingPrompts: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const { data } = await api.get('/api/social/leaderboard');
                setData(data);
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2Icon className="animate-spin text-indigo-500" size={24} />
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            {/* Top Liked Creators */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
                        <Heart size={20} fill="currentColor" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Most Popular Creators</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {data.topLiked.map((creator, index) => (
                        <div
                            key={creator.id}
                            className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 flex justify-center text-sm font-bold text-gray-500">
                                    {index === 0 ? <Crown className="text-yellow-500" size={18} /> : index + 1}
                                </div>
                                <img src={creator.image} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={creator.name} />
                                <span className="font-semibold text-gray-200">{creator.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pink-400 font-bold text-sm">
                                {creator._count.projectLikes}
                                <Heart size={14} fill="currentColor" />
                            </div>
                        </div>
                    ))}
                    {data.topLiked.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm italic">No data yet</div>
                    )}
                </div>
            </section>

            {/* Top Tipped Creators */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                        <Trophy size={20} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Top Tipped Creators</h3>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {data.topTipped.map((creator, index) => (
                        <div
                            key={creator.id}
                            className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-8 flex justify-center text-sm font-bold text-gray-500">
                                    {index === 0 ? <Trophy className="text-indigo-400" size={18} /> : index + 1}
                                </div>
                                <img src={creator.image} className="w-10 h-10 rounded-full object-cover border border-white/10" alt={creator.name} />
                                <span className="font-semibold text-gray-200">{creator.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-sm">
                                {creator.totalTips}
                                <Coins size={14} />
                            </div>
                        </div>
                    ))}
                    {data.topTipped.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm italic">No tips received yet</div>
                    )}
                </div>
            </section>

            {/* Trending Prompts */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Trending Prompts</h3>
                </div>
                <div className="space-y-4">
                    {data.trendingPrompts.map((prompt) => (
                        <div
                            key={prompt.id}
                            className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-indigo-500/30 transition-all duration-300"
                        >
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                                    {prompt.productName}
                                </span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(prompt.userPrompt);
                                        toast.success("Prompt copied!");
                                    }}
                                    className="p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 text-gray-400 hover:text-white"
                                >
                                    <Copy size={14} />
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed italic">
                                "{prompt.userPrompt}"
                            </p>
                            <div className="mt-3 flex items-center gap-1 text-[10px] text-gray-600 font-bold">
                                <Heart size={10} fill="currentColor" /> {prompt._count.projectLikes} Likes
                            </div>
                        </div>
                    ))}
                    {data.trendingPrompts.length === 0 && (
                        <div className="p-8 text-center text-gray-500 text-sm italic">No trending prompts</div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Leaderboard;
