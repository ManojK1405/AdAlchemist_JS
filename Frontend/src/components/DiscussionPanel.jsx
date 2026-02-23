import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { MessageCircle, Plus, Users, ArrowRight, Sparkles, Search, Trash2, Coins } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';
import CommentSection from './CommentSection';

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
        const confirm = window.confirm("Are you sure you want to delete this discussion?");
        if (!confirm) return;
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
    };

    const handleTip = async (e, discussion) => {
        e.stopPropagation();
        if (!clerkUser) {
            toast.error('Please login to tip creators');
            return;
        }

        const confirm = window.confirm(`Tip 5 credits to ${discussion.user?.name || 'this creator'}?`);
        if (!confirm) return;

        try {
            const token = await getToken();
            await api.post('/api/social/tip', { recipientId: discussion.userId, amount: 5 }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Successfully tipped 5 credits!');
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Failed to tip creator');
        }
    };

    const filteredDiscussions = discussions.filter(d => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (d.title && d.title.toLowerCase().includes(term)) ||
            (d.content && d.content.toLowerCase().includes(term));
    });

    const suggestedTopics = ['Tutorials', 'Prompts', 'Feedback', 'Video Generation', 'Help'];

    return (
        <div className="bg-[#0f0f12] border border-white/5 rounded-[2rem] overflow-hidden h-fit shadow-2xl shadow-indigo-500/5">
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent flex items-center justify-between">
                <h3 className="flex items-center gap-3 font-bold text-lg tracking-tight">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                        <Users size={18} className="text-indigo-400" />
                    </div>
                    Creator Lounge
                </h3>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-2.5 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-all duration-300 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={20} className="text-white" />
                </button>
            </div>

            <div className="p-5 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar">

                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search discussions by topic or content..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#1a1a24] border border-white/5 rounded-xl set-outline-none pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-white placeholder-white/30"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Related:</span>
                    {suggestedTopics.map((topic, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSearchTerm(topic)}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 rounded-full text-[10px] font-medium uppercase tracking-wider transition-colors border border-white/5"
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
                    <form onSubmit={handleCreate} className="p-5 bg-white/[0.02] border border-white/10 rounded-[1.5rem] space-y-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest pl-1">
                            <Sparkles size={12} />
                            Start a new topic
                        </div>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Catchy discussion title..."
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your experience or ask a question..."
                            rows={3}
                            className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all resize-none"
                        />
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                            >
                                {loading ? 'Publishing...' : 'Publish Topic'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-5 bg-white/5 hover:bg-white/10 text-white/70 py-3 rounded-xl text-xs font-medium transition-all"
                            >
                                Dismiss
                            </button>
                        </div>
                    </form>
                )}

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
                            className={`group p-5 rounded-[1.5rem] border transition-all duration-300 cursor-pointer ${selectedId === discussion.id
                                ? 'bg-indigo-500/5 border-indigo-500/30 ring-1 ring-indigo-500/30'
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                }`}
                            onClick={() => setSelectedId(selectedId === discussion.id ? null : discussion.id)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-sm text-white/90 group-hover:text-white transition-colors leading-tight">{discussion.title}</h4>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <span className="text-[10px] font-medium text-white/20">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                                    {clerkUser?.id === discussion.userId && (
                                        <button
                                            onClick={(e) => handleDelete(e, discussion.id)}
                                            className="text-white/20 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={13} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p className={`text-xs text-white/50 leading-relaxed mb-4 transition-all duration-500 ${selectedId === discussion.id ? '' : 'line-clamp-2'}`}>
                                {discussion.content}
                            </p>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 shadow-xl">
                                        <img src={discussion.user?.image || 'https://via.placeholder.com/24'} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{discussion.user?.name || 'Creator'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-bold text-white/30">
                                    {clerkUser?.id !== discussion.userId && (
                                        <span
                                            onClick={(e) => handleTip(e, discussion)}
                                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-yellow-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors cursor-pointer"
                                        >
                                            <Coins size={12} />
                                            Tip
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                        <MessageCircle size={12} className="text-indigo-400/60" />
                                        {discussion._count?.comments || 0}
                                    </span>
                                    <ArrowRight size={14} className={`transition-transform duration-300 ${selectedId === discussion.id ? 'rotate-90 text-indigo-400' : 'group-hover:translate-x-1'}`} />
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
    );
};

export default DiscussionPanel;
