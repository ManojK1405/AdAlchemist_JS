import { prisma } from './configs/prisma.js';

const checkTips = async () => {
    try {
        const tips = await prisma.tip.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { sender: true, recipient: true }
        });
        console.log("Recent Tips in DB:");
        tips.forEach(tip => {
            console.log(`From: ${tip.sender.name} To: ${tip.recipient.name} Amount: ${tip.amount} At: ${tip.createdAt}`);
        });
        process.exit(0);
    } catch (error) {
        console.error("DB Check failed:", error);
        process.exit(1);
    }
};

checkTips();
