import React from 'react';
import { Plus, MonitorPlay } from 'lucide-react';
import useEditorStore from '../../store/editorStore';

const AssetCard = ({ name, type, active, url, onClick }) => (
    <div
        onClick={onClick}
        className={`p-2 rounded flex items-center gap-3 border transition cursor-pointer ${active ? "bg-cyan-600/10 border-cyan-500/30" : "bg-[#111113] border-white/5 hover:bg-white/5"}`}
    >
        <div className="size-10 bg-black rounded flex items-center justify-center overflow-hidden border border-white/10 relative group">
            {url ? <img src={url} className="w-full h-full object-cover opacity-60" /> : <MonitorPlay size={16} className="text-gray-600" />}
        </div>
        <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold truncate ${active ? "text-cyan-400" : "text-gray-300"}`}>{name}</span>
            <span className="text-[8px] text-gray-600 font-mono uppercase">{type}</span>
        </div>
    </div>
);

const LeftProjectPanel = ({ project }) => {
    const { activeAsset, setActiveAsset } = useEditorStore();

    return (
        <div className="w-56 border-r border-white/5 flex flex-col bg-[#09090b] z-10 shrink-0">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Project Assets</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                <AssetCard
                    name="Master Image"
                    type="img"
                    url={project?.generatedImage}
                    active={activeAsset.url === project?.generatedImage}
                    onClick={() => setActiveAsset({ type: "image", url: project?.generatedImage })}
                />
            </div>
        </div>
    );
};

export default LeftProjectPanel;
