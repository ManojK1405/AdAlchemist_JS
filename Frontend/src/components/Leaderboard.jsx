import { useState, useEffect } from 'react';
import { Trophy, Crown, Heart, Coins, Loader2Icon } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';

const Leaderboard = () => {
    const [data, setData] = useState({ topLiked: [], topTipped: [] });
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
            <div className="flex items-center justify-center p-24">
                <div className="relative">
                    <Loader2Icon className="animate-spin text-cyan-500" size={40} />
                    <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-in fade-in slide-in-from-right-4 duration-1000">
            {/* Top Liked Creators */}
            <section className="relative">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-pink-500/10 rounded-2xl text-pink-500 border border-pink-500/20 shadow-xl shadow-pink-500/5">
                        <Heart size={24} fill="currentColor" className="animate-pulse" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Engagement Titans</h3>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Community Resonance Index</p>
                    </div>
                </div>
                
                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl pointer-events-none" />
                    
                    {data.topLiked.map((creator, index) => (
                        <div
                            key={creator.id}
                            className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-all duration-500 group relative ${index === 0 ? 'bg-pink-500/[0.03]' : ''}`}
                        >
                            {index === 0 && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.4)]" />
                            )}
                            
                            <div className="flex items-center gap-5">
                                <div className="w-10 flex justify-center text-sm font-black text-gray-400 group-hover:text-pink-400 transition-colors">
                                    {index === 0 ? <Crown className="text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" size={22} /> : index + 1}
                                </div>
                                <div className="w-12 h-12 rounded-[1.25rem] border border-white/10 overflow-hidden bg-black shadow-2xl relative">
                                    <img src={creator.image || 'https://via.placeholder.com/48'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" alt={creator.name} />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.25rem]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-white uppercase tracking-widest text-xs group-hover:text-pink-300 transition-colors">{creator.name}</span>
                                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Prime Architect</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 text-pink-400 font-black text-sm drop-shadow-[0_0_8px_rgba(236,72,153,0.2)]">
                                    {creator._count.projectLikes}
                                    <Heart size={16} fill="currentColor" />
                                </div>
                                <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Total Resonance</span>
                            </div>
                        </div>
                    ))}
                    {data.topLiked.length === 0 && (
                        <div className="p-12 text-center">
                            <Heart size={32} className="mx-auto text-gray-800 mb-4 opacity-20" />
                            <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[10px]">Zero Resonance Detected</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Top Tipped Creators */}
            <section className="relative">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-500 border border-cyan-500/20 shadow-xl shadow-cyan-500/5">
                        <Trophy size={24} className="animate-bounce" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">Value Architects</h3>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">Economic Impact Index</p>
                    </div>
                </div>

                <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />

                    {data.topTipped.map((creator, index) => (
                        <div
                            key={creator.id}
                            className={`flex items-center justify-between p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-all duration-500 group relative ${index === 0 ? 'bg-cyan-500/[0.03]' : ''}`}
                        >
                            {index === 0 && (
                                <div className="absolute left-0 top-0 w-1 h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
                            )}

                            <div className="flex items-center gap-5">
                                <div className="w-10 flex justify-center text-sm font-black text-gray-400 group-hover:text-cyan-400 transition-colors">
                                    {index === 0 ? <Trophy className="text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" size={22} /> : index + 1}
                                </div>
                                <div className="w-12 h-12 rounded-[1.25rem] border border-white/10 overflow-hidden bg-black shadow-2xl relative">
                                    <img src={creator.image || 'https://via.placeholder.com/48'} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125" alt={creator.name} />
                                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.25rem]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-black text-white uppercase tracking-widest text-xs group-hover:text-cyan-300 transition-colors">{creator.name}</span>
                                    <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Asset Strategist</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2 text-cyan-400 font-black text-sm drop-shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                                    {creator.totalTips}
                                    <Coins size={16} className="text-yellow-500" />
                                </div>
                                <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Neural Credits Earnt</span>
                            </div>
                        </div>
                    ))}
                    {data.topTipped.length === 0 && (
                        <div className="p-12 text-center">
                            <Coins size={32} className="mx-auto text-gray-800 mb-4 opacity-20" />
                            <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[10px]">Zero Transfer Activity</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default Leaderboard;
