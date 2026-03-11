import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { MessageCircle, Plus, Users, ArrowRight, Sparkles, Search, Trash2, Coins, Info, ChevronUp, ChevronDown } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';
import Modal from './Modal';

const DiscussionPanel = () => {
    const { getToken } = useAuth();
    const { user: clerkUser } = useUser();
    const [discussions, setDiscussions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const scrollRef = useRef(null);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const amount = direction === 'up' ? -300 : 300;
            scrollRef.current.scrollBy({ top: amount, behavior: 'smooth' });
        }
    };

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const fetchDiscussions = async () => {
        try {
            const { data } = await api.get('/api/social/discussions');
            setDiscussions(data);
        } catch (error) {
            console.error('Error fetching discussions:', error);
        }
    };

    useEffect(() => {
        fetchDiscussions();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!clerkUser) {
            toast.error('Please login to start a discussion');
            return;
        }
        if (!title.trim() || !content.trim()) return;

        try {
            setLoading(true);
            const token = await getToken();
            await api.post('/api/social/discussions',
                { title, content },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTitle('');
            setContent('');
            setIsCreating(false);
            fetchDiscussions();
            toast.success('Discussion started!');
        } catch (error) {
            toast.error('Failed to start discussion');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        openConfirm({
            title: "Dissolve Thread",
            message: "Are you sure you want to delete this discussion and all its contributions? This action is permanent.",
            confirmText: "Dissolve",
            type: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();
                    await api.delete(`/api/social/discussions/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setDiscussions(prev => prev.filter(d => d.id !== id));
                    if (selectedId === id) setSelectedId(null);
                    toast.success("Discussion deleted successfully");
                } catch (error) {
                    toast.error("Failed to delete discussion");
                }
            }
        });
    };

    const handleTip = async (e, discussion) => {
        e.stopPropagation();
        if (!clerkUser) {
            toast.error('Please login to tip creators');
            return;
        }

        openConfirm({
            title: "Reward Insight",
            message: `Send 5 credits to ${discussion.user?.name || 'this creator'} for their contribution?`,
            confirmText: "Send 5 Credits",
            type: "info",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();
                    await api.post('/api/social/tip', { recipientId: discussion.userId, amount: 5 }, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success('Successfully tipped 5 credits!');
                } catch (error) {
                    toast.error(error?.response?.data?.message || 'Failed to tip creator');
                }
            }
        });
    };

    const showTippingRules = (e) => {
        e.stopPropagation();
        toast((t) => (
            <div className="text-xs space-y-2">
                <p className="font-bold underline">Creator Economy Rules:</p>
                <p>• Only <span className="text-cyan-400">Paying Users</span> with <span className="text-cyan-400">5+ Generations</span> can send tips.</p>
                <p>• First 50 credits you receive are <span className="text-green-500">Free</span>.</p>
                <p>• After 50 credits, a <span className="text-yellow-500">20% Maintenance Fee</span> applies to incoming tips.</p>
            </div>
        ), { duration: 5000, icon: '🛡️' });
    }

    const filteredDiscussions = discussions.filter(d => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (d.title && d.title.toLowerCase().includes(term)) ||
            (d.content && d.content.toLowerCase().includes(term));
    });

    const suggestedTopics = ['Tutorials', 'Prompts', 'Feedback', 'Video Generation', 'Help'];

    return (
        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] overflow-hidden h-fit shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />
            
            <div className="p-8 border-b border-white/10 bg-gradient-to-r from-white/[0.02] to-transparent flex items-center justify-between">
                <h3 className="flex items-center gap-4 font-black text-xl uppercase tracking-tighter">
                    <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-xl shadow-cyan-500/10">
                        <Users size={20} className="text-cyan-400" />
                    </div>
                    Intelligence Feed
                </h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-3 px-6 py-3.5 bg-cyan-600 rounded-2xl hover:bg-cyan-500 transition-all duration-500 shadow-xl shadow-cyan-600/20 active:scale-95 group"
                >
                    <Plus size={20} className="text-white transition-transform group-hover:rotate-90" />
                    <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Start Thread</span>
                </button>
            </div>

            <div className="p-8 pb-0">
                <div className="relative mb-8">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search collective intelligence..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-white placeholder-white/20 shadow-inner"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] pl-1">Protocols:</span>
                    {suggestedTopics.map((topic, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSearchTerm(topic)}
                            className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all border ${searchTerm === topic ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'}`}
                        >
                            {topic}
                        </button>
                    ))}
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="text-[10px] text-red-400 hover:text-red-300 ml-2 font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>

                {isCreating && (
                    <form onSubmit={handleCreate} className="p-8 bg-cyan-500/[0.02] border border-cyan-500/20 rounded-[2.5rem] space-y-6 animate-in fade-in zoom-in-95 duration-500 shadow-2xl relative mb-10">
                        <div className="absolute top-0 right-0 p-6 opacity-10 blur-xl pointer-events-none">
                            <Plus size={100} className="text-cyan-500" />
                        </div>
                        <div className="flex items-center gap-3 text-cyan-400 text-[10px] font-black uppercase tracking-[0.4em] pl-1">
                            <Sparkles size={14} className="animate-pulse" />
                            Initialize New Protocol
                        </div>
                        <div className="space-y-4">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Core Subject Directive..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-cyan-500/50 transition-all text-white placeholder-white/20"
                            />
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Input detailed narrative or inquiry..."
                                rows={4}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-cyan-500/50 transition-all resize-none text-white placeholder-white/20"
                            />
                        </div>
                        <div className="flex gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-white text-black py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all hover:bg-cyan-500 active:scale-95 disabled:opacity-50 shadow-xl"
                            >
                                {loading ? 'Synthesizing...' : 'Authorize Thread'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 py-4 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="relative group/feed px-8 pb-8">
                {/* Scroll Buttons */}
                <button 
                    onClick={() => scroll('up')}
                    className="absolute top-2 left-1/2 -translate-x-1/2 z-20 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-cyan-500 hover:border-cyan-500 opacity-0 md:opacity-20 group-hover/feed:opacity-100 transition-all duration-500 shadow-2xl"
                >
                    <ChevronUp size={16} />
                </button>
                <button 
                    onClick={() => scroll('down')}
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 p-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-full text-white/40 hover:text-white hover:bg-cyan-500 hover:border-cyan-500 opacity-0 md:opacity-20 group-hover/feed:opacity-100 transition-all duration-500 shadow-2xl"
                >
                    <ChevronDown size={16} />
                </button>

                <div 
                    ref={scrollRef}
                    className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar relative scroll-smooth pr-2"
                >

                {filteredDiscussions.length === 0 ? (
                    <div className="text-center py-20 bg-white/[0.01] rounded-[2rem] border border-dashed border-white/5">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <MessageCircle size={28} className="text-white/20" />
                        </div>
                        <p className="text-white/40 font-medium text-sm">Silence is loud here.</p>
                        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-2">Start the first thread</p>
                    </div>
                ) : (
                    filteredDiscussions.map(discussion => (
                        <div
                            key={discussion.id}
                            className={`group p-8 rounded-[2.5rem] border transition-all duration-700 cursor-pointer relative overflow-hidden ${selectedId === discussion.id
                                ? 'bg-cyan-500/[0.03] border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.1)]'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04] shadow-lg'
                                }`}
                            onClick={() => setSelectedId(selectedId === discussion.id ? null : discussion.id)}
                        >
                            {selectedId === discussion.id && (
                                <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
                            )}
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <h4 className="font-black text-lg md:text-xl text-white group-hover:text-cyan-400 transition-colors leading-tight tracking-tighter">
                                        {discussion.title}
                                    </h4>
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">
                                            {new Date(discussion.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        <span className="w-1 h-1 bg-white/10 rounded-full" />
                                        <span className="text-[9px] font-black text-cyan-500/40 uppercase tracking-[0.2em]">Live Session</span>
                                    </div>
                                </div>
                                {clerkUser?.id === discussion.userId && (
                                    <button
                                        onClick={(e) => handleDelete(e, discussion.id)}
                                        className="p-2 text-white/20 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-xl"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>

                            <p className={`text-sm text-gray-400 font-medium leading-relaxed mb-8 transition-all duration-700 ${selectedId === discussion.id ? '' : 'line-clamp-2'}`}>
                                {discussion.content}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-[1.25rem] border border-white/10 overflow-hidden bg-black shadow-2xl relative group/avatar">
                                        <img src={discussion.user?.image || 'https://via.placeholder.com/48'} className="w-full h-full object-cover transition-transform duration-700 group-hover/avatar:scale-125" alt="" />
                                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[1.25rem]" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">{discussion.user?.name || 'Creator'}</span>
                                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Contributor DNA</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    {clerkUser?.id !== discussion.userId && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleTip(e, discussion)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500/5 border border-yellow-500/20 rounded-full text-yellow-500 hover:bg-yellow-500 hover:text-black transition-all duration-500 text-[9px] font-black uppercase tracking-widest"
                                            >
                                                <Coins size={14} />
                                                Reward
                                            </button>
                                            <button onClick={showTippingRules} className="p-2 text-white/10 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10">
                                                <Info size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
                                        <MessageCircle size={14} className="text-cyan-400" />
                                        <span className="text-[10px] font-black text-white leading-none">{discussion._count?.comments || 0}</span>
                                    </div>
                                    <div className={`p-2 rounded-full bg-white/5 transition-all duration-500 ${selectedId === discussion.id ? 'rotate-90 bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'group-hover:translate-x-1 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 hover:bg-white/10'}`}>
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>

                            {selectedId === discussion.id && (
                                <div className="mt-6 pt-6 border-t border-white/5 animate-in fade-in slide-in-from-top-4 duration-500" onClick={e => e.stopPropagation()}>
                                    <CommentSection
                                        discussionId={discussion.id}
                                        ownerId={discussion.userId}
                                        onCommentsChanged={(newCount) => {
                                            setDiscussions(prev => prev.map(d => {
                                                if (d.id === discussion.id) {
                                                    return {
                                                        ...d,
                                                        _count: {
                                                            ...d._count,
                                                            comments: newCount
                                                        }
                                                    }
                                                }
                                                return d;
                                            }));
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
                </div>
            </div>
            <Modal {...modalConfig} onClose={closeModal} />
        </div>
    );
};

export default DiscussionPanel;
