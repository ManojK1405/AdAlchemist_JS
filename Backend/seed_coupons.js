import { prisma } from './configs/prisma.js';

const coupons = [
    // Free Credits (One-time per user)
    { code: 'FREE100', type: 'FREE_CREDITS', value: 100 },
    { code: 'WELCOME50', type: 'FREE_CREDITS', value: 50 },
    { code: 'BONUS200', type: 'FREE_CREDITS', value: 200 },
    { code: 'LOYALTY500', type: 'FREE_CREDITS', value: 500 },
    { code: 'GIFT20', type: 'FREE_CREDITS', value: 20 },

    // Discounts (Multiple uses globally, but per-user tracking still applies if we want)
    // User said: "these can be used multiple times"
    { code: 'SAVE10', type: 'DISCOUNT', value: 10 },
    { code: 'PRO15', type: 'DISCOUNT', value: 15 },
    { code: 'AGENCY20', type: 'DISCOUNT', value: 20 },
    { code: 'FESTIVE25', type: 'DISCOUNT', value: 25 },
    { code: 'ALCHEMIST50', type: 'DISCOUNT', value: 50 },
];

async function seed() {
    console.log("Seeding coupons...");
    for (const c of coupons) {
        await prisma.coupon.upsert({
            where: { code: c.code },
            update: c,
            create: c
        });
        console.log(`- ${c.code} (${c.type})`);
    }
    console.log("Done!");
    process.exit(0);
}

seed();
