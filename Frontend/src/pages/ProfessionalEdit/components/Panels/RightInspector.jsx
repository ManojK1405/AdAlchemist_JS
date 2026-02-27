import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useEditorStore from '../../store/editorStore';
import {
    Scissors, Sun, Palette, Wind, Settings2, Wand2,
    Save, Loader2Icon, Trash2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../../../configs/axios';

const InspectorTab = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition ${active ? "text-cyan-400 border-cyan-500 bg-white/5" : "text-gray-500 border-transparent hover:text-gray-300"}`}
    >
        {label}
    </button>
);

const InspectorSection = ({ title, icon, children }) => (
    <div className="space-y-2">
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1 bg-white/5 rounded text-cyan-400">{icon}</div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{title}</span>
        </div>
        {children}
    </div>
);

const AdjustSlider = ({ label, value, min, max, step = 1, onChange }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] text-gray-400 font-medium">
            <span>{label}</span>
            <span className="text-cyan-400 font-mono">{typeof value === 'number' ? value.toFixed(step === 1 ? 0 : 1) : value}</span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-0.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
    </div>
);


const RightInspector = ({ project, projectId, fetchProject, getToken, handleReEngineer, handleCommitEdits }) => {
    const {
        activeTab, setActiveTab,
        activeTool,
        crop, setCrop,
        adjustments, setAdjustments, resetAdjustments,
        advancedForm, setAdvancedForm,
        isRegenerating, isSaving,
        activeAsset, setActiveAsset
    } = useEditorStore();

    const resetToOriginal = () => {
        resetAdjustments();
        setCrop({ x: 0, y: 0, width: 100, height: 100 });
        if (project) {
            setActiveAsset({
                type: "image",
                url: project.generatedImage || project.generatedVideo
            });
        }
        toast.success("Reverted to Original Render");
    };


    return (
        <div className="w-80 border-l border-white/5 flex flex-col bg-[#0d0d0f] z-10 overflow-hidden shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-white/5">
                <InspectorTab label="Inspector" active={activeTab === "inspector"} onClick={() => setActiveTab("inspector")} />
                <InspectorTab label="AI Tuning" active={activeTab === "ai"} onClick={() => setActiveTab("ai")} />
                <InspectorTab label="History" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === "inspector" && (
                        <motion.div
                            key="inspector"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 space-y-6"
                        >

                            {activeTool === "cut" && (
                                <InspectorSection title="Crop Overlay" icon={<Scissors size={12} />}>
                                    <div className="space-y-4 pt-2">
                                        <div className="text-[10px] text-gray-400 bg-white/5 p-2 rounded leading-relaxed border border-white/10">
                                            <span className="text-cyan-400 font-bold block mb-1">Free Transform Active</span>
                                            Drag the 8 grips around the composition in the main viewport to freely define new boundaries.
                                        </div>
                                        <button
                                            onClick={() => {
                                                setCrop({ x: 0, y: 0, width: 100, height: 100 });
                                                toast.success("Crop Reset");
                                            }}
                                            className="w-full py-1.5 border border-white/10 rounded text-[9px] uppercase font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
                                        >
                                            Reset Full Frame
                                        </button>
                                    </div>
                                </InspectorSection>
                            )}

                            <InspectorSection title="Primary Adjustments" icon={<Sun size={12} />}>
                                <div className="space-y-4 pt-2">
                                    <AdjustSlider label="Brightness" value={adjustments.brightness} min={0} max={200} onChange={v => setAdjustments({ ...adjustments, brightness: v })} />
                                    <AdjustSlider label="Contrast" value={adjustments.contrast} min={0} max={200} onChange={v => setAdjustments({ ...adjustments, contrast: v })} />
                                    <AdjustSlider label="Exposures" value={adjustments.exposure} min={-100} max={100} onChange={v => setAdjustments({ ...adjustments, exposure: v })} />
                                </div>
                            </InspectorSection>

                            <InspectorSection title="Color & Tone" icon={<Palette size={12} />}>
                                <div className="space-y-4 pt-2">
                                    <AdjustSlider label="Saturation" value={adjustments.saturation} min={0} max={200} onChange={v => setAdjustments({ ...adjustments, saturation: v })} />
                                    <AdjustSlider label="Hue" value={adjustments.hueRotate} min={0} max={360} onChange={v => setAdjustments({ ...adjustments, hueRotate: v })} />
                                    <AdjustSlider label="Sepia" value={adjustments.sepia} min={0} max={100} onChange={v => setAdjustments({ ...adjustments, sepia: v })} />
                                </div>
                            </InspectorSection>

                            <InspectorSection title="Post FX" icon={<Wind size={12} />}>
                                <div className="space-y-4 pt-2">
                                    <AdjustSlider label="Sharpness" value={adjustments.sharpness} min={0} max={200} onChange={v => setAdjustments({ ...adjustments, sharpness: v })} />
                                    <AdjustSlider label="Gaussian Blur" value={adjustments.blur} min={0} max={20} onChange={v => setAdjustments({ ...adjustments, blur: v })} />
                                </div>
                            </InspectorSection>

                            <div className="pt-4 flex gap-2">
                                <button
                                    onClick={resetToOriginal}
                                    disabled={isSaving}
                                    className="flex-1 py-2 bg-white/5 border border-white/10 rounded text-[10px] font-bold hover:bg-white/10 transition uppercase tracking-widest text-red-500 disabled:opacity-50"
                                >
                                    Reset Master
                                </button>
                                <button
                                    onClick={handleCommitEdits}
                                    disabled={isSaving}
                                    className="flex-1 py-2 bg-cyan-600 text-white rounded text-[10px] font-bold hover:bg-cyan-500 transition shadow-lg shadow-cyan-600/20 uppercase tracking-widest disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSaving ? <Loader2Icon size={12} className="animate-spin" /> : <Save size={12} />}
                                    Save as New Generation
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === "ai" && (
                        <motion.div
                            key="ai"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 space-y-6"
                        >
                            <InspectorSection title="Engine Settings" icon={<Settings2 size={12} />}>
                                <div className="space-y-4 pt-2">
                                    <AdjustSlider label="Guidance (CFG)" value={advancedForm.guidanceScale} min={1} max={20} step={0.5} onChange={v => setAdvancedForm({ ...advancedForm, guidanceScale: v })} />
                                    <AdjustSlider label="Inference Pass" value={advancedForm.inferenceSteps} min={10} max={100} onChange={v => setAdvancedForm({ ...advancedForm, inferenceSteps: v })} />
                                    <AdjustSlider label="Denoising" value={advancedForm.strength * 100} min={0} max={100} onChange={v => setAdvancedForm({ ...advancedForm, strength: v / 100 })} />
                                </div>
                            </InspectorSection>

                            <InspectorSection title="Prompt Architecture" icon={<Wand2 size={12} />}>
                                <div className="space-y-4 pt-2 text-[10px]">
                                    <p className="text-gray-500">Master Negative Prompt:</p>
                                    <textarea
                                        className="w-full h-24 bg-black/40 border border-white/10 rounded p-2 text-xs text-cyan-400 outline-none focus:border-cyan-500/50 resize-none font-mono"
                                        value={advancedForm.negativePrompt}
                                        onChange={e => setAdvancedForm({ ...advancedForm, negativePrompt: e.target.value })}
                                    />
                                </div>
                            </InspectorSection>
                            <button
                                onClick={handleReEngineer}
                                disabled={isRegenerating}
                                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded text-[11px] font-black uppercase tracking-widest shadow-xl disabled:opacity-50"
                            >
                                {isRegenerating ? "Processing..." : "Re-Engineer Scene"}
                            </button>
                        </motion.div>
                    )}

                    {activeTab === "history" && (
                        <motion.div
                            key="history"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Version History</span>
                                <span className="text-[9px] px-2 py-0.5 bg-cyan-600/20 text-cyan-400 rounded-full border border-cyan-500/20">
                                    {project?.imageVersions?.length || 1} Passes
                                </span>
                            </div>
                            <div className="space-y-2 relative">
                                <div className="absolute left-[23px] top-4 bottom-4 w-px bg-white/10" />
                                {project?.imageVersions ? (
                                    project.imageVersions.slice().reverse().map((url, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                // Load into active asset without adding a new clip unless they drag it
                                                setActiveAsset({ type: "image", url });
                                                toast(`Loaded Version ${project.imageVersions.length - idx}`);
                                            }}
                                            className="flex gap-3 items-center p-2 rounded-lg bg-[#111113] border border-white/5 hover:bg-white/5 hover:border-cyan-500/30 cursor-pointer transition relative z-10 hover:z-20 scale-100 hover:scale-[1.02]"
                                        >
                                            <img src={url} className="w-8 h-8 rounded-sm object-cover border border-white/20" alt="History Pass" />
                                            <div className="flex flex-col flex-1">
                                                <span className="text-[10px] font-bold text-gray-300">
                                                    {idx === 0 ? "Current Master" : `Render V${project.imageVersions.length - idx}`}
                                                </span>
                                                <span className="text-[8px] text-gray-500 font-mono">
                                                    {idx === 0 ? "Active Canvas" : "Click to Preview"}
                                                </span>
                                            </div>
                                            {idx === 0 && <div className="size-2 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,1)]" />}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[9px] text-gray-500 italic p-2">Initializing version control...</div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div >
    );
};

export default RightInspector;
