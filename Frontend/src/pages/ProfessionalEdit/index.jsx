import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import api from "../../configs/axios";
import { toast } from "react-hot-toast";

import {
    Loader2Icon, ArrowLeftIcon, Command, Eye, Share2, Download, Save,
    LayoutDashboard, Crosshair, Lock, Film, Activity, Crown
} from "lucide-react";

// Store
import useEditorStore from "./store/editorStore";

// Components
import FloatingToolbar from "./components/Toolbar/FloatingToolbar";
import ViewportControls from "./components/Toolbar/ViewportControls";
import VirtualCanvas from "./components/Canvas/VirtualCanvas";

import LeftProjectPanel from "./components/Panels/LeftProjectPanel";
import RightInspector from "./components/Panels/RightInspector";

// Utils
import { handleExportFn } from "./utils/exportUtils";

const TopMenu = ({ label, items, onActions }) => (
    <div className="relative group">
        <button className="px-3 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded transition-all">
            {label}
        </button>
        <div className="absolute top-full left-0 mt-1 w-48 bg-[#18181b] border border-white/10 rounded p-1 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[100]">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    onClick={() => {
                        toast(`${item} activated`);
                        if (onActions) onActions(item);
                    }}
                    className="px-3 py-1.5 hover:bg-cyan-600 rounded text-[10px] text-gray-300 hover:text-white cursor-pointer flex justify-between items-center transition"
                >
                    {item}
                    {idx === 2 && <span className="opacity-40 text-[8px]">⌘S</span>}
                </div>
            ))}
        </div>
    </div>
);

const ProfessionalEditMaster = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();

    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [userProfile, setUserProfile] = useState({ credits: 0, hasProAccess: false });
    const [isUnlocking, setIsUnlocking] = useState(false);

    // Bind state from Zustand store
    const {
        activeAsset, setActiveAsset,
        setShowOriginal, showOriginal,
        isRegenerating, setIsRegenerating,
        isSaving, setIsSaving,
        crop, setCrop,
        adjustments, resetAdjustments,

    } = useEditorStore();

    const fetchProject = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/project/${projectId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const { data: userData } = await api.get('/api/user/credits', {
                headers: { Authorization: `Bearer ${token}` },
            });

            setProject(data);
            setUserProfile({ credits: userData.credits, hasProAccess: userData.hasProAccess });

            // Set Initial Active Asset to Image
            setActiveAsset({ type: "image", url: data.generatedImage });
            setLoading(false);
        } catch (error) {
            console.error("Fetch Project Flow Error:", error);
            toast.error("Failed to load project: " + error.message);
            navigate(`/edit/${projectId}`);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) fetchProject();
    }, [projectId]);

    const handleUnlockPro = async () => {
        setIsUnlocking(true);
        try {
            const token = await getToken();
            const { data } = await api.post('/api/user/unlock-pro', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(data.message || "Pro Studio Unlocked!");
            setUserProfile(prev => ({ ...prev, hasProAccess: true, credits: prev.credits - 250 }));
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to unlock Pro Studio");
        } finally {
            setIsUnlocking(false);
        }
    };


    const handleExport = () => handleExportFn(project, activeAsset, crop, adjustments);

    const handleReEngineer = async () => {
        setIsRegenerating(true);
        const toastId = toast.loading("AI Engine: Processing Scene Re-Engineering...");
        try {
            const token = await getToken();
            const endpoint = `/api/project/${projectId}/edit`;

            const payload = {
                projectId,
                userPrompt: project.userPrompt,
                guidance_scale: advancedForm.guidanceScale,
                inference_steps: advancedForm.inferenceSteps,
                negative_prompt: advancedForm.negativePrompt,
                keepOriginalScene: true
            };

            await api.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Generation Started!", { id: toastId });
            fetchProject();
        } catch (error) {
            toast.error("AI Engine Failure", { id: toastId });
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleCommitEdits = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Rendering Layer Mask & Uploading to Cloud...");

        try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = activeAsset.url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            const cropLeftPx = (crop.x / 100) * img.naturalWidth;
            const cropTopPx = (crop.y / 100) * img.naturalHeight;
            const targetWidth = (crop.width / 100) * img.naturalWidth;
            const targetHeight = (crop.height / 100) * img.naturalHeight;
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext('2d');

            ctx.filter = `
                brightness(${adjustments.brightness}%) 
                contrast(${adjustments.contrast}%) 
                saturate(${adjustments.saturation}%) 
                hue-rotate(${adjustments.hueRotate}deg) 
                sepia(${adjustments.sepia}%)
                blur(${adjustments.blur}px)
                ${adjustments.exposure !== 0 ? `brightness(${100 + adjustments.exposure}%)` : ""}
            `;

            ctx.drawImage(img, cropLeftPx, cropTopPx, targetWidth, targetHeight, 0, 0, targetWidth, targetHeight);

            const imageBase64 = canvas.toDataURL("image/png");
            const token = await getToken();

            await api.post(`/api/project/${projectId}/save-edit`, { imageBase64 }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success("Studio: Final Render Saved Successfully!", { id: toastId });
            fetchProject();
            resetAdjustments();
            setCrop({ x: 0, y: 0, width: 100, height: 100 });
        } catch (error) {
            console.error(error);
            toast.error("Failed to commit final render", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };


    if (loading || !project) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2Icon className="animate-spin size-10 text-cyan-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Initializing Studio Core</span>
                </div>
            </div>
        );
    }

    if (!userProfile.hasProAccess) {
        return (
            <div className="h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-3xl" />
                <div className="flex flex-col items-center gap-6 relative z-10 max-w-md text-center p-8 bg-[#0d0d0f] border border-cyan-500/20 rounded-3xl shadow-[0_0_100px_rgba(6,182,212,0.1)]">
                    <div className="w-20 h-20 bg-linear-to-b from-cyan-600/20 to-transparent rounded-full flex items-center justify-center mb-2">
                        <Crown className="size-10 text-cyan-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white px-8">Unlock AdAlchemist Pro Studio</h2>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Gain lifetime access to the Professional Edit suite. Get full control over layer masks, manual color grading curves, free-transform crop overlays, and direct AI inpainting right on the canvas.
                    </p>

                    <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

                    <div className="flex flex-col w-full gap-3">
                        <div className="flex items-center justify-between px-4 py-3 bg-[#111113] rounded-xl border border-white/5">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lifetime Access</span>
                            <span className="text-lg font-black text-cyan-400">250 Credits</span>
                        </div>
                        <button
                            onClick={handleUnlockPro}
                            disabled={isUnlocking}
                            className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold tracking-widest uppercase text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white shadow-xl shadow-cyan-600/20 transition disabled:opacity-50"
                        >
                            {isUnlocking ? <Loader2Icon size={16} className="animate-spin" /> : <Lock size={16} />}
                            {isUnlocking ? "Unlocking Node..." : "Unlock Pro Studio"}
                        </button>
                        <button
                            onClick={() => navigate(`/edit/${projectId}`)}
                            className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white transition"
                        >
                            Return to Basic Editor
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#050505] text-[#e1e1e3] flex flex-col pt-0 overflow-hidden select-none font-sans">

            {/* Top Editor Bar (App Header Style) */}
            <div className="h-12 border-b border-white/5 flex items-center justify-between px-3 bg-[#0d0d0f] z-50 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                        <button
                            onClick={() => navigate(`/edit/${projectId}`)}
                            className="p-1.5 hover:bg-white/5 rounded transition"
                        >
                            <ArrowLeftIcon size={16} />
                        </button>
                        <div className="p-1.5 bg-cyan-600 rounded text-white shadow-lg shadow-cyan-600/20">
                            <Command size={14} />
                        </div>
                    </div>

                    <nav className="flex items-center gap-1">
                        <TopMenu label="File" items={["New Project", "Open Recent", "Save Project (Ctrl+S)", "Export Master..."]} onActions={(item) => item.includes("Export") && handleExport()} />
                        <TopMenu label="Edit" items={["Undo", "Redo", "Cut", "Copy", "Paste", "Delete", "Reset to Original"]} />
                        <TopMenu label="Composition" items={["Comp Settings", "New Layer", "Markers"]} />
                        <TopMenu label="View" items={["Zoom In", "Zoom Out", "Fit to Viewport", "Toggle Grid"]} />
                        <TopMenu label="AI Engine" items={["Inpaint Selection", "Enhance Details", "Style Transfer", "Upscale (4K)"]} />
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onMouseDown={() => setShowOriginal(true)}
                        onMouseUp={() => setShowOriginal(false)}
                        onMouseLeave={() => setShowOriginal(false)}
                        onTouchStart={() => setShowOriginal(true)}
                        onTouchEnd={() => setShowOriginal(false)}
                        className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-yellow-500/20 rounded text-[11px] font-semibold border border-white/10 transition text-yellow-500 mr-2 shadow-lg"
                    >
                        <Eye size={12} /> Compare
                    </button>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-full border border-white/5 mr-4">
                        <div className="size-1.5 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-[9px] font-bold uppercase text-gray-400">Stable Connection</span>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded text-[11px] font-semibold border border-white/10 transition">
                        <Share2 size={12} /> Share
                    </button>
                    <button
                        onClick={handleCommitEdits}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-bold border border-cyan-500/30 transition shadow-lg shadow-cyan-600/20 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2Icon size={12} className="animate-spin" /> : <Save size={12} />}
                        Save as New Generation
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-1 bg-[#1a1a1c] hover:bg-cyan-600 text-white rounded text-[11px] font-bold border border-cyan-600/30 transition shadow-lg"
                    >
                        <Download size={12} /> Export Copy
                    </button>
                </div>
            </div>

            {/* Sub Header / Breadcrumbs */}
            <div className="h-8 bg-[#111113] border-b border-white/5 flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                    <LayoutDashboard size={12} />
                    <span>Projects</span>
                    <span className="opacity-30">/</span>
                    <span className="text-gray-300 font-bold">{project.name}</span>
                    <span className="opacity-30">/</span>
                    <span className="text-cyan-400">Master Build</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Crosshair size={12} className="text-cyan-400" />
                        <span>X: 1920px Y: 1080px</span>
                    </div>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Project Assets & Tools */}
                <LeftProjectPanel project={project} />

                {/* Main Engine Area */}
                <div className="flex-1 flex flex-col overflow-hidden relative bg-[#030304]">
                    <FloatingToolbar />

                    {/* Synchronized Canvas */}
                    <VirtualCanvas project={project} />
                </div>



                {/* Right Panel: Inspector */}
                <RightInspector
                    project={project}
                    projectId={projectId}
                    fetchProject={fetchProject}
                    getToken={getToken}
                    handleReEngineer={handleReEngineer}
                    handleCommitEdits={handleCommitEdits}
                />
            </main>

            {/* Deep System Footer */}
            <div className="h-6 border-t border-white/5 bg-[#09090b] flex items-center px-4 justify-between shrink-0 z-50">
                <div className="flex items-center gap-2">
                    <Lock size={10} className="text-yellow-500" />
                    <span className="text-[8px] font-bold text-gray-600 uppercase">Final Cache Locked</span>
                </div>
                <div className="text-[9px] font-mono text-gray-500 flex gap-4">
                    <span>ENGINE ACTIVE</span>
                    <span>CPU: 42%</span>
                    <span>RAM: 1.2GB</span>
                </div>
            </div>

            <style>{`
                .pattern-bg {
                    background-image: radial-gradient(circle, #222 1px, transparent 1px);
                    background-size: 20px 20px;
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #444; }
            `}</style>
        </div>
    );
};

export default ProfessionalEditMaster;
