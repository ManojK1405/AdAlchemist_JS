import React from 'react';
import useEditorStore from '../../store/editorStore';
import { MousePointer2, Scissors, Type, Palette, Wand2, Split } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ToolIconButton = ({ icon, id, active, onClick }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition shadow-xl ${active ? "bg-cyan-600 text-white" : "text-gray-500 hover:text-white hover:bg-white/5"}`}
        title={id}
    >
        {icon}
    </button>
);

const FloatingToolbar = () => {
    const { activeTool, setActiveTool } = useEditorStore();

    const handleToolChange = (tool) => {
        setActiveTool(tool);
        // Only trigger toast for tools we currently have some logic bound to like crop/cut, 
        // others are just selecting modes visually.
        toast.success(`${tool.charAt(0).toUpperCase() + tool.slice(1)} Tool Activated`, { icon: '⚒️' });
    };

    return (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 w-11 bg-[#18181b]/90 backdrop-blur-xl border border-white/10 rounded-xl flex flex-col items-center py-3 gap-3 shadow-2xl z-40">
            <ToolIconButton icon={<MousePointer2 size={16} />} id="select" active={activeTool === "select"} onClick={() => handleToolChange("select")} />
            <ToolIconButton icon={<Scissors size={16} />} id="cut (crop overlay)" active={activeTool === "cut"} onClick={() => handleToolChange("cut")} />
            <ToolIconButton icon={<Type size={16} />} id="text" active={activeTool === "text"} onClick={() => handleToolChange("text")} />
            <ToolIconButton icon={<Palette size={16} />} id="color" active={activeTool === "color"} onClick={() => handleToolChange("color")} />
            <div className="w-6 h-px bg-white/10" />
            <ToolIconButton icon={<Wand2 size={16} />} id="ai generation" active={activeTool === "ai"} onClick={() => handleToolChange("ai")} />
        </div>
    );
};

export default FloatingToolbar;
