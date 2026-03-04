import React, { useState, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

const CustomDropdown = ({ label, value, options, onChange, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isDisabled = !options || options.length === 0;

    // Check if options are objects with value/label or just strings
    const isObjectOptions = options?.length > 0 && typeof options[0] === 'object';

    const getDisplayLabel = (val) => {
        if (isObjectOptions) {
            const found = options.find(opt => opt.value === val);
            return found ? found.label : val;
        }
        return val;
    };

    const currentValueDisplay = getDisplayLabel(value);

    return (
        <div className="relative" ref={ref}>
            <label className="text-[10px] font-black text-gray-500 uppercase ml-1 flex items-center gap-2 mb-2">
                {Icon && <Icon size={12} />} {label}
            </label>
            <div
                onClick={() => !isDisabled && setIsOpen(!isOpen)}
                className={`group w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-xs font-bold flex items-center justify-between cursor-pointer transition-all hover:bg-white/10 hover:border-white/20 ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${isOpen ? 'border-cyan-500/50 bg-white/10 ring-1 ring-cyan-500/20' : ''}`}
            >
                <span className={value ? "text-white" : "text-gray-500"}>
                    {currentValueDisplay || `Select ${label}...`}
                </span>
                <ChevronDown size={14} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-cyan-500' : ''}`} />
            </div>

            {isOpen && !isDisabled && (
                <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0d0d0f] border border-white/10 rounded-2xl py-2 pl-2 pr-1 shadow-2xl z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {options.map((opt, idx) => {
                        const optValue = isObjectOptions ? opt.value : opt;
                        const optLabel = isObjectOptions ? opt.label : opt;
                        const isSelected = value === optValue;

                        return (
                            <div
                                key={isObjectOptions ? optValue : idx}
                                onClick={() => {
                                    onChange(optValue);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-3 mr-1 rounded-lg text-xs font-bold transition-all flex items-center justify-between cursor-pointer group/item ${isSelected ? 'bg-cyan-500/10 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                {optLabel}
                                {isSelected && <Check size={14} className="text-cyan-400" />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
