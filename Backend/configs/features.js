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
                    enableDBO: true,
                    enableProStudio: true,
                    enableBrandHub: true,
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
            enableDBO: true,
            enableProStudio: true,
            enableBrandHub: true,
        };
    }
};

export const checkFeature = async (feature, res) => {
    const settings = await getSystemSettings();
    
    const featureMap = {
        'imageGeneration': settings.enableImageGen,
        'videoGeneration': settings.enableVideoGen,
        'dbo': settings.enableDBO,
        'proStudio': settings.enableProStudio,
        'brandHub': settings.enableBrandHub,
        'socialProof': settings.enableSocialProof,
        'scarcity': settings.enableScarcity,
        'urgency': settings.enableUrgency,
        'anchoring': settings.enableAnchoring,
        'shaming': settings.enableShaming
    };

    const isEnabled = featureMap[feature];

    if (isEnabled === false) {
        return res.status(503).json({
            message: `The ${feature} service is temporarily disabled to save costs. Please try again later!`,
            disabled: true
        });
    }
    return true;
};
