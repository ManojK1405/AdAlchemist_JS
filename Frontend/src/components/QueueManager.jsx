import { useState, useEffect } from "react";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { Loader2, Trash2, Edit2, Play, ChevronUp, ChevronDown, List, X, Clock, CheckCircle, AlertCircle, Save, Lock, Zap, Coins, Info } from "lucide-react";
import api from "../configs/axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Modal from "./Modal";

const QueueManager = () => {
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [editingJobId, setEditingJobId] = useState(null);
    const [editValues, setEditValues] = useState({ productName: "", userPrompt: "" });
    const [isUnlocking, setIsUnlocking] = useState(false);
    const [config, setConfig] = useState({
        enableSocialProof: true,
        enableScarcity: true,
        enableUrgency: true,
        enableAnchoring: true,
        enableShaming: true
    });

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const fetchStatusAndQueue = async () => {
        try {
            const token = await getToken();
            const { data: userData } = await api.get('/api/user/credits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasAccess(userData.hasPipelineAccess);

            if (userData.hasPipelineAccess) {
                const { data } = await api.get('/api/project/queue', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQueue(data.queue);
            }
        } catch (error) {
            console.error("Failed to fetch queue status", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStatusAndQueue();
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('/api/user/config');
                setConfig(data);
            } catch (err) {
                console.error("Failed to fetch config", err);
            }
        };
        fetchConfig();
        const interval = setInterval(fetchStatusAndQueue, 15000); // Polling every 15s
        return () => clearInterval(interval);
    }, []);

    const handleDelete = async (jobId) => {
        try {
            const token = await getToken();
            await api.delete(`/api/project/queue/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Job removed from queue");
            fetchStatusAndQueue();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to remove job");
        }
    };

    const handleReorder = async (jobId, direction) => {
        const index = queue.findIndex(j => j.id === jobId);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === queue.length - 1) return;

        const newQueue = [...queue];
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        [newQueue[index], newQueue[swapIndex]] = [newQueue[swapIndex], newQueue[index]];

        try {
            const token = await getToken();
            await api.post('/api/project/queue/reorder', { jobIds: newQueue.map(j => j.id) }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQueue(newQueue);
        } catch (error) {
            toast.error("Failed to reorder queue");
        }
    };

    const startEditing = (job) => {
        setEditingJobId(job.id);
        setEditValues({
            productName: job.payload?.productName || "",
            userPrompt: job.payload?.userPrompt || ""
        });
    };

    const handleUpdate = async () => {
        try {
            const token = await getToken();
            await api.patch(`/api/project/queue/${editingJobId}`, {
                payload: {
                    ...queue.find(j => j.id === editingJobId).payload,
                    ...editValues
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Pipeline task updated");
            setEditingJobId(null);
            fetchStatusAndQueue();
        } catch (error) {
            toast.error("Failed to update task");
        }
    };

    const handleUnlockWithCredits = async () => {
        openConfirm({
            title: "Unlock Pipeline",
            message: config.enableScarcity
                ? "Secure your spot in the Legacy Tier for 1,000 Credits? Only 4/10 pipeline slots remaining for today's batch."
                : "Permanent Lifetime Access for 1,000 Credits. Your background processing will be enabled immediately.",
            confirmText: "Unlock Now",
            cancelText: config.enableShaming ? "No, I'll wait manually" : "Dismiss",
            type: "info",
            onConfirm: async () => {
                closeModal();
                setIsUnlocking(true);
                try {
                    const token = await getToken();
                    const { data } = await api.post('/api/user/unlock-pipeline', {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success(data.message);
                    setHasAccess(true);
                    setIsOpen(false);
                    setTimeout(() => window.location.reload(), 1500);
                } catch (error) {
                    toast.error(error.response?.data?.message || "Unlock failed");
                } finally {
                    setIsUnlocking(false);
                }
            }
        });
    };

    if (queue.length === 0 && !isOpen && hasAccess) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl transition-all ${isOpen ? 'bg-white text-black scale-95' : 'bg-cyan-600 text-white hover:scale-110'}`}
            >
                {isOpen ? <X size={20} /> : <List size={20} />}
                <span className="font-bold uppercase tracking-widest text-xs">
                    {isOpen ? 'Close Pipeline' : `Pipeline ${queue.length > 0 ? `(${queue.length})` : ''}`}
                </span>
                {!hasAccess && !isOpen && <Lock size={12} className="opacity-50" />}
                {hasAccess && queue.some(j => j.status === 'PROCESSING') && (
                    <Loader2 size={14} className="animate-spin" />
                )}
            </button>

            {/* Queue Panel */}
            {isOpen && (
                <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-[#111] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                    {!hasAccess ? (
                        <div className="p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-cyan-600/10 rounded-full flex items-center justify-center mx-auto text-cyan-400">
                                <Zap size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-black uppercase tracking-widest text-white">Generation Pipeline</h3>
                                <p className="text-gray-500 text-xs leading-relaxed">
                                    Schedule multiple generations and get notified when they're ready.
                                    Bulk process images and videos while you focus on other work.
                                </p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-left space-y-3">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                    <CheckCircle size={12} className="text-cyan-500" /> Sequential Background Processing
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                    <CheckCircle size={12} className="text-cyan-500" /> Queue Reordering & Editing
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                    <CheckCircle size={12} className="text-cyan-500" /> Email Notifications on Completion
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => navigate('/plans')}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                                >
                                    Get Agency Plan
                                </button>
                                <button
                                    onClick={handleUnlockWithCredits}
                                    disabled={isUnlocking}
                                    className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                >
                                    {isUnlocking ? <Loader2 size={12} className="animate-spin" /> : <Coins size={12} className="text-yellow-500" />}
                                    1,000 Credits
                                </button>
                            </div>
                            <p className="text-[9px] text-gray-600 font-bold uppercase">Included for free in Agency Plan</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                                <h3 className="font-bold uppercase tracking-widest text-xs text-cyan-400">Generation Pipeline</h3>
                                <span className="text-[10px] text-gray-500 font-bold">{queue.length} Tasks Scheduled</span>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-hide">
                                {loading && queue.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                                        <Loader2 className="animate-spin" />
                                        <span className="text-[10px] uppercase font-bold tracking-widest">Loading Pipeline...</span>
                                    </div>
                                ) : queue.length === 0 ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                                        <Clock size={32} strokeWidth={1.5} />
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-center px-8">Queue is empty. Schedule tasks to see them here.</span>
                                    </div>
                                ) : (
                                    queue.map((job, idx) => (
                                        <div key={job.id} className={`group p-4 rounded-2xl border transition-all ${job.status === 'PROCESSING' ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/5 bg-white/[0.02] hover:border-white/20'}`}>
                                            {editingJobId === job.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editValues.productName}
                                                        onChange={(e) => setEditValues({ ...editValues, productName: e.target.value })}
                                                        placeholder="Product Name"
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-cyan-500 outline-none"
                                                    />
                                                    <textarea
                                                        value={editValues.userPrompt}
                                                        onChange={(e) => setEditValues({ ...editValues, userPrompt: e.target.value })}
                                                        placeholder="Creative Direction"
                                                        rows={2}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white focus:border-cyan-500 outline-none resize-none"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button onClick={handleUpdate} className="flex-1 py-2 bg-cyan-600 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                                                            <Save size={12} /> Save
                                                        </button>
                                                        <button onClick={() => setEditingJobId(null)} className="px-3 py-2 bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${job.type === 'IMAGE' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                                {job.type}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-300 truncate">
                                                                {job.project?.name || "Untitled Generation"}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-gray-500 line-clamp-1">{job.payload?.productName || "No details"}</p>
                                                    </div>

                                                    <div className="flex flex-col gap-1 items-end">
                                                        {job.status === 'PROCESSING' ? (
                                                            <span className="flex items-center gap-1.5 text-[9px] font-black text-cyan-400 uppercase tracking-tighter">
                                                                <Loader2 size={10} className="animate-spin" />
                                                                Processing
                                                            </span>
                                                        ) : (
                                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => handleReorder(job.id, 'up')} className="p-1 hover:text-cyan-400 text-gray-500"><ChevronUp size={14} /></button>
                                                                <button onClick={() => handleReorder(job.id, 'down')} className="p-1 hover:text-cyan-400 text-gray-500"><ChevronDown size={14} /></button>
                                                                <button onClick={() => startEditing(job)} className="p-1 hover:text-cyan-400 text-gray-500"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDelete(job.id)} className="p-1 hover:text-red-400 text-gray-500"><Trash2 size={14} /></button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {job.status === 'PROCESSING' && (
                                                <div className="mt-3 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <div className="h-full bg-cyan-500 animate-pulse w-2/3" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-6 bg-white/[0.03] border-t border-white/10">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock size={12} className="text-gray-500" />
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Pipeline Strategy: Sequential (FIFO)</span>
                                </div>
                                <p className="text-[9px] text-gray-600 leading-relaxed font-medium">
                                    Tasks are processed one after another to optimize credit usage. You will receive an email once the entire pipeline is complete.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            <Modal
                {...modalConfig}
                onClose={closeModal}
                loading={isUnlocking}
            />
        </div>
    );
};

export default QueueManager;
