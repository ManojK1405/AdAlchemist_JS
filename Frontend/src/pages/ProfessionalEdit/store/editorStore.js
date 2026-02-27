import { create } from 'zustand';

const useEditorStore = create((set) => ({
    // Global Editor State
    zoom: 100,
    setZoom: (zoom) => set({ zoom }),
    activeTab: 'inspector',
    setActiveTab: (tab) => set({ activeTab: tab }),
    activeTool: 'select',
    setActiveTool: (tool) => set({ activeTool: tool }),
    isRegenerating: false,
    setIsRegenerating: (val) => set({ isRegenerating: val }),
    isSaving: false,
    setIsSaving: (val) => set({ isSaving: val }),
    showOriginal: false,
    setShowOriginal: (val) => set({ showOriginal: val }),

    // Adjustments
    adjustments: {
        brightness: 100,
        contrast: 100,
        saturation: 100,
        hueRotate: 0,
        sepia: 0,
        blur: 0,
        exposure: 0,
        sharpness: 100
    },
    setAdjustments: (adjustments) => set({ adjustments }),

    // Professional Free Crop State
    crop: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
    setCrop: (crop) => set((state) => ({ crop: { ...state.crop, ...crop } })),

    // AI Editing Advanced Form
    advancedForm: {
        guidanceScale: 7.5,
        inferenceSteps: 25,
        strength: 0.8,
        negativePrompt: "low quality, blurry, distorted, grainy",
        seed: -1
    },
    setAdvancedForm: (advancedForm) => set({ advancedForm }),

    // Active Asset for exports and master selections
    activeAsset: { type: "image", url: null, id: null },
    setActiveAsset: (asset) => set({ activeAsset: asset }),

    // ==== ENGINE OPERATIONS ====

    resetAdjustments: () => set(() => ({
        adjustments: {
            brightness: 100, contrast: 100, saturation: 100,
            hueRotate: 0, sepia: 0, blur: 0, exposure: 0, sharpness: 100
        }
    })),
}));

export default useEditorStore;
