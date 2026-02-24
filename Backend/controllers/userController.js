import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import { clerkClient } from '@clerk/express';


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

        res.json({ credits: user.credits });
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

// Get user brand kit
export const getBrandKit = async (req, res) => {
    try {
        const { userId } = req.auth();
        const brandKit = await prisma.brandKit.findUnique({
            where: { userId },
        });
        res.json({ brandKit: brandKit || { color: "#4f46e5", voice: "" } });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update user brand kit
export const updateBrandKit = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { color, voice } = req.body;

        const brandKit = await prisma.brandKit.upsert({
            where: { userId },
            update: { color, voice },
            create: { userId, color, voice },
        });

        res.json({ brandKit, message: "Brand Kit successfully updated!" });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
