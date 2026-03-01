import { prisma } from "../configs/prisma.js";

export const getAdminSettings = async (req, res) => {
    try {
        const settings = await prisma.globalSettings.upsert({
            where: { id: 'system' },
            update: {},
            create: {
                id: 'system',
                enableImageGen: true,
                enableVideoGen: true,
                enableSocialProof: true,
                enableScarcity: true,
                enableUrgency: true,
                enableAnchoring: true,
                enableShaming: true
            }
        });
        res.json(settings);
    } catch (error) {
        console.error("ADMIN_GET_SETTINGS_ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to fetch settings" });
    }
};

export const updateAdminSettings = async (req, res) => {
    try {
        const {
            enableImageGen,
            enableVideoGen,
            enableSocialProof,
            enableScarcity,
            enableUrgency,
            enableAnchoring,
            enableShaming
        } = req.body;

        const settings = await prisma.globalSettings.upsert({
            where: { id: 'system' },
            update: {
                enableImageGen: enableImageGen ?? undefined,
                enableVideoGen: enableVideoGen ?? undefined,
                enableSocialProof: enableSocialProof ?? undefined,
                enableScarcity: enableScarcity ?? undefined,
                enableUrgency: enableUrgency ?? undefined,
                enableAnchoring: enableAnchoring ?? undefined,
                enableShaming: enableShaming ?? undefined
            },
            create: {
                id: 'system',
                enableImageGen: enableImageGen ?? true,
                enableVideoGen: enableVideoGen ?? true,
                enableSocialProof: enableSocialProof ?? true,
                enableScarcity: enableScarcity ?? true,
                enableUrgency: enableUrgency ?? true,
                enableAnchoring: enableAnchoring ?? true,
                enableShaming: enableShaming ?? true
            }
        });

        res.json({ message: "Settings updated successfully", settings });
    } catch (error) {
        console.error("ADMIN_UPDATE_SETTINGS_ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to update settings" });
    }
};
