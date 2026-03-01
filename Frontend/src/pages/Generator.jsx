import { useState, useEffect } from "react"
import { Loader2, Camera, Video, User, Layers, Zap, Sparkles, Palette, MessageSquare, ChevronDown, Check, Coins, Clock } from "lucide-react"
import Title from "../components/Title"
import UploadZone from "../components/UploadZone"
import { useAuth, useUser } from "@clerk/clerk-react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-hot-toast"
import api from "../configs/axios"
import heic2any from "heic2any"

const Generator = () => {

    const { user } = useUser()
    const { getToken } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('')
    const [productName, setProductName] = useState('')
    const [productDescription, setProductDescription] = useState('')
    const [aspectRatio, setAspectRatio] = useState('9:16')
    const [productImage, setProductImage] = useState(null)
    const [modelImage, setModelImage] = useState(null)
    const [logoImage, setLogoImage] = useState(null)
    const [userPrompt, setUserPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isQueuing, setIsQueuing] = useState(false)
    const [isVoiceDropdownOpen, setIsVoiceDropdownOpen] = useState(false)
    const [hasPipelineAccess, setHasPipelineAccess] = useState(false);
    const [brandKit, setBrandKit] = useState({
        color: '#06b6d4',
        voice: ''
    });

    const voices = [
        { name: 'Professional', desc: 'Trustworthy and corporate' },
        { name: 'Casual', desc: 'Friendly and conversational' },
        { name: 'Witty', desc: 'Humorous and sharp' },
        { name: 'Luxury', desc: 'Sophisticated and elegant' },
        { name: 'Bold', desc: 'High energy and impactful' }
    ];

    const fetchUserStatus = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/credits', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHasPipelineAccess(data.hasPipelineAccess);
        } catch (error) {
            console.error("Error fetching user status", error);
        }
    }

    const fetchBrandKit = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/brand-kit', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.brandKit) {
                setBrandKit(data.brandKit);
            }
        } catch (error) {
            console.error("Error fetching brand kit", error);
        }
    }

    useEffect(() => {
        if (getToken) {
            fetchBrandKit();
            fetchUserStatus();
        }
    }, [getToken]);

    const handleFileChange = async (e, type) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];

            if (file.type === "image/heic" || file.type === "image/heif" || file.name.toLowerCase().endsWith(".heic")) {
                const toastId = toast.loading("Converting iPhone image format...");
                try {
                    const blob = await heic2any({
                        blob: file,
                        toType: "image/jpeg",
                        quality: 0.8
                    });

                    const finalBlob = Array.isArray(blob) ? blob[0] : blob;
                    file = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                        type: "image/jpeg",
                    });
                    toast.success("Image optimized!", { id: toastId });
                } catch (error) {
                    console.error("HEIC conversion failed", error);
                    toast.error("Failed to process HEIC file. Please try a different image.", { id: toastId });
                    return;
                }
            }

            if (type === 'product') setProductImage(file)
            else if (type === 'model') setModelImage(file)
            else if (type === 'logo') setLogoImage(file)
        }
    }

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!user) return toast("Please sign in to generate images");
        if (!productImage || !modelImage || !name || !productName || !aspectRatio) {
            return toast("Please fill in all required fields");
        }

        try {
            setIsGenerating(true);
            const token = await getToken();

            // ✅ Save/Update Brand Kit First
            await api.post('/api/user/brand-kit', brandKit, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const formData = new FormData();
            formData.append('name', name);
            formData.append('productName', productName);
            formData.append('productDescription', productDescription);
            formData.append('aspectRatio', aspectRatio);
            formData.append('userPrompt', userPrompt);
            formData.append('images', productImage);
            formData.append('images', modelImage);
            if (logoImage) formData.append('logo', logoImage);

            const { data } = await api.post('/api/project/create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Project created successfully");
            navigate(`/result/${data.projectId}`);
        } catch (error) {
            setIsGenerating(false);
            toast.error(error?.response?.data?.message || "Failed to generate project");
        }
    }

    const handleQueue = async (e) => {
        e.preventDefault();
        if (!user) return toast("Please sign in to schedule generations");
        if (!hasPipelineAccess) {
            toast.error("Pipeline Scheduling is a Pro feature. Please unlock it to continue.");
            navigate('/plans');
            return;
        }
        if (!productImage || !modelImage || !name || !productName || !aspectRatio) {
            return toast("Please fill in all required fields");
        }

        try {
            setIsQueuing(true);
            const token = await getToken();

            // 1. Create project with queueOnly flag
            const formData = new FormData();
            formData.append('name', name);
            formData.append('productName', productName);
            formData.append('productDescription', productDescription);
            formData.append('aspectRatio', aspectRatio);
            formData.append('userPrompt', userPrompt);
            formData.append('images', productImage);
            formData.append('images', modelImage);
            formData.append('queueOnly', 'true');
            if (logoImage) formData.append('logo', logoImage);

            const { data: projectData } = await api.post('/api/project/create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 2. Add to actual queue
            await api.post('/api/project/queue', {
                projectId: projectData.projectId,
                type: 'IMAGE',
                payload: {
                    productName,
                    productDescription,
                    userPrompt,
                    aspectRatio,
                    brandKit
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Added to Pipeline!");
            setIsQueuing(false);
            navigate('/my-generations');
        } catch (error) {
            setIsQueuing(false);
            toast.error(error?.response?.data?.message || "Failed to queue generation");
        }
    };

    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28">
            <form onSubmit={handleGenerate} className="max-w-6xl mx-auto space-y-12">

                <Title
                    heading="Create In-Context Image"
                    description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* LEFT SIDE */}
                    <div className="flex flex-col gap-8 ">
                        <UploadZone
                            label="Product Image"
                            file={productImage}
                            onClear={() => setProductImage(null)}
                            onChange={(e) => handleFileChange(e, 'product')}
                        />

                        <UploadZone
                            label="Model Image"
                            file={modelImage}
                            onClear={() => setModelImage(null)}
                            onChange={(e) => handleFileChange(e, 'model')}
                        />

                        <UploadZone
                            label="Brand Logo (Optional)"
                            file={logoImage}
                            onClear={() => setLogoImage(null)}
                            onChange={(e) => handleFileChange(e, 'logo')}
                        />
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="space-y-6">

                        {/* Project Name */}
                        <div>
                            <label className="block text-sm mb-2">Project Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                type="text"
                                placeholder="Name your project"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Brand Identity Section */}
                        <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] space-y-6">
                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={16} /> Brand Identity Protocol
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Color */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Signature Color</label>
                                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
                                        <input
                                            type="color"
                                            value={brandKit.color}
                                            onChange={(e) => setBrandKit({ ...brandKit, color: e.target.value })}
                                            className="w-10 h-10 rounded-lg bg-transparent border-none cursor-pointer"
                                        />
                                        <div className="text-xs font-mono uppercase font-bold tracking-wider">{brandKit.color}</div>
                                    </div>
                                </div>

                                {/* Voice */}
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Brand Voice</label>
                                    <div className="relative">

                                        <div
                                            onClick={() => setIsVoiceDropdownOpen(!isVoiceDropdownOpen)}
                                            className={`w-full bg-white/5 border ${isVoiceDropdownOpen ? 'border-cyan-500' : 'border-white/10'} hover:border-white/20 rounded-xl pl-4 pr-10 py-[11px] text-xs cursor-pointer text-gray-200 transition-all flex items-center justify-between`}
                                        >
                                            <span>
                                                {voices.find(v => v.name === brandKit.voice)?.name || (brandKit.voice ? 'Custom Mode...' : 'Select Voice...')}
                                            </span>
                                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isVoiceDropdownOpen ? 'rotate-180' : ''}`} />
                                        </div>

                                        {isVoiceDropdownOpen && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setIsVoiceDropdownOpen(false)}></div>
                                                <div className="absolute top-full mt-2 w-full bg-[#111] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-20 py-2 origin-top animate-in fade-in zoom-in-95 duration-200">

                                                    {voices.map(v => (
                                                        <div
                                                            key={v.name}
                                                            onClick={() => {
                                                                setBrandKit({ ...brandKit, voice: v.name });
                                                                setIsVoiceDropdownOpen(false);
                                                            }}
                                                            className="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className={`text-xs font-semibold ${brandKit.voice === v.name ? 'text-cyan-400' : 'text-gray-200 group-hover:text-white'}`}>{v.name}</span>
                                                                <span className="text-[10px] text-gray-500">{v.desc}</span>
                                                            </div>
                                                            {brandKit.voice === v.name && <Check size={14} className="text-cyan-400" />}
                                                        </div>
                                                    ))}

                                                    <div className="h-px bg-white/10 my-1 mx-2"></div>

                                                    <div
                                                        onClick={() => {
                                                            if (voices.some(v => v.name === brandKit.voice)) {
                                                                setBrandKit({ ...brandKit, voice: 'Custom' });
                                                            }
                                                            setIsVoiceDropdownOpen(false);
                                                        }}
                                                        className="px-4 py-2.5 hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-colors"
                                                    >
                                                        <span className={`text-xs font-semibold ${brandKit.voice !== "" && !voices.some(v => v.name === brandKit.voice) ? 'text-cyan-400' : 'text-gray-200 group-hover:text-white'}`}>Custom Mode...</span>
                                                        {brandKit.voice !== "" && !voices.some(v => v.name === brandKit.voice) && <Check size={14} className="text-cyan-400" />}
                                                    </div>

                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {!voices.some(v => v.name === brandKit.voice) && brandKit.voice !== "" && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Custom Voice Description</label>
                                    <input
                                        type="text"
                                        value={brandKit.voice}
                                        onChange={(e) => setBrandKit({ ...brandKit, voice: e.target.value })}
                                        placeholder="e.g. Moody Cyberpunk, Minimalist Luxury"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-cyan-500"
                                    />
                                </div>
                            )}

                            {brandKit.voice === "" && (
                                <p className="text-[10px] text-gray-500 italic">
                                    Define your brand color and mood. These settings will automatically refine the AI's creative direction.
                                </p>
                            )}
                        </div>

                        {/* Product Name */}
                        <div>
                            <label className="block text-sm mb-2">Product Name</label>
                            <input
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                type="text"
                                placeholder="Enter the name of the product"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Product Description */}
                        <div>
                            <label className="block text-sm mb-2">
                                Product Description <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                rows={3}
                                placeholder="Enter the description of the product"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Aspect Ratio */}
                        <div>
                            <label className="block text-sm mb-3">Aspect Ratio</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('9:16')}
                                    className={`h-14 w-12 rounded-lg border flex items-center justify-center transition ${aspectRatio === '9:16'
                                        ? 'border-cyan-500 bg-cyan-500/10'
                                        : 'border-white/10 hover:border-cyan-500/40'
                                        }`}
                                >
                                    <div className="h-8 w-4 border border-white/50 rounded-sm" />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setAspectRatio('16:9')}
                                    className={`h-14 w-16 rounded-lg border flex items-center justify-center transition ${aspectRatio === '16:9'
                                        ? 'border-cyan-500 bg-cyan-500/10'
                                        : 'border-white/10 hover:border-cyan-500/40'
                                        }`}
                                >
                                    <div className="h-4 w-8 border border-white/50 rounded-sm" />
                                </button>
                            </div>
                        </div>

                        {/* User Prompt */}
                        <div>
                            <label className="block text-sm mb-2">
                                Custom Creative Direction <span className="text-gray-400">(optional)</span>
                            </label>
                            <textarea
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                rows={2}
                                placeholder="e.g. Add golden hour lighting, cinematic atmosphere..."
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 resize-none focus:outline-none focus:border-cyan-500"
                            />
                        </div>

                        {/* Pro Options */}
                        <div className="pt-6 border-t border-white/5 space-y-6">
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Creative Narrative Style</h4>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'Cinematic', icon: <Camera size={14} />, label: 'Cinematic' },
                                        { id: 'Studio Professional', icon: <Video size={14} />, label: 'Studio' },
                                        { id: 'Lifestyle', icon: <User size={14} />, label: 'Lifestyle' },
                                        { id: 'Minimalist', icon: <Layers size={14} />, label: 'Minimalist' },
                                        { id: 'Vibrant UGC', icon: <Zap size={14} />, label: 'Vibrant' },
                                    ].map((style) => (
                                        <button
                                            key={style.id}
                                            type="button"
                                            onClick={() => {
                                                const styleTag = `Style: ${style.id}.`;
                                                setUserPrompt(prev => {
                                                    if (prev.includes(styleTag)) return prev.replace(styleTag, '').trim();
                                                    // Remove any existing style tag first
                                                    const cleaned = prev.replace(/Style:.*?\./, '').trim();
                                                    return `${cleaned} ${styleTag}`.trim();
                                                });
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all duration-300 ${userPrompt.includes(`Style: ${style.id}`)
                                                ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:bg-white/10'
                                                }`}
                                        >
                                            {style.icon}
                                            {style.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">Subject Fidelity</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const fidelity = 'Priority: Subject Identity / Face Structure.';
                                            setUserPrompt(prev => {
                                                if (prev.includes('Priority: Subject Identity')) return prev.replace(fidelity, '').trim();
                                                return `${prev} ${fidelity}`.trim();
                                            });
                                        }}
                                        className={`w-full group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${userPrompt.includes('Priority: Subject Identity')
                                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${userPrompt.includes('Priority: Subject Identity') ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                                <Sparkles size={16} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-sm font-semibold">Strict Subject Identity</div>
                                                <div className="text-[10px] opacity-60">Prioritize exact face structure and bone identity</div>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-5 rounded-full p-1 transition-colors ${userPrompt.includes('Priority: Subject Identity') ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                            <div className={`w-3 h-3 rounded-full bg-white transition-transform ${userPrompt.includes('Priority: Subject Identity') ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* GENERATE BUTTON */}
                <div className="flex flex-col items-center gap-6 pt-6">
                    <div className="flex items-center gap-8 py-3 px-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <Coins size={14} className="text-yellow-500" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Image:</span>
                            <span className="text-sm font-black text-white">10</span>
                        </div>
                        <div className="w-px h-4 bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Video size={14} className="text-cyan-400" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Video:</span>
                            <span className="text-sm font-black text-white">40</span>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full justify-center px-4">
                        <button
                            type="submit"
                            disabled={isGenerating || isQueuing}
                            className="flex-1 max-w-sm group relative px-8 py-5 rounded-2xl bg-gradient-to-r from-cyan-600 to-cyan-500 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    Initialize Now
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleQueue}
                            disabled={isGenerating || isQueuing}
                            className="flex-1 max-w-sm group relative px-8 py-5 rounded-2xl bg-white/5 border border-white/10 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isQueuing ? (
                                <>
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    Queuing...
                                </>
                            ) : (
                                <>
                                    <Clock size={16} />
                                    Schedule in Pipeline
                                </>
                            )}
                        </button>
                    </div>

                    {user && (
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                            Deducts <span className="text-cyan-400">10 Credits</span> on success
                        </p>
                    )}
                </div>


            </form>

        </div>
    )
}

export default Generator
