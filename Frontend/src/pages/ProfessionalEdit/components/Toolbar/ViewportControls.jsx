import React from 'react';
import useEditorStore from '../../store/editorStore';
import { Minus, Plus, Maximize2, Activity } from 'lucide-react';

const ViewportControls = () => {
    const { zoom, setZoom } = useEditorStore();

    return (
        <div className="h-10 border-t border-white/5 bg-[#0d0d0f] flex items-center justify-between px-4 z-40">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500">
                    <Activity size={12} className="text-green-500" />
                    <span>60 FPS</span>
                    <div className="w-px h-3 bg-white/10 mx-1" />
                    <span>8-BIT COLOR</span>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-black/40 rounded-lg px-2 py-1 border border-white/5">
                <button onClick={() => setZoom(Math.max(zoom - 10, 10))} className="p-1 hover:text-cyan-400"><Minus size={14} /></button>
                <span className="text-[10px] font-mono w-10 text-center">{zoom}%</span>
                <button onClick={() => setZoom(Math.min(zoom + 10, 400))} className="p-1 hover:text-cyan-400"><Plus size={14} /></button>
                <div className="w-px h-3 bg-white/10 mx-1" />
                <button onClick={() => setZoom(100)} className="p-1 hover:text-cyan-400 transition-colors"><Maximize2 size={14} /></button>
            </div>
        </div>
    );
};

export default ViewportControls;
