import { useState, useEffect } from 'react';
import Title from '../components/Title';
import api from '../configs/axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import {
    Zap,
    Video,
    Layout,
    Clock,
    TrendingUp,
    ShieldAlert,
    Anchor,
    MessageSquareX,
    Save,
    Loader2,
    ToggleLeft,
    ToggleRight,
    Ticket,
    Plus,
    Trash2,
    CheckCircle2,
    Users,
    Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import Modal from '../components/Modal';
import CustomDropdown from '../components/CustomDropdown';

const SETTINGS_GROUPS = [
    {
        title: "Core Service Toggles",
        description: "Enable or disable major generation services globally.",
        items: [
            { key: 'enableImageGen', label: 'Image Generation', icon: <Zap size={20} className="text-yellow-400" /> },
            { key: 'enableVideoGen', label: 'Video Generation', icon: <Video size={20} className="text-blue-400" /> },
            { key: 'showMockAssets', label: 'Mock Assets Download', icon: <Plus size={20} className="text-green-400" />, detail: "Shows test image downloads in Generator page." },
        ]
    },
    {
        title: "Growth & Dark Tactics",
        description: "Control the psychological triggers and conversion optimization features.",
        items: [
            { key: 'enableSocialProof', label: 'Social Proof Ticker', icon: <TrendingUp size={20} className="text-cyan-400" />, detail: "Shows 'Recent Purchase' alerts to users." },
            { key: 'enableScarcity', label: 'Scarcity Triggers', icon: <Clock size={20} className="text-orange-400" />, detail: "Adds 'Limited Slots' messaging to unlocks." },
            { key: 'enableUrgency', label: 'Urgency Banner', icon: <ShieldAlert size={20} className="text-red-400" />, detail: "Shows the FOMO bar on Pricing page." },
            { key: 'enableAnchoring', label: 'Price Anchoring', icon: <Anchor size={20} className="text-purple-400" />, detail: "Shows strikethrough 'Original' prices." },
            { key: 'enableShaming', label: 'Confirm Shaming', icon: <MessageSquareX size={20} className="text-pink-400" />, detail: "Uses manipulative 'No' options in modals." },
        ]
    }
];

const AdminSettings = () => {
    const { getToken } = useAuth();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [passcode, setPasscode] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // Coupon states
    const [coupons, setCoupons] = useState([]);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'FREE_CREDITS',
        value: 10,
        maxUses: '',
        expiryDate: ''
    });
    const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

    // Demo access
    const [demoEmail, setDemoEmail] = useState('');
    const [isGrantingDemo, setIsGrantingDemo] = useState(false);
    const [isRevokingDemo, setIsRevokingDemo] = useState(false);
    const [demoResult, setDemoResult] = useState(null);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setIsVerifying(true);
        try {
            const { data } = await api.post('/api/admin/verify', { passcode });
            if (data.authorized) {
                setIsAuthorized(true);
                toast.success("Identity Verified", { icon: '🤫' });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid passcode");
            setPasscode('');
        } finally {
            setIsVerifying(false);
        }
    };

    useEffect(() => {
        if (!isAuthorized) return;
        const fetchSettings = async () => {
            try {
                const token = await getToken();
                const { data } = await api.get('/api/admin/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSettings(data);

                // Fetch coupons too
                const couponRes = await api.get('/api/coupon/admin/list', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoupons(couponRes.data.coupons);
            } catch (err) {
                toast.error("Failed to load admin data");
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, [isAuthorized]);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = await getToken();
            await api.post('/api/admin/settings', settings, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Settings published successfully");
        } catch (err) {
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        if (!newCoupon.code || !newCoupon.value) return toast.error("Fill required fields");

        setIsCreatingCoupon(true);
        try {
            const token = await getToken();
            const { data } = await api.post('/api/coupon/admin/create', newCoupon, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCoupons(prev => [data.coupon, ...prev]);
            setNewCoupon({ code: '', type: 'FREE_CREDITS', value: 10, maxUses: '', expiryDate: '' });
            toast.success("Coupon generated!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create coupon");
        } finally {
            setIsCreatingCoupon(false);
        }
    };

    const generateRandomCode = () => {
        const code = Math.random().toString(36).substring(2, 10).toUpperCase();
        setNewCoupon(prev => ({ ...prev, code }));
    };

    const handleDeleteCoupon = async (id) => {
        openConfirm({
            title: "Terminate Protocol",
            message: "Are you sure you want to delete this coupon protocol? All remaining uses will be invalidated immediately.",
            confirmText: "Purge Key",
            type: "danger",
            onConfirm: async () => {
                closeModal();
                try {
                    const token = await getToken();
                    await api.delete(`/api/coupon/admin/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setCoupons(prev => prev.filter(c => c.id !== id));
                    toast.success("Protocol terminated");
                } catch (err) {
                    toast.error("Failed to delete coupon");
                }
            }
        });
    };

    const handleDemoAccess = async (e) => {
        e.preventDefault();
        if (!demoEmail.trim()) return;
        setIsGrantingDemo(true);
        setDemoResult(null);
        try {
            const token = await getToken();
            const { data } = await api.post('/api/admin/demo-access', { email: demoEmail.trim() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDemoResult({ success: true, message: data.message });
            toast.success(data.message);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to grant demo access';
            setDemoResult({ success: false, message: msg });
            toast.error(msg);
        } finally {
            setIsGrantingDemo(false);
        }
    };

    const handleRevokeAccess = async () => {
        if (!demoEmail.trim()) return toast.error('Enter an email first');
        setIsRevokingDemo(true);
        setDemoResult(null);
        try {
            const token = await getToken();
            const { data } = await api.delete('/api/admin/demo-access', {
                headers: { Authorization: `Bearer ${token}` },
                data: { email: demoEmail.trim() }
            });
            setDemoResult({ success: true, message: data.message, revoked: true });
            toast.success(data.message);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to revoke access';
            setDemoResult({ success: false, message: msg });
            toast.error(msg);
        } finally {
            setIsRevokingDemo(false);
        }
    };

    if (!isAuthorized) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505]">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-sm bg-white/5 border border-white/10 p-10 rounded-[3rem] backdrop-blur-3xl shadow-2xl text-center"
            >
                <div className="w-16 h-16 bg-cyan-600/10 rounded-3xl flex items-center justify-center mx-auto text-cyan-400 mb-6 border border-cyan-500/20">
                    <ShieldAlert size={32} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-[0.3em] text-white mb-2">Gatekeeper</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">System Access Restricted</p>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                    <input
                        type="password"
                        placeholder="ENTER PASSCODE"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-center text-sm font-black tracking-[0.5em] text-cyan-400 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-700"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={isVerifying}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-500 transition-all active:scale-95 shadow-xl shadow-cyan-500/10 flex items-center justify-center gap-2"
                    >
                        {isVerifying && <Loader2 size={14} className="animate-spin" />}
                        {isVerifying ? 'Verifying...' : 'Verify Identity'}
                    </button>
                </form>
            </motion.div>
        </div>
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-cyan-500" size={48} />
        </div>
    );

    if (!settings) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-4">
            <div className="p-6 bg-red-500/10 rounded-full text-red-500">
                <ShieldAlert size={48} />
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-black uppercase text-white">Access Denied / Load Failed</h3>
                <p className="text-gray-500 mt-2">Failed to connect to the master control center. Please check your admin privileges.</p>
            </div>
            <button
                onClick={() => window.location.reload()}
                className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-cyan-500 transition-all"
            >
                Retry Connection
            </button>
        </div>
    );

    return (
        <div className="pt-20 pb-32 max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
                <Title
                    title="Control Center"
                    heading="Global Settings"
                    description="The master controls for AdAlchemist's growth and service availability."
                />

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-8 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-cyan-600/20 disabled:opacity-50"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Apply All Changes
                </motion.button>
            </div>

            <div className="space-y-12">
                {SETTINGS_GROUPS.map((group, idx) => (
                    <div key={idx} className="space-y-6">
                        <div className="border-b border-white/10 pb-4">
                            <h3 className="text-xl font-bold text-white uppercase tracking-widest">{group.title}</h3>
                            <p className="text-gray-500 text-xs font-medium mt-1 uppercase tracking-wider">{group.description}</p>
                        </div>

                        <div className="grid gap-4">
                            {group.items.map((item) => (
                                <div
                                    key={item.key}
                                    onClick={() => handleToggle(item.key)}
                                    className="group flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-[2rem] hover:bg-white/[0.08] transition-all cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white uppercase tracking-wider text-sm">{item.label}</h4>
                                            {item.detail && <p className="text-[10px] text-gray-500 font-medium uppercase mt-0.5">{item.detail}</p>}
                                        </div>
                                    </div>

                                    <button className="text-cyan-500">
                                        {settings?.[item.key] ? (
                                            <ToggleRight size={32} />
                                        ) : (
                                            <ToggleLeft size={32} className="text-gray-600" />
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* COUPON MANAGEMENT SECTION */}
            <div className="mt-24 space-y-10 relative">
                {/* Background Glow for Section */}
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-8">
                    <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-cyan-500 rounded-2xl shadow-lg shadow-cyan-500/20">
                                <Ticket size={28} className="text-black" />
                            </div>
                            Protocol Terminal
                        </h3>
                        <p className="text-gray-500 text-xs font-bold mt-2 uppercase tracking-[0.3em] ml-1">Forge new promotion keys & monitor active system overrides.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Creation Form - Premium Glass */}
                    <div className="lg:col-span-4 p-1 bg-[#0A0A0A] border border-white/5 rounded-[3rem] shadow-2xl relative group overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        <div className="relative p-8 bg-black/40 backdrop-blur-3xl rounded-[2.9rem] border border-white/10 space-y-8 h-full">
                            <div>
                                <h4 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Plus size={14} className="text-cyan-500" />
                                    Forge New Protocol
                                </h4>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Code</label>
                                    <div className="relative group/input">
                                        <input
                                            value={newCoupon.code}
                                            onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                            placeholder="OFF50_PRO"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-cyan-400 outline-none focus:border-cyan-500 focus:bg-white/[0.08] transition-all placeholder:text-white/10"
                                        />
                                        <button
                                            onClick={generateRandomCode}
                                            className="absolute right-2 top-2 bottom-2 px-4 bg-cyan-500 text-black rounded-xl font-black text-[10px] uppercase hover:bg-white transition-all active:scale-95"
                                        >
                                            Auto
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4 pt-1">
                                        <CustomDropdown
                                            label="Type"
                                            value={newCoupon.type}
                                            onChange={(val) => setNewCoupon({ ...newCoupon, type: val })}
                                            options={[
                                                { label: "FREE CREDITS", value: "FREE_CREDITS" },
                                                { label: "DISCOUNT %", value: "DISCOUNT" }
                                            ]}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Magnitude</label>
                                        <input
                                            type="number"
                                            value={newCoupon.value}
                                            onChange={e => setNewCoupon({ ...newCoupon, value: e.target.value })}
                                            placeholder="50"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Cap Units</label>
                                        <input
                                            type="number"
                                            placeholder="∞"
                                            value={newCoupon.maxUses}
                                            onChange={e => setNewCoupon({ ...newCoupon, maxUses: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-black text-white outline-none focus:border-cyan-500 transition-all placeholder:text-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiry</label>
                                        <input
                                            type="date"
                                            value={newCoupon.expiryDate}
                                            onChange={e => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[10px] font-black uppercase text-white outline-none focus:border-cyan-500 transition-all"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCreateCoupon}
                                    disabled={isCreatingCoupon}
                                    className="w-full py-5 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_40px_-15px_rgba(6,182,212,0.3)] hover:shadow-cyan-500/50 transition-all flex items-center justify-center gap-3 active:brightness-110"
                                >
                                    {isCreatingCoupon ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                                    Deploy Protocol
                                </motion.button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Ticket Slider Container */}
                    <div className="lg:col-span-8 flex flex-col">
                        <div className="mb-6 flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                <div className="w-8 h-px bg-white/10"></div>
                                Active System Protocols
                                <span className="bg-cyan-500/10 text-cyan-500 px-3 py-1 rounded-full text-[9px] font-black">{coupons.length} KEYS</span>
                            </h4>
                        </div>

                        <div className="relative overflow-hidden cursor-grab active:cursor-grabbing group/slider">
                            {/* Glass gradient overlay edges */}
                            <div className="absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />
                            <div className="absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none opacity-0 group-hover/slider:opacity-100 transition-opacity" />

                            <motion.div
                                drag="x"
                                dragConstraints={{ right: 0, left: -((coupons.length * 300) - 700) }}
                                className="flex gap-8 pb-12 pt-4 px-2"
                            >
                                {coupons.length === 0 ? (
                                    <div className="w-full py-24 flex flex-col items-center justify-center bg-white/2 border border-dashed border-white/10 rounded-[3rem] text-center">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-gray-700 mb-4">
                                            <ShieldAlert size={32} />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">Zero protocols identified in secure memory</p>
                                    </div>
                                ) : (
                                    coupons.map((coupon) => (
                                        <motion.div
                                            key={coupon.id}
                                            whileHover={{ y: -10, scale: 1.02 }}
                                            className="min-w-[280px] bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] group/card flex flex-col h-[380px]"
                                        >
                                            {/* Glow Overlay */}
                                            <div className={`absolute inset-0 opacity-0 group-hover/card:opacity-20 transition-opacity duration-700 pointer-events-none ${coupon.type === 'DISCOUNT' ? 'bg-purple-500' : 'bg-cyan-500'} blur-[100px] -z-10`} />

                                            {/* Ticket Notch System */}
                                            <div className="absolute top-[60%] -left-4 w-8 h-8 bg-[#050505] rounded-full border border-white/10 shadow-[inset_-5px_0_10px_rgba(0,0,0,0.9)] z-20"></div>
                                            <div className="absolute top-[60%] -right-4 w-8 h-8 bg-[#050505] rounded-full border border-white/10 shadow-[inset_5px_0_10px_rgba(0,0,0,0.9)] z-20"></div>
                                            <div className="absolute top-[calc(60%+15px)] left-6 right-6 h-px border-t border-dashed border-white/10 z-20"></div>

                                            {/* Header Content */}
                                            <div className={`p-8 pb-10 flex-1 relative ${coupon.type === 'DISCOUNT' ? 'bg-gradient-to-br from-purple-500/10 to-transparent' : 'bg-gradient-to-br from-cyan-500/10 to-transparent'}`}>
                                                <div className="flex justify-between items-start">
                                                    <div className={`p-3 rounded-2xl ${coupon.type === 'DISCOUNT' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                                                        <Ticket size={24} />
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {coupon.isActive ? (
                                                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                                <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                                                Active
                                                            </div>
                                                        ) : (
                                                            <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-full text-[8px] font-black uppercase tracking-widest border border-red-500/20">
                                                                Shutdown
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleDeleteCoupon(coupon.id); }}
                                                            className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover/card:opacity-100 mt-2"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="mt-8">
                                                    <h4 className="text-3xl font-black text-white tracking-widest group-hover/card:text-cyan-400 transition-colors duration-500">{coupon.code}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">System Identity Key</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Content / Metrics */}
                                            <div className="p-8 pt-10 bg-white/[0.02] backdrop-blur-md space-y-6">
                                                <div className="flex items-end justify-between">
                                                    <div>
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Magnitude</p>
                                                        <span className={`text-4xl font-black italic tracking-tighter ${coupon.type === 'DISCOUNT' ? 'text-purple-400 text-glow-purple' : 'text-cyan-400 text-glow-cyan'}`}>
                                                            {coupon.type === 'DISCOUNT' ? `${coupon.value}%` : `+${coupon.value}`}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Class</p>
                                                        <span className="text-[10px] font-black text-white uppercase tracking-tighter bg-white/10 px-3 py-1 rounded-lg">
                                                            {coupon.type.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                                                        <span className="text-gray-500">Execution Frequency</span>
                                                        <span className="text-white">{coupon.usedCount} <span className="text-gray-600">/</span> {coupon.maxUses || '∞'}</span>
                                                    </div>
                                                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-[2px] border border-white/5">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: coupon.maxUses ? `${(coupon.usedCount / coupon.maxUses) * 100}%` : '100%' }}
                                                            className={`h-full rounded-full ${coupon.type === 'DISCOUNT' ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]' : 'bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]'}`}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Demo Access ───────────────────────────────── */}
            <div className="mt-16 p-8 bg-indigo-500/5 border border-indigo-500/10 rounded-[2.5rem] space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
                        <Users size={22} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            Demo Access
                            <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/20 font-black">INTERVIEW MODE</span>
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">Grant a user full premium access + 300 credits instantly by email.</p>
                    </div>
                </div>

                <form onSubmit={handleDemoAccess} className="flex gap-3">
                    <input
                        type="email"
                        value={demoEmail}
                        onChange={(e) => { setDemoEmail(e.target.value); setDemoResult(null); }}
                        placeholder="interviewer@company.com"
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm font-medium outline-none focus:border-indigo-500 transition-all placeholder:text-gray-700"
                    />
                    <button
                        type="submit"
                        disabled={isGrantingDemo || isRevokingDemo || !demoEmail.trim()}
                        className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        {isGrantingDemo ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        {isGrantingDemo ? 'Granting...' : 'Grant'}
                    </button>
                    <button
                        type="button"
                        onClick={handleRevokeAccess}
                        disabled={isRevokingDemo || isGrantingDemo || !demoEmail.trim()}
                        className="px-6 py-3.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                    >
                        {isRevokingDemo ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {isRevokingDemo ? 'Revoking...' : 'Revoke'}
                    </button>
                </form>

                {demoResult && (
                    <div className={`p-4 rounded-2xl border text-sm font-medium animate-in fade-in duration-300 ${demoResult.success
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}>
                        {demoResult.success ? '✅' : '❌'} {demoResult.message}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    {['✓ Pro Access', '✓ Pipeline Access', '✓ Brand Hub', '✓ 300 Credits'].map(f => (
                        <span key={f} className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-wider">{f}</span>
                    ))}
                </div>
            </div>

            <div className="mt-6 p-8 bg-yellow-500/5 border border-yellow-500/10 rounded-[2.5rem] flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 shrink-0">
                    <ShieldAlert size={24} />
                </div>
                <div>
                    <h5 className="font-bold text-white uppercase tracking-widest text-sm">System Warning</h5>
                    <p className="text-xs text-gray-400 mt-1 font-medium leading-relaxed">
                        Changes to these flags are global and affect all users immediately. Disabling core services will prevent users from spending credits.
                    </p>
                </div>
            </div>

            <Modal {...modalConfig} onClose={closeModal} />
        </div>
    );
};

export default AdminSettings;
