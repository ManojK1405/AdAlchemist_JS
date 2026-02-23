import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2Icon, ArrowLeftIcon, Edit2Icon, SparkleIcon, Coins, Sparkles, PlayCircle, Image as ImageIcon, Wand2, Zap, Camera, Move, Layers } from "lucide-react";
import api from "../configs/axios";
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

    const [editMode, setEditMode] = useState("image");

    const [form, setForm] = useState({
        productName: "",
        productDescription: "",
        userPrompt: "",
        aspectRatio: "9:16",
    });

    // Fetch project
    const fetchProject = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setProject(data);

            setForm({
                productName: data.productName || "",
                productDescription: data.productDescription || "",
                userPrompt: data.userPrompt || "",
                aspectRatio: data.aspectRatio || "9:16",
            });

            setLoading(false);
        } catch (error) {
            toast.error("Failed to load project");
            navigate("/");
        }
    };

    useEffect(() => {
        if (projectId) fetchProject();
    }, [projectId]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleRegenerate = async () => {
        try {
            setRegenerating(true);
            const token = await getToken();

            if (editMode === "image") {
                await api.post(
                    `/api/project/${projectId}/edit`,
                    form,
                    { headers: { Authorization: `Bearer ${token}` } }
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

                toast.success("Video regeneration started");
            }

            navigate(`/result/${projectId}`);

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
                <Loader2Icon className="animate-spin size-8 text-indigo-400" />
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

                    <div className="text-sm text-gray-400">
                        Cost: {editMode === "image" ? "5" : "20"} Credits
                    </div>
                </div>

                {/* Toggle (only if video exists) */}
                {project.generatedVideo && (
                    <div className="flex justify-center mb-8">
                        <div className="bg-white/5 rounded-xl p-1 flex">
                            <button
                                onClick={() => setEditMode("image")}
                                className={`px-4 py-2 rounded-lg transition ${editMode === "image"
                                    ? "bg-indigo-600 text-white"
                                    : "text-gray-400"
                                    }`}
                            >
                                Edit Image
                            </button>

                            <button
                                onClick={() => setEditMode("video")}
                                className={`px-4 py-2 rounded-lg transition ${editMode === "video"
                                    ? "bg-indigo-600 text-white"
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
                    <div className="lg:col-span-2">
                        <div className="relative rounded-3xl overflow-hidden border border-white/10">

                            {regenerating && (
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                                    <Loader2Icon className="animate-spin size-10 text-indigo-400" />
                                </div>
                            )}

                            {editMode === "video" && project.generatedVideo ? (
                                <video
                                    src={project.generatedVideo}
                                    controls
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src={project.generatedImage}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Controls */}
                    <div className="space-y-6">
                        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6 bg-white/[0.02]">
                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Edit2Icon size={14} /> Global Settings
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 mb-1 block">Product Identity</label>
                                    <input
                                        name="productName"
                                        value={form.productName}
                                        onChange={handleChange}
                                        placeholder="Product Name"
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 transition-all outline-none"
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
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 transition-all outline-none resize-none px-4"
                                    />
                                </div>
                            </div>

                            <div className="h-px bg-white/10" />

                            <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <Wand2 size={14} /> AI Direction
                            </h3>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {(editMode === "image" ? IMAGE_PRESETS : VIDEO_PRESETS).map((preset) => (
                                        <button
                                            key={preset.label}
                                            onClick={() => setForm(f => ({ ...f, userPrompt: (f.userPrompt + preset.prompt).trim() }))}
                                            className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold hover:bg-indigo-500/20 hover:border-indigo-500/40 transition-all flex items-center gap-1.5"
                                        >
                                            {preset.icon}
                                            {preset.label}
                                        </button>
                                    ))}
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
                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 transition-all outline-none resize-none px-4"
                                />
                            </div>

                            {editMode === "image" && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 block">Framing & Ratio</label>
                                    <select
                                        name="aspectRatio"
                                        value={form.aspectRatio}
                                        onChange={handleChange}
                                        className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/50 transition-all outline-none appearance-none"
                                    >
                                        <option value="9:16">9:16 - TikTok / Reels</option>
                                        <option value="1:1">1:1 - Instagram Post</option>
                                        <option value="16:9">16:9 - YouTube / Widescreen</option>
                                    </select>
                                </div>
                            )}

                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:tracking-widest transition-all flex items-center justify-center gap-3 font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50"
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
