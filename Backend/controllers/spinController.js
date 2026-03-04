import { prisma } from '../configs/prisma.js';
import * as Sentry from '@sentry/node';

// Prize table — house-weighted. Total weight = 100.
const PRIZES = [
    { id: 'nothing', label: 'Better Luck\nNext Time', type: 'NOTHING', weight: 30 },
    { id: 'credits_2', label: '2 Credits', type: 'CREDITS', value: 2, weight: 28 },
    { id: 'credits_5', label: '5 Credits', type: 'CREDITS', value: 5, weight: 20 },
    { id: 'credits_10', label: '10 Credits', type: 'CREDITS', value: 10, weight: 10 },
    { id: 'coupon_10', label: '10% Off', type: 'COUPON', value: 10, weight: 6 },
    { id: 'credits_20', label: '20 Credits', type: 'CREDITS', value: 20, weight: 3 },
    { id: 'coupon_50', label: '50% Off', type: 'COUPON', value: 50, weight: 2 },
    { id: 'brandhub_80', label: '80% Brand Hub', type: 'BRANDHUB', value: 80, weight: 1 },
];

const TOTAL_WEIGHT = PRIZES.reduce((sum, p) => sum + p.weight, 0); // 100

function pickPrize() {
    let rand = Math.random() * TOTAL_WEIGHT;
    for (const prize of PRIZES) {
        rand -= prize.weight;
        if (rand <= 0) return prize;
    }
    return PRIZES[0]; // fallback
}

async function createCoupon(discount, userId) {
    const code = `SPIN-${userId.slice(-6).toUpperCase()}-${Date.now()}`;
    return prisma.coupon.create({
        data: {
            code,
            type: 'DISCOUNT',
            value: discount,
            isActive: true,
            maxUses: 1,
            expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        }
    });
}

export const spinWheel = async (req, res) => {
    try {
        const { userId } = req.auth();

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 24-hour cooldown check
        if (user.lastSpinAt) {
            const hoursSinceSpin = (Date.now() - new Date(user.lastSpinAt).getTime()) / (1000 * 60 * 60);
            if (hoursSinceSpin < 24) {
                const nextSpin = new Date(user.lastSpinAt.getTime() + 24 * 60 * 60 * 1000);
                return res.status(429).json({
                    message: 'You can only spin once every 24 hours.',
                    nextSpinAt: nextSpin.toISOString(),
                });
            }
        }

        const prize = pickPrize();

        // Award prize
        let couponCode = null;

        if (prize.type === 'CREDITS') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: prize.value },
                    lastSpinAt: new Date(),
                }
            });
        } else if (prize.type === 'COUPON') {
            const coupon = await createCoupon(prize.value, userId);
            couponCode = coupon.code;
            await prisma.user.update({ where: { id: userId }, data: { lastSpinAt: new Date() } });
        } else if (prize.type === 'BRANDHUB') {
            // 80% brand hub discount coupon
            const coupon = await createCoupon(80, userId);
            couponCode = coupon.code;
            await prisma.user.update({ where: { id: userId }, data: { lastSpinAt: new Date() } });
        } else {
            // NOTHING — just update lastSpinAt
            await prisma.user.update({ where: { id: userId }, data: { lastSpinAt: new Date() } });
        }

        return res.json({
            prize: {
                id: prize.id,
                label: prize.label,
                type: prize.type,
                value: prize.value || null,
            },
            couponCode,
            nextSpinAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });
    } catch (error) {
        Sentry.captureException(error);
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSpinStatus = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastSpinAt: true }
        });

        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.lastSpinAt) {
            return res.json({ canSpin: true, nextSpinAt: null });
        }

        const hoursSinceSpin = (Date.now() - new Date(user.lastSpinAt).getTime()) / (1000 * 60 * 60);
        const canSpin = hoursSinceSpin >= 24;
        const nextSpinAt = canSpin ? null : new Date(user.lastSpinAt.getTime() + 24 * 60 * 60 * 1000).toISOString();

        return res.json({ canSpin, nextSpinAt, prizes: PRIZES.map(p => ({ id: p.id, label: p.label, type: p.type })) });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export { PRIZES };
