import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import useEditorStore from '../../store/editorStore';

const CropOverlay = ({ targetRef }) => {
    const { crop, setCrop, activeTool } = useEditorStore();
    const isEditing = activeTool === "cut";
    const [draggingGrip, setDraggingGrip] = useState(null);
    const overlayRef = useRef(null);

    const handlePointerDown = (e, grip) => {
        if (!isEditing) return;
        e.stopPropagation();
        e.preventDefault();
        setDraggingGrip(grip);
    };

    useEffect(() => {
        if (!draggingGrip || !overlayRef.current) return;

        const handlePointerMove = (e) => {
            const rect = overlayRef.current.getBoundingClientRect();
            let newX = ((e.clientX - rect.left) / rect.width) * 100;
            let newY = ((e.clientY - rect.top) / rect.height) * 100;

            newX = Math.max(0, Math.min(newX, 100));
            newY = Math.max(0, Math.min(newY, 100));

            const newCrop = { ...crop };

            if (draggingGrip.includes('w')) {
                const rightX = crop.x + crop.width;
                newCrop.x = Math.min(newX, rightX - 5);
                newCrop.width = rightX - newCrop.x;
            }
            if (draggingGrip.includes('e')) {
                newCrop.width = Math.max(5, newX - crop.x);
            }
            if (draggingGrip.includes('n')) {
                const bottomY = crop.y + crop.height;
                newCrop.y = Math.min(newY, bottomY - 5);
                newCrop.height = bottomY - newCrop.y;
            }
            if (draggingGrip.includes('s')) {
                newCrop.height = Math.max(5, newY - crop.y);
            }

            if (newCrop.x + newCrop.width > 100) newCrop.width = 100 - newCrop.x;
            if (newCrop.y + newCrop.height > 100) newCrop.height = 100 - newCrop.y;

            setCrop(newCrop);
        };

        const handlePointerUp = () => setDraggingGrip(null);

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };
    }, [draggingGrip, crop, setCrop]);

    if (!isEditing) return null;

    return (
        <div ref={overlayRef} className="absolute inset-0 z-50 pointer-events-none">
            <div
                className="absolute inset-0 bg-black/60 pointer-events-none"
                style={{
                    clipPath: `polygon(
                        0% 0%, 0% 100%, ${crop.x}% 100%, ${crop.x}% ${crop.y}%, 
                        ${crop.x + crop.width}% ${crop.y}%, ${crop.x + crop.width}% ${crop.y + crop.height}%, 
                        ${crop.x}% ${crop.y + crop.height}%, ${crop.x}% 100%, 100% 100%, 100% 0%
                    )`
                }}
            />
            <div
                className="absolute border border-cyan-400 pointer-events-auto cursor-move shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`
                }}
            >
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-50">
                    {[...Array(9)].map((_, i) => <div key={i} className="border border-white/30" />)}
                </div>
                {['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].map(grip => {
                    const positions = {
                        nw: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
                        n: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
                        ne: 'top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
                        w: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
                        e: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
                        sw: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
                        s: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
                        se: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
                    };
                    return (
                        <div
                            key={grip}
                            onPointerDown={(e) => handlePointerDown(e, grip)}
                            className={`absolute w-3 h-3 bg-white border border-cyan-500 rounded-sm ${positions[grip]}`}
                        />
                    );
                })}
            </div>
        </div>
    );
};

const VirtualCanvas = () => {
    const {
        zoom,
        crop,
        adjustments,
        showOriginal,
        activeAsset
    } = useEditorStore();

    const renderRef = useRef(null);

    const filterStyle = showOriginal ? "none" : `
        brightness(${adjustments.brightness}%) 
        contrast(${adjustments.contrast}%) 
        saturate(${adjustments.saturation}%) 
        hue-rotate(${adjustments.hueRotate}deg) 
        sepia(${adjustments.sepia}%)
        blur(${adjustments.blur}px)
        ${adjustments.exposure !== 0 ? `brightness(${100 + adjustments.exposure}%)` : ""}
    `;

    const clipStyle = {
        clipPath: (!showOriginal && crop) ? `inset(${crop.y}% ${100 - (crop.x + crop.width)}% ${100 - (crop.y + crop.height)}% ${crop.x}%)` : "none",
        filter: filterStyle,
    };

    return (
        <div className="flex-1 overflow-auto flex items-center justify-center p-20 custom-scrollbar pattern-bg relative" ref={renderRef}>
            <motion.div
                style={{ scale: zoom / 100 }}
                className="relative bg-black shadow-[0_0_100px_rgba(0,0,0,1)] max-h-[80vh] w-auto inline-block border border-white/10"
                layoutId="viewport-main"
            >
                <div className="relative">
                    <img
                        src={activeAsset?.url}
                        alt="Master Viewport"
                        className="max-h-[80vh] w-auto max-w-[1280px]"
                        style={clipStyle}
                    />

                    {/* Draggable Crop Overlay */}
                    <CropOverlay targetRef={renderRef} />
                </div>
            </motion.div>
        </div>
    );
};

export default VirtualCanvas;
