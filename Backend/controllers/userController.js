import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { clerkClient } from '@clerk/express';
import { v2 as cloudinary } from "cloudinary";


//Get user credits
export const getUserCredits = async (req, res) => {
    try {
        const { userId } = req.auth();
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        let user = await prisma.user.findUnique({
            where: { id: userId },
        });

        // 🛡️ Self-Healing: If user exists in Clerk but not in our DB (failed webhook)
        if (!user) {
            console.log(`User ${userId} not found in DB, attempting on-the-fly creation...`);

            let email = "user@adalchemist.shop";
            let name = "New Creator";
            let image = "https://img.clerk.com/static/placeholder.png";

            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                if (clerkUser) {
                    email = clerkUser.emailAddresses[0]?.emailAddress || email;
                    name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || name;
                    image = clerkUser.imageUrl || image;
                }
            } catch (err) {
                console.error("Failed to fetch user from Clerk for self-healing:", err);
            }

            user = await prisma.user.create({
                data: {
                    id: userId,
                    email,
                    name,
                    image,
                    credits: 20
                }
            });
        }

        res.json({
            credits: user.credits,
            hasProAccess: user.hasProAccess,
            hasPipelineAccess: user.hasPipelineAccess,
            hasBrandHubAccess: user.hasBrandHubAccess
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get all projects
export const getAllProjects = async (req, res) => {
    try {
        const { userId } = req.auth();
        const projects = await prisma.project.findMany({
            where: { userId },
            include: {
                projectLikes: true,
                comments: true,
                user: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ projects });

    } catch (error) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

//get project by id
export const getUserProjectById = async (req, res) => {
    try {
        const { userId } = req.auth();
        const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
            include: {
                projectLikes: true,
                comments: true,
                user: true,
            }
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ project });
    } catch (error) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

//publish/unpublish project
export const toggleProjectPublic = async (req, res) => {
    try {
        const { userId } = req.auth();
        const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
        const project = await prisma.project.findUnique({
            where: { id: projectId, userId },
        });

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (!project?.generatedImage && !project?.generatedVideo) {
            return res.status(400).json({ message: 'Project not generated' });
        }

        await prisma.project.update({
            where: { id: projectId },
            data: {
                isPublished: !project.isPublished,
            },
        });

        res.json({
            message: 'Project updated',
            isPublished: !project.isPublished
        });
    } catch (error) {
        Sentry.captureException(error); // Log the error to Sentry
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get all user brand kits
export const getBrandKit = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { hasBrandHubAccess: true, hasProAccess: true }
        });

        const brandKits = await prisma.brandKit.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });

        // If no kits, return a default one in an array
        if (brandKits.length === 0) {
            const defaultKit = {
                id: "default",
                name: "My First Brand",
                primaryColor: "#06b6d4",
                secondaryColor: "#4f46e5",
                fontPrimary: "Inter",
                fontSecondary: "Montserrat",
                brandVoice: "Professional",
                targetAudience: "General",
                description: "",
                logoDark: "",
                logoLight: "",
                isDefault: true
            };
            return res.json({
                brandKits: [defaultKit],
                hasBrandHubAccess: user?.hasBrandHubAccess || false,
                hasProAccess: user?.hasProAccess || false
            });
        }

        res.json({
            brandKits,
            hasBrandHubAccess: user?.hasBrandHubAccess || false,
            hasProAccess: user?.hasProAccess || false
        });
    } catch (error) {
        console.error("GET Brand Kit Flow Error:", error);
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error', details: error.message });
    }
};

// Update user brand kit

export const updateBrandKit = async (req, res) => {
    try {
        const { userId } = req.auth();
        const {
            name,
            primaryColor,
            secondaryColor,
            fontPrimary,
            fontSecondary,
            brandVoice,
            targetAudience,
            description,
            isDefault
        } = req.body;

        let { id } = req.body;
        if (Array.isArray(id)) id = id[id.length - 1]; // Use last assigned ID if duplicate

        const files = req.files || {};
        let logoDarkUrl = req.body.logoDark;
        let logoLightUrl = req.body.logoLight;

        if (files['logoDark']?.[0]) {
            const result = await cloudinary.uploader.upload(files['logoDark'][0].path, {
                folder: "adalchemist/brand/logos",
            });
            logoDarkUrl = result.secure_url;
        }

        if (files['logoLight']?.[0]) {
            const result = await cloudinary.uploader.upload(files['logoLight'][0].path, {
                folder: "adalchemist/brand/logos",
            });
            logoLightUrl = result.secure_url;
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { hasBrandHubAccess: true }
        });

        const currentKits = await prisma.brandKit.count({
            where: { userId }
        });

        // 🛡️ Guard: Only allow ONE identity for non-premium users
        if ((!user || !user.hasBrandHubAccess) && currentKits >= 1 && (id === 'new' || id === 'default' || !id)) {
            return res.status(403).json({
                message: "Multiple identities is a Premium feature. Please upgrade to Pro to manage more than one brand."
            });
        }

        // Logic continues... we verify ownership for updates below

        let brandKit;
        if (id && id !== "default" && id !== "new") {
            // Verify ownership first
            const existing = await prisma.brandKit.findUnique({ where: { id } });
            if (!existing || existing.userId !== userId) {
                return res.status(403).json({ message: "Unauthorized or identity not found" });
            }

            brandKit = await prisma.brandKit.update({
                where: { id },
                data: {
                    name,
                    primaryColor,
                    secondaryColor,
                    fontPrimary,
                    fontSecondary,
                    brandVoice,
                    targetAudience,
                    description,
                    isDefault: isDefault === 'true' || isDefault === true,
                    logoDark: logoDarkUrl,
                    logoLight: logoLightUrl
                },
            });
        } else {
            brandKit = await prisma.brandKit.create({
                data: {
                    userId,
                    name: name || "New Brand Identity",
                    primaryColor,
                    secondaryColor,
                    fontPrimary,
                    fontSecondary,
                    brandVoice,
                    targetAudience,
                    description,
                    isDefault: isDefault === 'true' || isDefault === true,
                    logoDark: logoDarkUrl,
                    logoLight: logoLightUrl
                },
            });
        }

        // If this is set as default, unset others (simplified)
        if (brandKit.isDefault) {
            await prisma.brandKit.updateMany({
                where: { userId, id: { not: brandKit.id } },
                data: { isDefault: false }
            });
        }

        res.json({ brandKit, message: "Brand Identity successfully updated!" });
    } catch (error) {
        console.error("Brand Kit Update Error:", error);
        console.error("Payload causing error:", { id, userId, brandKitData: req.body });
        Sentry.captureException(error);
        res.status(500).json({
            message: 'Internal server error',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Delete brand kit
export const deleteBrandKit = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { id } = req.params;

        await prisma.brandKit.delete({
            where: { id, userId }
        });

        res.json({ message: "Brand Identity deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Unlock Pro Studio with credits
export const unlockProStudio = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.hasProAccess) {
            return res.status(400).json({ message: 'You already have Pro Studio Access unlocked.' });
        }

        const UNLOCK_COST = 250; // Defining a cost

        if (user.credits < UNLOCK_COST) {
            return res.status(400).json({ message: `Insufficient credits. You need ${UNLOCK_COST} credits to unlock Pro Studio. Please purchase more from the Billing page.` });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: UNLOCK_COST },
                hasProAccess: true
            }
        });

        res.json({ message: "Pro Studio Successully Unlocked! Enjoy lifetime access." });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Unlock Generation Pipeline with credits
export const unlockPipeline = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.hasPipelineAccess) {
            return res.status(400).json({ message: 'You already have Pipeline Access unlocked.' });
        }

        const UNLOCK_COST = 1000; // Loophole Fix: Direct cash (₹499) should be the cheaper route.

        if (user.credits < UNLOCK_COST) {
            return res.status(400).json({ message: `Insufficient credits. You need ${UNLOCK_COST} credits to unlock the Generation Pipeline. Direct cash payment (₹499) is the recommended cheaper alternative.` });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: UNLOCK_COST },
                hasPipelineAccess: true
            }
        });

        res.json({ message: "Generation Pipeline Successfully Unlocked! Enjoy lifetime access." });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
// Unlock Brand Hub with credits
export const unlockBrandHub = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.hasBrandHubAccess) {
            return res.status(400).json({ message: 'Brand Hub is already unlocked.' });
        }

        // 750 (Starter) vs 500 (Pro) -> 33% Discount for Pro users as requested
        const UNLOCK_COST = user.hasProAccess ? 500 : 750;

        if (user.credits < UNLOCK_COST) {
            return res.status(400).json({ message: `Insufficient credits. You need ${UNLOCK_COST} credits to unlock the Brand Hub. (Pro users get a 33% discount).` });
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { decrement: UNLOCK_COST },
                hasBrandHubAccess: true
            }
        });

        res.json({ message: "Brand Hub Successfully Unlocked! Craft your custom identities now." });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
