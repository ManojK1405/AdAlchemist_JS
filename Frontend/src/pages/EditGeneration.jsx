import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2Icon, ArrowLeftIcon, Edit2Icon, SparkleIcon, Coins, Sparkles, PlayCircle, Image as ImageIcon, Wand2, Zap, Camera, Move, Layers, Settings2 } from "lucide-react";
import api from "../configs/axios";
import UploadZone from "../components/UploadZone";
import heic2any from "heic2any";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-hot-toast";

const IMAGE_PRESETS = [
    { label: "Cinematic", icon: <Camera size={14} />, prompt: " Cinematic lighting, 85mm lens, high contrast, dramatic shadows, premium feel." },
    { label: "Minimalist", icon: <Layers size={14} />, prompt: " Minimalist clean background, soft diffused lighting, white space, elegant product focus." },
    { label: "Vibrant", icon: <Zap size={14} />, prompt: " Vibrant bold colors, energetic lighting, sharp details, pop art aesthetic." },
    { label: "Luxury", icon: <Sparkles size={14} />, prompt: " Luxury setting, gold accents, soft bokeh, high-end commercial polish." }
];

const VIDEO_PRESETS = [
    { label: "Smooth Pan", icon: <Move size={14} />, prompt: " Smooth cinematic horizontal panning shot, slow motion, elegant reveal." },
    { label: "Dynamic Zoom", icon: <Zap size={14} />, prompt: " Dynamic slow zoom into the product, high energy, focus on details." },
    { label: "Parallax", icon: <Layers size={14} />, prompt: " Parallax motion effect, foreground and background moving at different speeds, depth focus." },
    { label: "Handheld", icon: <PlayCircle size={14} />, prompt: " Natural organic handheld camera movement, lifestyle feel, authentic motion." }
];

const EditGeneration = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [regenerating, setRegenerating] = useState(false);
    const [project, setProject] = useState(null);
    const [logoImage, setLogoImage] = useState(null);

    const [selectedImageIdx, setSelectedImageIdx] = useState(0);
    const [selectedVideoIdx, setSelectedVideoIdx] = useState(0);

    const [editMode, setEditMode] = useState("image");

    const [form, setForm] = useState({
        productName: "",
        productDescription: "",
        userPrompt: "",
        aspectRatio: "9:16",
        keepOriginalScene: true,
    });

    const [brandKit, setBrandKit] = useState(null);

    const fetchBrandKit = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get('/api/user/brand-kit', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBrandKit(data.brandKit);
        } catch (error) {
            console.error("Error fetching brand kit", error);
        }
    }

    // Fetch project
    const fetchProject = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setProject(data);
            setSelectedImageIdx(data.imageVersions?.length ? data.imageVersions.length - 1 : 0);
            setSelectedVideoIdx(data.videoVersions?.length ? data.videoVersions.length - 1 : 0);

            setForm({
                productName: data.productName || "",
                productDescription: data.productDescription || "",
                userPrompt: data.userPrompt || "",
                aspectRatio: data.aspectRatio || "9:16",
                keepOriginalScene: true,
            });

            setLoading(false);
        } catch (error) {
            toast.error("Failed to load project");
            navigate("/");
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchProject();
            fetchBrandKit();
        }
    }, [projectId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegenerate = async () => {
        try {
            setRegenerating(true);
            const token = await getToken();

            if (editMode === "image") {
                const formData = new FormData();
                formData.append('productName', form.productName);
                formData.append('productDescription', form.productDescription);
                formData.append('userPrompt', form.userPrompt);
                formData.append('aspectRatio', form.aspectRatio);
                formData.append('keepOriginalScene', form.keepOriginalScene);

                if (logoImage) {
                    formData.append('logo', logoImage);
                }

                await api.post(
                    `/api/project/${projectId}/edit`,
                    formData,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'multipart/form-data'
                        }
                    }
                );

                toast.success("Image regenerated successfully");
            }

            if (editMode === "video") {
                await api.post(
                    `/api/project/edit-video`,
                    {
                        projectId,
                        userPrompt: form.userPrompt,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                // toast.success("Video regeneration started");
            }

            // Refresh project to show new version
            await fetchProject();

        } catch (error) {
            toast.error(
                error?.response?.data?.message || "Regeneration failed"
            );
        } finally {
            setRegenerating(false);
        }
    };

    if (loading || !project) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2Icon className="animate-spin size-8 text-cyan-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-6 md:p-10 mt-16">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <button
                        onClick={() => navigate(`/result/${projectId}`)}
                        className="flex items-center gap-2 text-gray-400 hover:text-white"
                    >
                        <ArrowLeftIcon className="size-4" />
                        Back to Result
                    </button>

                    <h1 className="text-2xl font-semibold">
                        Edit Studio
                    </h1>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/pro-edit/${projectId}`)}
                            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition flex items-center gap-2"
                        >
                            <Settings2 size={14} className="text-cyan-400" />
                            Switch to Pro Studio
                        </button>
                        <div className="text-sm text-gray-400">
                            Cost: {editMode === "image" ? "5" : "20"} Credits
                        </div>
                    </div>
                </div>

                {/* Toggle (only if video exists) */}
                {project.generatedVideo && (
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/5 rounded-xl p-1 flex">
                            <button
                                onClick={() => setEditMode("image")}
                                className={`px-4 py-2 rounded-lg transition ${editMode === "image"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-400"
                                    }`}
                            >
                                Edit Image
                            </button>

                            <button
                                onClick={() => setEditMode("video")}
                                className={`px-4 py-2 rounded-lg transition ${editMode === "video"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-400"
                                    }`}
                            >
                                Edit Video
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-3 gap-10">

                    {/* LEFT SIDE: Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="relative rounded-3xl overflow-hidden border border-white/10 h-[600px] flex items-center justify-center bg-black/20">

                            {regenerating && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                                    <Loader2Icon className="animate-spin size-10 text-cyan-400" />
                                </div>
                            )}

                            {editMode === "video" && project.generatedVideo ? (
                                <video
                                    src={project.videoVersions?.[selectedVideoIdx] || project.generatedVideo}
                                    controls
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <img
                                    src={project.imageVersions?.[selectedImageIdx] || project.generatedImage}
                                    alt="Preview"
                                    className="w-full h-full object-contain"
                                />
                            )}
                        </div>

                        {/* Version Selector */}
                        {editMode === "image" && project.imageVersions?.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} /> Version History
                                </h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {project.imageVersions.map((ver, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedImageIdx(idx)}
                                            className={`relative shrink-0 w-24 h-32 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedImageIdx === idx ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <img src={ver} alt={`Version ${idx + 1}`} className="w-full h-full object-cover" />
                                            <div className="absolute top-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10">v{idx + 1}</div>
                                            {selectedImageIdx === idx && (
                                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 bg-cyan-600 px-2 py-0.5 rounded-md text-[9px] font-bold">Selected</div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {editMode === "video" && project.videoVersions?.length > 0 && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Layers size={14} /> Version History
                                </h3>
                                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {project.videoVersions.map((ver, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedVideoIdx(idx)}
                                            className={`relative shrink-0 w-32 h-24 rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedVideoIdx === idx ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'border-transparent opacity-60 hover:opacity-100 bg-white/5'}`}
                                        >
                                            <video src={ver} className="w-full h-full object-cover absolute inset-0 opacity-40" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <PlayCircle className={`size-6 ${selectedVideoIdx === idx ? 'text-cyan-400' : 'text-white'}`} />
                                            </div>
                                            <div className="absolute top-1.5 left-1.5 bg-black/80 px-2 py-0.5 rounded-md text-[10px] font-bold border border-white/10 z-10">v{idx + 1}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: Controls */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                    <Edit2Icon size={14} /> Global Settings
                                </h3>
                                {brandKit && (
                                    <div className="flex items-center gap-2 px-2 py-1 bg-white/5 border border-white/10 rounded-lg">
                                        <div
                                            className="w-3 h-3 rounded-full border border-white/20"
                                            style={{ backgroundColor: brandKit.color }}
                                        />
                                        <span className="text-[9px] font-bold text-gray-500 uppercase">{brandKit.voice} DNA</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Product Identity</label>
                                    <input
                                        name="productName"
                                        value={form.productName}
                                        onChange={handleChange}
                                        placeholder="Product Name"
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 transition-all outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Creative Context</label>
                                    <textarea
                                        name="productDescription"
                                        value={form.productDescription}
                                        onChange={handleChange}
                                        placeholder="Describe the product use case..."
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Brand Logo</label>
                                    <UploadZone
                                        label="Change Logo"
                                        file={logoImage || (project.brandLogo ? { name: "Current Logo" } : null)}
                                        onClear={() => {
                                            setLogoImage(null);
                                            // Note: We don't clear project.brandLogo from DB here, 
                                            // just the local selection for this edit.
                                        }}
                                        onChange={async (e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                let file = e.target.files[0];
                                                if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
                                                    const toastId = toast.loading("Converting logo...");
                                                    try {
                                                        const blob = await heic2any({ blob: file, toType: "image/jpeg" });
                                                        file = new File([Array.isArray(blob) ? blob[0] : blob], "logo.jpg", { type: "image/jpeg" });
                                                        toast.success("Logo ready!", { id: toastId });
                                                    } catch (err) {
                                                        toast.error("Format conversion failed", { id: toastId });
                                                        return;
                                                    }
                                                }
                                                setLogoImage(file);
                                            }
                                        }}
                                    />
                                    {project.brandLogo && !logoImage && (
                                        <div className="mt-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                                            <img src={project.brandLogo} alt="Logo" className="w-8 h-8 object-contain rounded" />
                                            <span className="text-[8px] text-gray-400">Current Logo Active</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                                <Wand2 size={14} /> AI Direction
                            </h3>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {(editMode === "image" ? IMAGE_PRESETS : VIDEO_PRESETS).map((preset) => {
                                        const isActive = form.userPrompt.includes(preset.prompt.trim());
                                        return (
                                            <button
                                                key={preset.label}
                                                onClick={() => {
                                                    const p = preset.prompt.trim();
                                                    setForm(prev => {
                                                        const hasPrompt = prev.userPrompt.includes(p);
                                                        let newPrompt = prev.userPrompt;
                                                        if (hasPrompt) {
                                                            newPrompt = newPrompt.split(p).join("").replace(/\s+/g, " ").trim();
                                                        } else {
                                                            newPrompt = (newPrompt + " " + p).trim();
                                                        }
                                                        return { ...prev, userPrompt: newPrompt };
                                                    });
                                                }}
                                                className={`px-3 py-1.5 rounded-full border text-[10px] font-bold transition-all flex items-center gap-1.5 ${isActive
                                                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                                                    }`}
                                            >
                                                {preset.icon}
                                                {preset.label}
                                            </button>
                                        );
                                    })}
                                    {editMode === "image" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const fidelity = "Priority: Subject Identity / Face Structure.";
                                                setForm(prev => {
                                                    const hasFidelity = prev.userPrompt.includes(fidelity);
                                                    let newPrompt = prev.userPrompt;
                                                    if (hasFidelity) {
                                                        newPrompt = newPrompt.split(fidelity).join("").replace(/\s+/g, " ").trim();
                                                    } else {
                                                        newPrompt = (newPrompt + " " + fidelity).trim();
                                                    }
                                                    return { ...prev, userPrompt: newPrompt };
                                                });
                                            }}
                                            className={`w-full mt-4 flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${form.userPrompt.includes('Priority: Subject Identity / Face Structure.')
                                                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${form.userPrompt.includes('Priority: Subject Identity / Face Structure.') ? 'bg-emerald-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                                    <Sparkles size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-xs font-semibold">Strict Subject Identity</div>
                                                    <div className="text-[10px] opacity-60">Prioritize exact facial preservation</div>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${form.userPrompt.includes('Priority: Subject Identity / Face Structure.') ? 'bg-emerald-500' : 'bg-white/20'}`}>
                                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${form.userPrompt.includes('Priority: Subject Identity / Face Structure.') ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </button>
                                    )}

                                    {editMode === "image" && (
                                        <button
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, keepOriginalScene: !prev.keepOriginalScene }))}
                                            className={`w-full mt-2 flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${form.keepOriginalScene
                                                ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                                                : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${form.keepOriginalScene ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                                                    <Layers size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-xs font-semibold">Preserve Original Scene</div>
                                                    <div className="text-[10px] opacity-60">Maintain composition and lighting</div>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${form.keepOriginalScene ? 'bg-cyan-500' : 'bg-white/20'}`}>
                                                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${form.keepOriginalScene ? 'translate-x-4' : 'translate-x-0'}`} />
                                            </div>
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    name="userPrompt"
                                    value={form.userPrompt}
                                    onChange={handleChange}
                                    placeholder={
                                        editMode === "video"
                                            ? "Describe motion, camera movement, energy..."
                                            : "Describe creative direction, lighting, mood..."
                                    }
                                    rows={4}
                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/50 transition-all outline-none resize-none px-4"
                                />
                            </div>

                            {editMode === "image" && (
                                <div className="space-y-3">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Framing & Ratio</label>
                                    <div className="flex gap-2">
                                        {[
                                            { id: '9:16', label: '9:16' },
                                            { id: '1:1', label: '1:1' },
                                            { id: '16:9', label: '16:9' },
                                        ].map((ratio) => (
                                            <button
                                                key={ratio.id}
                                                type="button"
                                                onClick={() => setForm({ ...form, aspectRatio: ratio.id })}
                                                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${form.aspectRatio === ratio.id
                                                    ? 'bg-cyan-600 border-cyan-500 text-white shadow-lg shadow-cyan-500/20'
                                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                {ratio.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-600 hover:tracking-widest transition-all flex items-center justify-center gap-3 font-bold shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50"
                            >
                                {regenerating ? (
                                    <Loader2Icon className="animate-spin size-5" />
                                ) : (
                                    <SparkleIcon size={18} />
                                )}
                                {editMode === "image"
                                    ? "Regenerate Image"
                                    : "Regenerate Video"}
                            </button>

                            <div className="flex items-center justify-center gap-2 py-2 px-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                <Coins size={14} className="text-yellow-500" />
                                <span className="text-[10px] font-bold text-yellow-500 uppercase">
                                    Costs {editMode === "image" ? "5" : "20"} Credits
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditGeneration;
