import { prisma } from "./configs/prisma.js";
import { processImageGeneration, processVideoGeneration } from "./utils/generation.js";
import { sendEmail, getQueueCompleteEmailTemplate } from "./utils/email.js";

const WORKER_INTERVAL = 5000; // Check every 5 seconds if idle
const CONCURRENCY = 5; // How many jobs to process simultaneously for FREE

async function processJob(job) {
    console.log(`[Worker] Processing job ${job.id} (Type: ${job.type}) for User ${job.userId}`);

    try {

        let result;
        if (job.type === "IMAGE") {
            result = await processImageGeneration(job.projectId, job.payload);
        } else if (job.type === "VIDEO") {
            result = await processVideoGeneration(job.projectId, job.payload);
        }
        // Add EDIT_IMAGE and EDIT_VIDEO if needed

        await prisma.generationJob.update({
            where: { id: job.id },
            data: { status: "COMPLETED" }
        });

        console.log(`[Worker] Job ${job.id} completed successfully`);

        // Check if this was the last pending job for this user
        const remainingJobs = await prisma.generationJob.count({
            where: {
                userId: job.userId,
                status: "PENDING"
            }
        });

        if (remainingJobs === 0) {
            const user = await prisma.user.findUnique({ where: { id: job.userId } });
            const completedJobsCount = await prisma.generationJob.count({
                where: {
                    userId: job.userId,
                    status: "COMPLETED",
                    createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Completed in last 24h as a rough filter
                }
            });

            if (user?.email) {
                const template = getQueueCompleteEmailTemplate(user.name, completedJobsCount);
                await sendEmail(user.email, "All your generations are ready! 🚀", template);
            }
        }

    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed:`, error);
        await prisma.generationJob.update({
            where: { id: job.id },
            data: { status: "FAILED", error: error.message }
        });

        // Refund credits on failure
        const refundAmount = job.type === "IMAGE" ? 10 : job.type === "VIDEO" ? 40 : 0;
        if (refundAmount > 0) {
            await prisma.user.update({
                where: { id: job.userId },
                data: { credits: { increment: refundAmount } }
            });
            console.log(`[Worker] Refunded ${refundAmount} credits to User ${job.userId} due to job failure.`);
        }

        // Reset project generating status
        if (job.projectId) {
            await prisma.project.update({
                where: { id: job.projectId },
                data: { isGenerating: false, error: error.message }
            });
        }
    }
}

async function startWorker() {
    console.log("[Worker] Background worker started...");

    while (true) {
        try {
            await prisma.$connect();

            // Fetch a batch of pending jobs
            const jobs = await prisma.generationJob.findMany({
                where: { status: "PENDING" },
                orderBy: [
                    { position: 'asc' },
                    { createdAt: 'asc' }
                ],
                take: CONCURRENCY
            });

            if (jobs.length > 0) {
                console.log(`[Worker] Found ${jobs.length} jobs. Attempting to process concurrently...`);

                // Process the current batch in parallel
                await Promise.allSettled(jobs.map(async (job) => {
                    // Individually claim each job to prevent race conditions during parallel execution
                    const result = await prisma.generationJob.updateMany({
                        where: { id: job.id, status: "PENDING" },
                        data: { status: "PROCESSING" }
                    });

                    if (result.count === 1) {
                        try {
                            await processJob(job);
                        } catch (e) {
                            console.error(`[Worker] Failed task ${job.id}:`, e.message);
                        }
                    }
                }));

                // Short sleep after processing a batch to prevent DB spam
                await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
                await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL));
            }
        } catch (error) {
            console.error("[Worker] Loop error (retrying in 5s):", error.message);
            await new Promise(resolve => setTimeout(resolve, WORKER_INTERVAL));
        }
    }
}


// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startWorker();
}

export { startWorker };
