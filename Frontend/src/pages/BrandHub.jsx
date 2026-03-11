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
        <div className="relative min-h-screen text-white pt-32 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
            {/* Premium Background Elements */}
            <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none -z-10 animate-pulse" />
            <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-fuchsia-500/5 blur-[100px] rounded-full pointer-events-none -z-10" />
            
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-16 relative">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-[9px] font-black text-cyan-400 uppercase tracking-widest">Enterprise Access</span>
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest">Creative Engine v4.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none">
                        Identity <span className="text-cyan-500 italic">Hub.</span>
                    </h1>
                    <p className="text-gray-500 text-sm font-bold mt-4 uppercase tracking-[0.4em] ml-1 max-w-xl leading-relaxed">
                        Strategize multiple brand genomes for precision AI targeting and visual consistency.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-2.5 rounded-[2rem] shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                        {brandKits.map(kit => (
                            <button
                                key={kit.id}
                                onClick={() => handleSwitchBrand(kit.id)}
                                className={`px-6 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${currentKitId === kit.id ? 'bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105' : 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                            className={`p-2.5 aspect-square rounded-xl transition-all flex items-center justify-center ${(!hasAccess && brandKits.length >= 1) ? 'bg-white/5 text-gray-600' : 'bg-white/5 text-gray-400 hover:bg-cyan-500 hover:text-black hover:scale-110'}`}
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
                                className="px-6 py-4 bg-red-500/5 text-red-500 border border-red-500/20 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Purge"}
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-4 bg-white text-black rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest hover:bg-cyan-400 transition-all flex items-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {currentKitId === "new" ? "Authorize Identity" : "Update Genome"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 mb-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none" />
                <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3 mb-10">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <Briefcase size={14} className="text-cyan-500" />
                    </div>
                    Core Authentication
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
                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 space-y-10 shadow-2xl relative">
                        <div className="absolute top-10 right-10 opacity-10 blur-xl">
                            <Zap size={100} className="text-cyan-500" />
                        </div>
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <ImageIcon size={14} className="text-cyan-500" />
                            </div>
                            Genetic Visual Tokens
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Master Signature (Dark)</label>
                                <div className="h-60 rounded-[2.5rem] border border-white/10 bg-black/40 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative shadow-inner">
                                    {logoFiles.logoDark || brandKit.logoDark ? (
                                        <img
                                            src={logoFiles.logoDark ? URL.createObjectURL(logoFiles.logoDark) : optimizeImage(brandKit.logoDark, { height: 200 })}
                                            className="h-28 object-contain transition-all duration-700 group-hover:scale-110 drop-shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                                            alt="Dark logo"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="text-gray-700 group-hover:text-cyan-500 transition-colors" size={32} />
                                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-tighter">Click to Upload</span>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => setLogoFiles({ ...logoFiles, logoDark: e.target.files[0] })}
                                    />
                                </div>
                            </div>

                            <div className="group relative">
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 ml-2">Inverse Signature (Light)</label>
                                <div className="h-60 rounded-[2.5rem] border border-white/10 bg-white/40 hover:bg-white/50 transition-all flex flex-col items-center justify-center gap-4 overflow-hidden relative shadow-inner">
                                    {logoFiles.logoLight || brandKit.logoLight ? (
                                        <img
                                            src={logoFiles.logoLight ? URL.createObjectURL(logoFiles.logoLight) : optimizeImage(brandKit.logoLight, { height: 200 })}
                                            className="h-28 object-contain filter drop-shadow-lg"
                                            alt="Light logo"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <Upload className="text-gray-400 group-hover:text-black transition-colors" size={32} />
                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">Click to Upload</span>
                                        </div>
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
                        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 space-y-12 shadow-2xl overflow-hidden relative group">
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/5 blur-3xl pointer-events-none transition-all group-hover:bg-cyan-500/10" />
                            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/10 rounded-lg">
                                    <Palette size={14} className="text-cyan-500" />
                                </div>
                                Color Archetype
                            </h2>
                            <div className="space-y-8">
                                <div className="flex items-center justify-between p-6 bg-black/40 border border-white/10 rounded-[2rem] hover:border-cyan-500/30 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Primary DNA</p>
                                        <p className="text-sm font-mono font-bold text-cyan-400 mt-1">{brandKit.primaryColor}</p>
                                    </div>
                                    <div className="relative group/picker">
                                        <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover/picker:opacity-20 transition-all" />
                                        <input
                                            type="color"
                                            value={brandKit.primaryColor}
                                            onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                                            className="w-16 h-16 bg-transparent border-none cursor-pointer rounded-2xl relative z-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-6 bg-black/40 border border-white/10 rounded-[2rem] hover:border-cyan-500/30 transition-all">
                                    <div>
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Secondary DNA</p>
                                        <p className="text-sm font-mono font-bold text-gray-400 mt-1">{brandKit.secondaryColor}</p>
                                    </div>
                                    <div className="relative group/picker">
                                        <div className="absolute inset-0 bg-white blur-md opacity-0 group-hover/picker:opacity-20 transition-all" />
                                        <input
                                            type="color"
                                            value={brandKit.secondaryColor}
                                            onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                                            className="w-16 h-16 bg-transparent border-none cursor-pointer rounded-2xl relative z-10"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 space-y-12 shadow-2xl relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-500/5 blur-3xl pointer-events-none transition-all group-hover:bg-fuchsia-500/10" />
                            <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                                <div className="p-2 bg-fuchsia-500/10 rounded-lg">
                                    <Type size={14} className="text-fuchsia-400" />
                                </div>
                                Typographic Matrix
                            </h2>
                            <div className="space-y-6">
                                <CustomDropdown
                                    label="Authority Face"
                                    value={brandKit.fontPrimary}
                                    options={fonts}
                                    onChange={(val) => setBrandKit({ ...brandKit, fontPrimary: val })}
                                    icon={Type}
                                />
                                <CustomDropdown
                                    label="Narrative Face"
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
                    <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[3rem] p-12 space-y-10 h-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-cyan-500/[0.02] to-transparent pointer-events-none" />
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em] flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg">
                                <ShieldCheck size={14} className="text-cyan-500" />
                            </div>
                            Sychological DNA
                        </h2>

                        <div className="space-y-8">
                            <CustomDropdown
                                label="Authority Tone"
                                icon={MessageSquare}
                                value={brandKit.brandVoice}
                                options={voices}
                                onChange={(val) => setBrandKit({ ...brandKit, brandVoice: val })}
                            />

                            <CustomDropdown
                                label="Target Matrix"
                                icon={Users}
                                value={brandKit.targetAudience}
                                options={audiences}
                                onChange={(val) => setBrandKit({ ...brandKit, targetAudience: val })}
                            />

                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase ml-1 mb-3 flex items-center gap-2 tracking-widest leading-none">
                                    Strategic Blueprint
                                </label>
                                <textarea
                                    className="w-full mt-2 bg-black/40 border border-white/5 rounded-[2rem] px-6 py-6 text-xs font-bold outline-none focus:border-cyan-500/50 transition-all resize-none h-60 shadow-inner group-hover:bg-black/60"
                                    placeholder="Briefly describe the brand's core mission and visual aesthetic..."
                                    value={brandKit.description}
                                    onChange={(e) => setBrandKit({ ...brandKit, description: e.target.value })}
                                />
                                <div className="flex items-start gap-2 mt-6 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                                    <Zap size={14} className="text-cyan-500 shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-cyan-400/60 font-black uppercase tracking-widest leading-relaxed">
                                        This protocol is utilized by the AI to synthesize custom lighting, frame depth, and texture mappings unique to your brand DNA.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {!hasAccess && (
                <div className="mt-32 border-t border-white/10 pt-32 max-w-5xl mx-auto relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-cyan-500/5 blur-[150px] pointer-events-none -z-10" />
                    
                    <div className="text-center mb-16 px-6">
                        <div className="inline-flex p-4 bg-cyan-500/10 rounded-[2rem] mb-8 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
                            <Sparkles size={40} className="text-cyan-500 animate-pulse" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-tight">Master Your <span className="text-cyan-500 italic">Strategic Canvas.</span></h2>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-[0.3em] max-w-2xl mx-auto leading-relaxed">
                            Unlock unlimited brand genomes, complex target segmenting, and cross-platform identity syncing. 
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-32 px-6">
                        <button
                            disabled={isUnlocking}
                            onClick={handleCashUnlock}
                            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] text-left hover:bg-white/[0.07] hover:border-cyan-500/30 transition-all active:scale-95 group relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-20 transition-opacity">
                                <Zap size={80} className="text-cyan-500" />
                            </div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="px-4 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Direct Protocol</h4>
                                </div>
                                {hasPro && <span className="text-[10px] bg-cyan-500 text-black px-3 py-1 rounded-full font-black">PROFESSIONAL REBATE</span>}
                            </div>
                            <div className="flex items-baseline gap-2 mb-4">
                                <p className="text-5xl font-black italic tracking-tighter">₹{hasPro ? '199' : '299'}</p>
                                <span className="text-gray-600 font-extrabold uppercase text-[10px] tracking-widest">/ Lifetime</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Permanent Hub Activation • Priority AI Synthesis • Unlimited Architective Control</p>
                        </button>

                        <button
                            disabled={isUnlocking}
                            onClick={handleCreditUnlock}
                            className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-10 rounded-[3rem] text-left hover:bg-white/[0.07] hover:border-fuchsia-500/30 transition-all active:scale-95 group relative shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-20 transition-opacity">
                                <Zap size={80} className="text-fuchsia-500" />
                            </div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="px-4 py-1.5 bg-fuchsia-400/10 border border-fuchsia-400/20 rounded-full">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">Neural Burn</h4>
                                </div>
                                {hasPro && <span className="text-[10px] bg-white text-black px-3 py-1 rounded-full font-black">PRO OVERHEAD</span>}
                            </div>
                            <div className="flex items-end gap-3 mb-4">
                                <p className="text-5xl font-black italic tracking-tighter text-white">{hasPro ? '500' : '750'}</p>
                                <Zap size={28} className="text-fuchsia-400 fill-fuchsia-400 mb-2" />
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Instant IQ Transfer • Project Resource Allocation • Secure Creative Encryption</p>
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
