import { prisma } from "./prisma.js";

// Fetch settings from DB with local environment fallback
export const getSystemSettings = async () => {
    try {
        let settings = await prisma.globalSettings.findUnique({
            where: { id: 'system' }
        });

        // Initialize if first time
        if (!settings) {
            settings = await prisma.globalSettings.create({
                data: {
                    id: 'system',
                    enableImageGen: process.env.ENABLE_IMAGE_GEN === 'true',
                    enableVideoGen: process.env.ENABLE_VIDEO_GEN === 'true',
                }
            });
        }

        return settings;
    } catch (error) {
        console.error("Feature Flag Error:", error);
        // Absolute fallback to env vars if DB fails
        return {
            enableImageGen: process.env.ENABLE_IMAGE_GEN === 'true',
            enableVideoGen: process.env.ENABLE_VIDEO_GEN === 'true',
        };
    }
};

export const checkFeature = async (feature, res) => {
    const settings = await getSystemSettings();
    const isEnabled = feature === 'imageGeneration' ? settings.enableImageGen : settings.enableVideoGen;

    if (!isEnabled) {
        return res.status(503).json({
            message: `The ${feature === 'imageGeneration' ? 'Image' : 'Video'} generation service is temporarily disabled to save costs. Please try again later!`,
            disabled: true
        });
    }
    return true;
};
