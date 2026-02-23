import { prisma } from './configs/prisma.js';

const checkUsers = async () => {
    try {
        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, email: true, name: true }
        });
        console.log("Recent Users in DB:");
        console.table(users);
        process.exit(0);
    } catch (error) {
        console.error("DB Check failed:", error);
        process.exit(1);
    }
};

checkUsers();
