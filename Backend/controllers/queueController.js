import { prisma } from "../configs/prisma.js";

export const addToQueue = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { projectId, type, payload } = req.body;

        // Find current max position for this user
        const lastJob = await prisma.generationJob.findFirst({
            where: { userId },
            orderBy: { position: 'desc' }
        });

        const position = lastJob ? lastJob.position + 1 : 0;

        const job = await prisma.generationJob.create({
            data: {
                userId,
                projectId,
                type,
                payload,
                position,
                status: "PENDING"
            }
        });

        res.json({ message: "Job added to queue", job });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getQueue = async (req, res) => {
    try {
        const { userId } = req.auth();
        const queue = await prisma.generationJob.findMany({
            where: {
                userId,
                status: { in: ["PENDING", "PROCESSING"] }
            },
            orderBy: { position: 'asc' },
            include: { project: true }
        });
        res.json({ queue });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteFromQueue = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { jobId } = req.params;

        const job = await prisma.generationJob.findUnique({
            where: { id: jobId }
        });

        if (!job || job.userId !== userId) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.status === "PROCESSING") {
            return res.status(400).json({ message: "Cannot delete a job that is already processing" });
        }

        await prisma.generationJob.delete({
            where: { id: jobId }
        });

        res.json({ message: "Job removed from queue" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateQueueItem = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { jobId } = req.params;
        const { payload } = req.body;

        const job = await prisma.generationJob.findUnique({
            where: { id: jobId }
        });

        if (!job || job.userId !== userId) {
            return res.status(404).json({ message: "Job not found" });
        }

        if (job.status !== "PENDING") {
            return res.status(400).json({ message: "Can only edit pending jobs" });
        }

        const updatedJob = await prisma.generationJob.update({
            where: { id: jobId },
            data: { payload }
        });

        res.json({ message: "Job updated", job: updatedJob });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const reorderQueue = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { jobIds } = req.body; // Array of job IDs in new order

        await Promise.all(jobIds.map((id, index) => {
            return prisma.generationJob.update({
                where: { id, userId },
                data: { position: index }
            });
        }));

        res.json({ message: "Queue reordered" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
