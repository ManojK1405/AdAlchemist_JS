import { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Heart, MessageSquare, Send, Reply } from 'lucide-react';
import api from '../configs/axios';
import toast from 'react-hot-toast';
import Modal from './Modal';

const CommentSection = ({ projectId, discussionId, ownerId, onCommentsChanged }) => {
    const { getToken } = useAuth();
    const { user: clerkUser } = useUser();
    const [comments, setComments] = useState([]);
    const [rawCount, setRawCount] = useState(0);
    const [newComment, setNewComment] = useState('');
    const [replyContent, setReplyContent] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [loading, setLoading] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const buildTree = (allComments) => {
        const map = new Map();
        const roots = [];

        // First pass: add all to map
        allComments.forEach(comment => {
            map.set(comment.id, { ...comment, replies: [] });
        });

        // Second pass: link to parents or add to roots
        allComments.forEach(comment => {
            const commentWithReplies = map.get(comment.id);
            if (comment.parentId && map.has(comment.parentId)) {
                map.get(comment.parentId).replies.push(commentWithReplies);
            } else {
                roots.push(commentWithReplies);
            }
        });

        // Sort roots by likes (highest first)
        return roots.sort((a, b) => (b._count?.likes || 0) - (a._count?.likes || 0));
    };

    const fetchComments = async () => {
        try {
            const { data } = await api.get('/api/social/comments', {
                params: { projectId, discussionId }
            });
            const newCount = data.length;
            setRawCount(newCount);
            setComments(buildTree(data));
            onCommentsChanged?.(newCount);
        } catch (error) {
            console.error('Error fetching comments:', error);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [projectId, discussionId]);

    const handleSubmit = async (e, pId = null) => {
        e.preventDefault();
        const content = pId ? replyContent : newComment;
        if (!content.trim()) return;

        try {
            setLoading(true);
            const token = clerkUser ? await getToken() : null;
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            await api.post('/api/social/comments',
                { content, projectId, discussionId, parentId: pId },
                { headers }
            );

            if (pId) {
                setReplyContent('');
                setReplyTo(null);
            } else {
                setNewComment('');
            }

            fetchComments();
            toast.success('Comment added!');
        } catch (error) {
            toast.error('Failed to add comment');
        } finally {
            setLoading(false);
        }
    };

    const toggleLike = async (commentId) => {
        if (!clerkUser) {
            toast.error('Please login to like comments');
            return;
        }
        try {
            const token = await getToken();
            await api.post(`/api/social/comments/${commentId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchComments();
        } catch (error) {
            toast.error('Failed to toggle like');
        }
    };

    const handleDelete = async (commentId) => {
        openConfirm({
            title: "Delete Comment",
            message: "Are you sure you want to delete this comment? This action cannot be undone.",
            confirmText: "Delete",
            type: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();
                    await api.delete(`/api/social/comments/${commentId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    fetchComments();
                    toast.success('Comment deleted');
                } catch (error) {
                    toast.error('Failed to delete comment');
                }
            }
        });
    };

    const CommentItem = ({ comment, depth = 0 }) => {
        const isLiked = comment.likes?.some(l => l.userId === clerkUser?.id);
        const maxDepth = 3; // Limit visual nesting to prevent horizontal overflow

        return (
            <div className={`flex gap-3 ${depth > 0 ? 'ml-6 sm:ml-8 mt-4' : 'mt-6'} items-start animate-in fade-in slide-in-from-left-2 duration-300`}>
                <img
                    src={comment.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous'}
                    className="w-12 h-12 rounded-full border-2 border-white/10 shrink-0 bg-white/5 shadow-inner"
                    alt=""
                />
                <div className="flex-1 min-w-0">
                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/10 hover:border-white/20 transition-colors">
                        <div className="flex justify-between items-center mb-1 gap-2">
                            <span className={`text-sm font-semibold truncate ${!comment.user ? 'text-gray-400 italic' : 'text-cyan-300'}`}>
                                {comment.user?.name || 'Anonymous Alchemist'}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider text-gray-500 whitespace-nowrap">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed font-light break-words">{comment.content}</p>
                    </div>
                    <div className="flex gap-4 mt-2 ml-1 items-center">
                        <button
                            onClick={() => toggleLike(comment.id)}
                            className={`flex items-center gap-1 text-xs ${isLiked ? 'text-pink-500' : 'text-gray-400'} hover:text-pink-500 transition-all duration-300`}
                        >
                            <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} className={isLiked ? 'scale-110' : ''} />
                            <span className="font-medium">{comment._count?.likes || 0}</span>
                        </button>

                        {depth < maxDepth && (
                            <button
                                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                className={`flex items-center gap-1 text-xs transition-all ${replyTo === comment.id ? 'text-cyan-400' : 'text-gray-400 hover:text-cyan-400'}`}
                            >
                                <Reply size={14} />
                                <span className="font-medium">Reply</span>
                            </button>
                        )}

                        {(clerkUser && (comment.userId === clerkUser?.id || ownerId === clerkUser?.id)) && (
                            <button
                                onClick={() => handleDelete(comment.id)}
                                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-red-500 transition-all uppercase tracking-tighter ml-auto"
                            >
                                Delete
                            </button>
                        )}
                    </div>

                    {/* Inline Reply Input */}
                    {replyTo === comment.id && (
                        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                            <form onSubmit={(e) => handleSubmit(e, comment.id)} className="flex gap-2">
                                <input
                                    autoFocus
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Write a reply..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500/50 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !replyContent.trim()}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-30"
                                >
                                    Reply
                                </button>
                            </form>
                        </div>
                    )}

                    {comment.replies?.map(reply => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="mt-12 pt-8 border-t border-white/10">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="flex items-center gap-3 text-xl font-semibold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        <MessageSquare size={22} className="text-cyan-400" />
                        Community Feedback
                    </h4>
                    <span className="text-xs text-gray-500 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {rawCount} Comments
                    </span>
                </div>

                <form onSubmit={(e) => handleSubmit(e)} className="mb-10 relative group">
                    <div className="flex gap-3 items-center">
                        <div className="relative flex-1">
                            <input
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts with the creator..."
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 transition-all placeholder:text-gray-600"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !newComment.trim()}
                            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-30 disabled:hover:bg-cyan-600 text-white px-6 py-3.5 rounded-2xl transition-all duration-300 flex items-center gap-2 font-medium shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/40"
                        >
                            <Send size={18} className={loading ? 'animate-pulse' : ''} />
                            <span className="hidden sm:inline">Post</span>
                        </button>
                    </div>
                </form>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                    {comments.length === 0 ? (
                        <div className="text-center py-16 bg-white/3 rounded-3xl border border-dashed border-white/10">
                            <div className="w-16 h-16 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare size={28} className="text-cyan-400/50" />
                            </div>
                            <p className="text-gray-400 font-medium">No voices here yet.</p>
                            <p className="text-xs text-gray-500 mt-1">Be the first to start the conversation!</p>
                        </div>
                    ) : (
                        comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                    )}
                </div>
            </div>
            <Modal {...modalConfig} onClose={closeModal} />
        </>
    );
};

export default CommentSection;
