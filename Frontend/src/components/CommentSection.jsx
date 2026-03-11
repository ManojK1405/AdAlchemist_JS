import { useState, useEffect, useRef } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Heart, Send } from 'lucide-react';
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
                    toast.success('Remark dissolved');
                } catch (error) {
                    toast.error('Failed to dissolve remark');
                }
            }
        });
    };

    const CommentItem = ({ comment, depth = 0, parentName = null }) => {
        const isLiked = comment.likes?.some(l => l.userId === clerkUser?.id);
        const maxDepth = 3;

        return (
            <div className="animate-in fade-in duration-300">
                <div className={`flex gap-3 ${depth === 0 ? 'mt-8' : 'mt-4'} items-start`}>
                    <div className={`${depth > 0 ? 'size-6' : 'size-9'} rounded-full bg-white/10 shrink-0 overflow-hidden`}>
                        <img
                            src={comment.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous'}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-white">
                                {comment.user?.name || 'Anonymous'}
                            </span>
                            <span className="text-[10px] text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        <p className="text-sm leading-normal mb-2">
                            {depth > 0 && parentName && (
                                <span className="text-blue-400 font-medium mr-1.5 text-[13px]">@{parentName}</span>
                            )}
                            <span className="text-gray-300">{comment.content}</span>
                        </p>

                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => toggleLike(comment.id)}
                                className={`flex items-center gap-1.5 text-[11px] ${isLiked ? 'text-white' : 'text-gray-500 hover:text-white'} transition-colors duration-200`}
                            >
                                <Heart size={14} fill={isLiked ? 'white' : 'none'} strokeWidth={2.5} />
                                <span>{comment._count?.likes || 0}</span>
                            </button>

                            {depth < maxDepth && (
                                <button
                                    onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                                    className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors"
                                >
                                    Reply
                                </button>
                            )}

                            {(clerkUser && (comment.userId === clerkUser?.id || ownerId === clerkUser?.id)) && (
                                <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="text-[11px] text-gray-500 hover:text-red-500 transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                        </div>

                        {replyTo === comment.id && (
                            <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                                <form onSubmit={(e) => handleSubmit(e, comment.id)} className="flex items-center gap-3">
                                    <input
                                        autoFocus
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Add a reply..."
                                        className="flex-1 bg-transparent border-b border-white/10 py-1 text-sm focus:outline-none focus:border-white transition-all placeholder:text-gray-600"
                                    />
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setReplyTo(null)} className="text-[10px] font-bold hover:bg-white/10 px-2 py-1 rounded">Cancel</button>
                                        <button type="submit" disabled={loading || !replyContent.trim()} className="text-[10px] font-bold bg-white text-black px-3 py-1 rounded-full">Reply</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className={depth === 0 ? 'pl-10 sm:pl-12' : ''}>
                    {comment.replies?.map(reply => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} parentName={comment.user?.name} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative">
            <div className="mt-16 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between mb-8">
                    <h4 className="flex items-center gap-3 text-lg font-bold">
                        Comments
                        <span className="text-xs font-normal text-gray-500 ml-2">{rawCount}</span>
                    </h4>
                </div>

                <div className="flex gap-3 mb-10">
                    <div className="size-9 rounded-full bg-white/10 shrink-0 overflow-hidden">
                        <img 
                            src={clerkUser?.imageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=anonymous'} 
                            className="w-full h-full object-cover"
                            alt="User"
                        />
                    </div>
                    <form onSubmit={(e) => handleSubmit(e)} className="flex-1">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            className="w-full bg-transparent border-b border-white/10 py-2 text-sm focus:outline-none focus:border-white transition-all placeholder:text-gray-600 resize-none overflow-hidden min-h-[40px]"
                        />
                        {newComment.trim() && (
                            <div className="flex justify-end gap-3 mt-2 animate-in fade-in slide-in-from-top-1">
                                <button 
                                    type="button" 
                                    onClick={() => setNewComment('')}
                                    className="px-4 py-2 text-xs font-bold hover:bg-white/10 rounded-full transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold transition-all hover:bg-gray-200 disabled:opacity-30"
                                >
                                    Comment
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {comments.length === 0 ? (
                    <div className="text-center py-16 text-gray-600">
                        <p className="text-xs uppercase tracking-widest">No comments yet</p>
                    </div>
                ) : (
                    comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                )}
            </div>
            <Modal {...modalConfig} onClose={closeModal} />
        </div>
    );
};

export default CommentSection;
