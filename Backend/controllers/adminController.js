import { prisma } from "../configs/prisma.js";

// Verify admin passcode server-side (passcode never exposed in client bundle)
export const verifyAdminPasscode = async (req, res) => {
    try {
        const { passcode } = req.body;
        const correct = process.env.ADMIN_PASSCODE;

        if (!correct) {
            return res.status(500).json({ message: "Admin passcode not configured on server." });
        }

        if (passcode === correct) {
            return res.json({ authorized: true });
        }

        return res.status(401).json({ authorized: false, message: "Invalid passcode." });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAdminSettings = async (req, res) => {
    try {
        const settings = await prisma.globalSettings.upsert({
            where: { id: 'system' },
            update: {},
            create: {
                id: 'system',
                enableImageGen: true,
                enableVideoGen: true,
                showMockAssets: false,
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
            showMockAssets,
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
                showMockAssets: showMockAssets ?? undefined,
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
                showMockAssets: showMockAssets ?? false,
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

// Grant full demo access to a user by email
export const grantDemoAccess = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (!user) {
            return res.status(404).json({ message: `No user found with email: ${email}` });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                credits: 300,
                hasProAccess: true,
                hasPipelineAccess: true,
                hasBrandHubAccess: true,
            }
        });

        return res.json({
            message: `Demo access granted to ${user.name} (${user.email})`,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("ADMIN_DEMO_ACCESS_ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to grant demo access" });
    }
};

// Revoke demo access — reset to free tier
export const revokeDemoAccess = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email is required" });

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (!user) {
            return res.status(404).json({ message: `No user found with email: ${email}` });
        }

        await prisma.user.update({
            where: { id: user.id },
            data: {
                credits: 20,
                hasProAccess: false,
                hasPipelineAccess: false,
                hasBrandHubAccess: false,
            }
        });

        return res.json({
            message: `Demo access revoked for ${user.name} (${user.email}). Reset to free tier.`,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error("ADMIN_REVOKE_ACCESS_ERROR:", error);
        res.status(500).json({ message: error.message || "Failed to revoke demo access" });
    }
};

