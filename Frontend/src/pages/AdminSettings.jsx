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
    ToggleRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const SETTINGS_GROUPS = [
    {
        title: "Core Service Toggles",
        description: "Enable or disable major generation services globally.",
        items: [
            { key: 'enableImageGen', label: 'Image Generation', icon: <Zap size={20} className="text-yellow-400" /> },
            { key: 'enableVideoGen', label: 'Video Generation', icon: <Video size={20} className="text-blue-400" /> },
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

    const handleVerifyCode = (e) => {
        e.preventDefault();
        if (passcode === '1405') {
            setIsAuthorized(true);
            toast.success("Identity Verified", { icon: '🤫' });
        } else {
            toast.error("Invalid Secret Key");
            setPasscode('');
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
            } catch (err) {
                toast.error("Failed to load admin settings");
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
                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-cyan-500 transition-all active:scale-95 shadow-xl shadow-cyan-500/10"
                    >
                        Verify Identity
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

            <div className="mt-16 p-8 bg-yellow-500/5 border border-yellow-500/10 rounded-[2.5rem] flex items-center gap-6">
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
        </div>
    );
}

export default AdminSettings;
