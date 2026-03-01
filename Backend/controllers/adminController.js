import { prisma } from "../configs/prisma.js";

export const getAdminSettings = async (req, res) => {
    try {
        const settings = await prisma.globalSettings.upsert({
            where: { id: 'system' },
            update: {},
            create: {
                id: 'system',
                enableImageGen: true,
                enableVideoGen: true
            }
        });
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch settings" });
    }
};

export const updateAdminSettings = async (req, res) => {
    try {
        const { enableImageGen, enableVideoGen } = req.body;

        const settings = await prisma.globalSettings.upsert({
            where: { id: 'system' },
            update: {
                enableImageGen: enableImageGen ?? undefined,
                enableVideoGen: enableVideoGen ?? undefined
            },
            create: {
                id: 'system',
                enableImageGen: enableImageGen ?? true,
                enableVideoGen: enableVideoGen ?? true
            }
        });

        res.json({ message: "Settings updated successfully", settings });
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings" });
    }
};
