import React from 'react';
import { toast } from 'react-hot-toast';
import useEditorStore from '../store/editorStore';
import { Download } from 'lucide-react';

export const handleExportFn = (project, activeAsset, crop, adjustments) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = activeAsset.url;
    img.onload = () => {
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

        const link = document.createElement('a');
        link.download = `ProMaster_${project.name}_Final.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        toast.success("Master Render Exported (Baked & Cropped)!");
    };
};
