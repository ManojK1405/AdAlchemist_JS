import React, { useState, useEffect } from "react";
import {
    Layout,
    Upload,
    Palette,
    MessageSquare,
    Type,
    Users,
    Save,
    ChevronDown,
    Check,
    Loader2,
    Image as ImageIcon,
    ShieldCheck,
    Briefcase,
    Zap,
    Lock,
    Trash2,
    Plus,
    Sparkles
} from "lucide-react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../configs/axios";
import Modal from "../components/Modal";
import CustomDropdown from "../components/CustomDropdown";
import { optimizeImage } from "../utils/cdn";

const BrandHub = () => {
    const { user } = useUser();
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [hasPro, setHasPro] = useState(false);
    const [isUnlocking, setIsUnlocking] = useState(false);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
        type: "info"
    });

    const openConfirm = (config) => setModalConfig({ ...config, isOpen: true });
    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const [brandKits, setBrandKits] = useState([]);
    const [currentKitId, setCurrentKitId] = useState(null);
    const [brandKit, setBrandKit] = useState({
        name: "My Brand",
        primaryColor: "#06b6d4",
        secondaryColor: "#231adddc",
        fontPrimary: "Inter",
        fontSecondary: "Montserrat",
        brandVoice: "Professional",
        targetAudience: "Marketing Professionals",
        description: "",
        logoDark: "",
        logoLight: "",
        isDefault: false
    });

    const [logoFiles, setLogoFiles] = useState({
        logoDark: null,
        logoLight: null
    });

    const voices = ["Professional", "Luxury", "Witty", "Direct", "Casual", "Aggressive", "Playful", "Corporate"];
    const fonts = ["Inter", "Montserrat", "Playfair Display", "Roboto", "Outfit", "Space Grotesk"];
    const audiences = ["General", "Gen Z", "Millennials", "Gen X", "Boomers", "B2B Enterprise", "Small Business", "Parents", "Tech Enthusiasts", "Luxury Buyers", "Fitness Enthusiasts", "Marketing Professionals"];

    const fetchBrandKits = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/brand-kit', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setHasAccess(data.hasBrandHubAccess || false);
            setHasPro(data.hasProAccess || false);

            if (data.brandKits && data.brandKits.length > 0) {
                setBrandKits(data.brandKits);
                // Set the default or the first one if no kit selected
                const defaultOrFirst = data.brandKits.find(k => k.isDefault) || data.brandKits[0];
                setBrandKit(defaultOrFirst);
                setCurrentKitId(defaultOrFirst.id);
            }
        } catch (error) {
            console.error("Error fetching brand kits", error.response?.data || error);
            toast.error("Failed to load creative tokens.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreditUnlock = async () => {
        try {
            setIsUnlocking(true);
            const token = await getToken();
            const { data } = await api.post('/api/user/unlock-brand-hub', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(data.message);
            window.location.reload();
        } catch (error) {
            toast.error(error.response?.data?.message || "Unlock failed");
        } finally {
            setIsUnlocking(false);
        }
    };

    const handleCashUnlock = async () => {
        try {
            setIsUnlocking(true);
            const token = await getToken();

            // Initiate Razorpay
            const planId = hasPro ? 'brand_hub_unlock_pro' : 'brand_hub_unlock';
            const { data: orderData } = await api.post('/api/payment/create-order', { planId }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "AdAlchemist",
                description: `Unlock Brand Intelligence Hub`,
                order_id: orderData.orderId,
                handler: async (response) => {
                    try {
                        const verifyToken = await getToken();
                        await api.post('/api/payment/verify-payment', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        }, { headers: { Authorization: `Bearer ${verifyToken}` } });
                        toast.success("Brand Hub successfully unlocked!");
                        window.location.reload();
                    } catch (e) {
                        toast.error("Payment verification failed");
                    }
                },
                prefill: { email: user?.primaryEmailAddress?.emailAddress },
                theme: { color: "#06b6d4" }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            toast.error("Failed to initiate purchase");
        } finally {
            setIsUnlocking(false);
        }
    };

    useEffect(() => {
        if (getToken) fetchBrandKits();
    }, [getToken]);

    const handleSwitchBrand = (id) => {
        const selected = brandKits.find(k => k.id === id);
        if (selected) {
            setBrandKit(selected);
            setCurrentKitId(id);
            setLogoFiles({ logoDark: null, logoLight: null });
        }
    };

    const handleCreateNew = () => {
        const newKit = {
            id: "new",
            name: "New Identity",
            primaryColor: "#06b6d4",
            secondaryColor: "#4f46e5",
            fontPrimary: "Inter",
            fontSecondary: "Montserrat",
            brandVoice: "Professional",
            targetAudience: "General",
            description: "",
            logoDark: "",
            logoLight: "",
            isDefault: false
        };
        setBrandKit(newKit);
        setCurrentKitId("new");
        setLogoFiles({ logoDark: null, logoLight: null });
    };

    const handleDelete = async () => {
        if (!currentKitId || currentKitId === "new" || currentKitId === "default") return;

        openConfirm({
            title: "Purge Identity",
            message: "Are you sure you want to delete this identity? All associated creative DNA will be permanently lost from AI memory.",
            confirmText: "Purge DNA",
            cancelText: "Keep Identity",
            type: "danger",
            onConfirm: async () => {
                closeModal();
                setIsDeleting(true);
                try {
                    const token = await getToken();
                    await api.delete(`/api/user/brand-kit/${currentKitId}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.success("Identity Purged from memory.");
                    await fetchBrandKits();
                } catch (error) {
                    toast.error("Deletion protocol failed.");
                } finally {
                    setIsDeleting(false);
                }
            }
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = await getToken();
            const formData = new FormData();

            Object.keys(brandKit).forEach(key => {
                if (key !== 'logoDark' && key !== 'id' && key !== 'logoLight' && key !== 'userId' && key !== 'createdAt' && key !== 'updatedAt') {
                    formData.append(key, brandKit[key]);
                }
            });

            // Always use currentKitId for the authoritative ID
            if (currentKitId && currentKitId !== "new" && currentKitId !== "default") {
                formData.append('id', currentKitId);
            }

            if (logoFiles.logoDark) formData.append('logoDark', logoFiles.logoDark);
            else if (brandKit.logoDark) formData.append('logoDark', brandKit.logoDark);

            if (logoFiles.logoLight) formData.append('logoLight', logoFiles.logoLight);
            else if (brandKit.logoLight) formData.append('logoLight', brandKit.logoLight);

            const { data } = await api.post('/api/user/brand-kit', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success("Brand IQ Updated! Generation AI redirected.");
            await fetchBrandKits();
        } catch (error) {
            console.error("Save error", error);
            toast.error("Protocol failed to update.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-cyan-500" size={48} />
            </div>
        );
    }


    return (
        <div className="min-h-screen text-white pt-32 pb-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12 border-b border-white/10 pb-12">
                <div className="flex-1">
                    <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                        <div className="p-3 bg-cyan-500 rounded-2xl shadow-xl shadow-cyan-500/20">
                            <Briefcase size={32} className="text-black" />
                        </div>
                        Brand Intelligence Hub
                    </h1>
                    <p className="text-gray-500 text-xs font-bold mt-3 uppercase tracking-[0.4em] ml-1">
                        Configure multiple identities for precision ad targeting.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-[#0A0A0A] border border-white/5 p-2 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
                        {brandKits.map(kit => (
                            <button
                                key={kit.id}
                                onClick={() => handleSwitchBrand(kit.id)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentKitId === kit.id ? 'bg-cyan-500 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                            >
                                {kit.name}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                if (!hasAccess && brandKits.length >= 1) {
                                    openConfirm({
                                        isOpen: true,
                                        type: 'info',
                                        title: 'Brand Hub Locked',
                                        message: 'Multiple brand identities is a premium feature. Unlock the Brand Intelligence Hub to manage unlimited brands & AI design DNA.',
                                        confirmText: 'View Plans →',
                                        cancelText: 'Maybe Later',
                                        onConfirm: () => { closeModal(); navigate('/plans'); },
                                    });
                                    return;
                                }
                                handleCreateNew();
                            }}
                            className={`p-2 aspect-square rounded-xl transition-all flex items-center justify-center ${(!hasAccess && brandKits.length >= 1) ? 'bg-white/5 text-gray-600' : 'bg-white/5 text-gray-400 hover:bg-cyan-500 hover:text-black'}`}
                            title={(!hasAccess && brandKits.length >= 1) ? "Unlock Premium for more brands" : "Create New Identity"}
                        >
                            {!hasAccess && brandKits.length >= 1 ? <Lock size={16} /> : <Plus size={16} />}
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {currentKitId && currentKitId !== "new" && currentKitId !== "default" && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-6 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Purge"}
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-4 bg-white text-black rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-3 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {currentKitId === "new" ? "Authorize Identity" : "Sync Brand IQ"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 mb-10">
                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                    <Briefcase size={18} className="text-cyan-500" />
                    Identity Core Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2 text-white">Identity Name</label>
                        <input
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs font-bold outline-none focus:border-cyan-500 transition-all"
                            placeholder="e.g. Nike Summer Ads"
                            value={brandKit.name}
                            onChange={(e) => setBrandKit({ ...brandKit, name: e.target.value })}
                        />
                    </div>
                    <div className="flex items-end pb-1">
                        <label className="flex items-center gap-4 cursor-pointer group bg-white/5 border border-white/10 p-4 rounded-xl w-full">
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={brandKit.isDefault}
                                onChange={(e) => setBrandKit({ ...brandKit, isDefault: e.target.checked })}
                            />
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${brandKit.isDefault ? 'bg-cyan-500 border-cyan-500' : 'border-white/10 group-hover:border-cyan-500/50'}`}>
                                {brandKit.isDefault && <Check size={16} className="text-black" />}
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">Set as Default Strategic Identity</span>
                        </label>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* Visual Assets Section */}
                <div className="lg:col-span-8 space-y-10">

                    {/* Logos */}
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8">
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                            <ImageIcon size={18} className="text-cyan-500" />
                            Visual Identity Tokens (Logos)
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Logo: Dark Mode / Color</label>
                                <div className="h-48 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/2 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative">
                                    {logoFiles.logoDark || brandKit.logoDark ? (
                                        <img
                                            src={logoFiles.logoDark ? URL.createObjectURL(logoFiles.logoDark) : optimizeImage(brandKit.logoDark, { height: 200 })}
                                            className="h-24 object-contain transition-transform group-hover:scale-110"
                                            alt="Dark logo"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <Upload className="text-gray-600" size={32} />
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setLogoFiles({ ...logoFiles, logoDark: e.target.files[0] })}
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 ml-2">Logo: Light Mode / White</label>
                                <div className="h-48 rounded-[2rem] border-2 border-dashed border-white/10 bg-white/2 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative">
                                    {logoFiles.logoLight || brandKit.logoLight ? (
                                        <img
                                            src={logoFiles.logoLight ? URL.createObjectURL(logoFiles.logoLight) : optimizeImage(brandKit.logoLight, { height: 200 })}
                                            className="h-24 object-contain filter invert opacity-80"
                                            alt="Light logo"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <Upload className="text-gray-600" size={32} />
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setLogoFiles({ ...logoFiles, logoLight: e.target.files[0] })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Palette & Typography */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-white">
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-10">
                            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Palette size={18} className="text-cyan-500" />
                                Color Profile
                            </h2>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Primary Hue</p>
                                        <p className="text-xs font-mono font-bold">{brandKit.primaryColor}</p>
                                    </div>
                                    <input
                                        type="color"
                                        value={brandKit.primaryColor}
                                        onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                                        className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-lg"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase">Secondary Hue</p>
                                        <p className="text-xs font-mono font-bold">{brandKit.secondaryColor}</p>
                                    </div>
                                    <input
                                        type="color"
                                        value={brandKit.secondaryColor}
                                        onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                                        className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-lg"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-10">
                            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Type size={18} className="text-cyan-500" />
                                Typography
                            </h2>
                            <div className="space-y-4">
                                <CustomDropdown
                                    label="Primary Face (Headings)"
                                    value={brandKit.fontPrimary}
                                    options={fonts}
                                    onChange={(val) => setBrandKit({ ...brandKit, fontPrimary: val })}
                                    icon={Type}
                                />
                            </div>
                            <div>
                                <CustomDropdown
                                    label="Secondary Face (Body)"
                                    value={brandKit.fontSecondary}
                                    options={fonts}
                                    onChange={(val) => setBrandKit({ ...brandKit, fontSecondary: val })}
                                    icon={Type}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Identity Sidebar */}
                <div className="lg:col-span-4 space-y-10 text-white">
                    <div className="bg-[#0A0A0A] border border-white/5 rounded-[3rem] p-10 space-y-8 h-full">
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
                            <ShieldCheck size={18} className="text-cyan-500" />
                            Identity Protocol
                        </h2>

                        <div className="space-y-6">
                            <CustomDropdown
                                label="Brand Voice"
                                icon={MessageSquare}
                                value={brandKit.brandVoice}
                                options={voices}
                                onChange={(val) => setBrandKit({ ...brandKit, brandVoice: val })}
                            />

                            <CustomDropdown
                                label="Target Psychometrics"
                                icon={Users}
                                value={brandKit.targetAudience}
                                options={audiences}
                                onChange={(val) => setBrandKit({ ...brandKit, targetAudience: val })}
                            />

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1 flex items-center gap-2">
                                    <Layout size={12} /> Narrative Description
                                </label>
                                <textarea
                                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold outline-none focus:border-cyan-500 resize-none h-40"
                                    placeholder="Briefly describe the brand's core mission and visual aesthetic..."
                                    value={brandKit.description}
                                    onChange={(e) => setBrandKit({ ...brandKit, description: e.target.value })}
                                />
                                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-2 ml-1 leading-relaxed">
                                    This data is used by the AI to align creative lighting, scene depth, and subject character to your unique brand DNA.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!hasAccess && (
                <div className="mt-20 border-t border-white/10 pt-20 max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-block p-4 bg-cyan-500/10 rounded-3xl mb-6">
                            <Sparkles size={32} className="text-cyan-500" />
                        </div>
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Master Your Multi-Brand Strategy</h2>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest max-w-lg mx-auto">
                            Unlock the ability to manage unlimited client portfolios, AI-native style kits, and professional identity syncing.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                        <button
                            disabled={isUnlocking}
                            onClick={handleCashUnlock}
                            className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-left hover:bg-white/10 transition-all active:scale-95 group relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Direct Access</h4>
                                {hasPro && <span className="text-[9px] bg-cyan-500 text-black px-2 py-0.5 rounded-full font-black">33% OFF</span>}
                            </div>
                            <p className="text-3xl font-black italic mb-2">₹{hasPro ? '199' : '299'}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Single Payment • Lifetime Access</p>
                        </button>

                        <button
                            disabled={isUnlocking}
                            onClick={handleCreditUnlock}
                            className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] text-left hover:bg-white/10 transition-all active:scale-95 group"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Credit Burn</h4>
                                {hasPro && <span className="text-[9px] bg-white text-black px-2 py-0.5 rounded-full font-black">PRO RATE</span>}
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-3xl font-black italic">{hasPro ? '500' : '750'}</p>
                                <Zap size={24} className="text-cyan-400 fill-cyan-400" />
                            </div>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Instant Activation</p>
                        </button>
                    </div>
                </div>
            )}

            <Modal
                {...modalConfig}
                onClose={closeModal}
                loading={isDeleting}
            />
        </div>
    );
};

export default BrandHub;
