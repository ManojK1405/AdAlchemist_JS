import React, { useState, useEffect, useRef } from 'react';
import {
    Play,
    Pause,
    Type,
    Music,
    Trash2,
    Scissors,
    Plus,
    ChevronRight,
    Volume2,
    Settings
} from 'lucide-react';
import useEditorStore from '../../store/editorStore';

const VideoTimeline = () => {
    const {
        layers,
        addLayer,
        removeLayer,
        updateLayer,
        selectedLayerId,
        setSelectedLayerId,
        activeAsset
    } = useEditorStore();

    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(10); // Default 10s
    const timelineRef = useRef(null);

    const formatTime = (seconds) => {
        const s = Math.floor(seconds);
        const ms = Math.floor((seconds % 1) * 100);
        return `00:${s < 10 ? '0' : ''}${s}:${ms < 10 ? '0' : ''}${ms}`;
    };

    const handleTimelineClick = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left - 150; // Offset for layer labels
        if (x < 0) return;
        const newTime = (x / (rect.width - 150)) * duration;
        setCurrentTime(Math.max(0, Math.min(newTime, duration)));
    };

    const handleAddOverlay = (type) => {
        if (type === 'text') {
            addLayer({
                type: 'text',
                content: 'NEW AD TEXT',
                style: { fontSize: 48, color: '#ffffff', fontWeight: 'bold' },
                x: 50, y: 50
            });
        } else if (type === 'audio') {
            addLayer({
                type: 'audio',
                content: 'Background Music',
                volume: 0.8
            });
        }
    };

    return (
        <div className="bg-[#09090b] border-t border-white/5 h-64 flex flex-col z-50 overflow-hidden select-none">
            {/* Control Bar */}
            <div className="h-10 bg-[#0d0d0f] border-b border-white/5 flex items-center px-4 justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-8 h-8 rounded-full bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center transition shadow-lg shadow-cyan-600/20"
                        >
                            {isPlaying ? <Pause size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
                        </button>
                        <span className="text-[11px] font-mono font-bold text-cyan-400 w-24 ml-2">
                            {formatTime(currentTime)} <span className="text-gray-600">/ {formatTime(duration)}</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-white/10 pl-6">
                        <button onClick={() => handleAddOverlay('text')} className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition group flex items-center gap-2">
                            <Type size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add Text</span>
                        </button>
                        <button onClick={() => handleAddOverlay('audio')} className="p-1.5 hover:bg-white/5 rounded text-gray-400 hover:text-white transition group flex items-center gap-2">
                            <Music size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Add Audio</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition"><Scissors size={14} /></button>
                    <button className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition"><Settings size={14} /></button>
                </div>
            </div>

            {/* Timeline Tracks */}
            <div
                ref={timelineRef}
                className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative"
                onClick={handleTimelineClick}
            >
                {/* Time Indicator Line */}
                <div
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-50 pointer-events-none shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                    style={{ left: `calc(150px + ${(currentTime / duration) * (timelineRef.current?.offsetWidth - 150 || 0)}px)` }}
                >
                    <div className="w-3 h-3 bg-red-500 rounded-full -ml-[5.5px] -mt-1 shadow-lg" />
                </div>

                {/* Grid Rulers */}
                <div className="h-8 border-b border-white/5 flex sticky top-0 bg-[#09090b] z-40">
                    <div className="w-[150px] shrink-0 border-r border-white/5 flex items-center px-4">
                        <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Layers</span>
                    </div>
                    <div className="flex-1 relative">
                        {[...Array(11)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute top-0 bottom-0 border-l border-white/5 h-full"
                                style={{ left: `${(i / 10) * 100}%` }}
                            >
                                <span className="absolute top-2 left-1 text-[8px] font-bold text-gray-700">{i}s</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tracks */}
                <div className="flex-1 flex flex-col">
                    {/* Visual Asset Track (Always first) */}
                    <div className="flex h-12 border-b border-white/5 group hover:bg-white/[0.02] transition">
                        <div className="w-[150px] shrink-0 border-r border-white/5 flex items-center px-4 gap-3">
                            <Plus size={12} className="text-gray-600" />
                            <span className="text-[10px] font-bold text-gray-400 capitalize">Video Asset</span>
                        </div>
                        <div className="flex-1 p-1 flex">
                            <div className="h-full bg-cyan-600/20 border border-cyan-500/30 rounded-lg flex-1 relative overflow-hidden group/bar">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
                                <div className="h-full flex items-center px-4">
                                    <div className="size-6 rounded bg-black/40 border border-white/10 overflow-hidden">
                                        <img src={activeAsset?.url} className="size-full object-cover" />
                                    </div>
                                    <span className="text-[9px] font-black text-cyan-400 ml-3 uppercase tracking-tighter">Main Scene</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dynamic Layers */}
                    {layers.map(layer => (
                        <div
                            key={layer.id}
                            onClick={(e) => { e.stopPropagation(); setSelectedLayerId(layer.id); }}
                            className={`flex h-12 border-b border-white/5 transition group hover:bg-white/[0.02] ${selectedLayerId === layer.id ? 'bg-cyan-500/[0.03]' : ''}`}
                        >
                            <div className="w-[150px] shrink-0 border-r border-white/5 flex items-center px-4 justify-between">
                                <div className="flex items-center gap-3">
                                    {layer.type === 'text' ? <Type size={12} className="text-cyan-500" /> : <Volume2 size={12} className="text-purple-500" />}
                                    <span className={`text-[10px] font-bold ${selectedLayerId === layer.id ? 'text-white' : 'text-gray-500'}`}>
                                        {layer.type === 'text' ? 'Text Overlay' : 'Audio Track'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeLayer(layer.id)}
                                    className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                            <div className="flex-1 p-1 relative">
                                <div
                                    className={`absolute top-1 bottom-1 rounded-lg flex items-center px-3 border transition-all ${layer.type === 'text'
                                            ? 'bg-cyan-600/20 border-cyan-500/40'
                                            : 'bg-purple-600/20 border-purple-500/40'
                                        } ${selectedLayerId === layer.id ? 'ring-2 ring-white/20' : ''}`}
                                    style={{
                                        left: `${(layer.startTime / duration) * 100}%`,
                                        width: `${(layer.duration / duration) * 100}%`
                                    }}
                                >
                                    <span className="text-[9px] font-black text-white/50 uppercase truncate">{layer.content}</span>

                                    {/* Trim Handles */}
                                    <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/10 cursor-ew-resize rounded-r-lg" />
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/10 cursor-ew-resize rounded-l-lg" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty Track Placeholder */}
                    <div className="flex-1 flex flex-col items-center justify-center border-b border-dashed border-white/5 opacity-20">
                        <span className="text-[8px] font-black uppercase tracking-[0.4em] text-gray-500">Node Timeline Empty</span>
                    </div>
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1a1a1c; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default VideoTimeline;
