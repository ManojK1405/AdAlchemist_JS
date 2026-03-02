import { prisma } from '../configs/prisma.js';

// Validate Coupon
export const validateCoupon = async (req, res) => {
    try {
        const { code, planId } = req.body;
        const { userId } = req.auth;

        if (!code) {
            return res.status(400).json({ message: "Coupon code is required" });
        }

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() },
            include: { usages: { where: { userId } } }
        });

        if (!coupon || !coupon.isActive) {
            return res.status(404).json({ message: "Invalid or inactive coupon code" });
        }

        if (coupon.expiryDate && new Date() > coupon.expiryDate) {
            return res.status(400).json({ message: "Coupon has expired" });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ message: "Coupon usage limit reached" });
        }

        if (coupon.usages.length > 0) {
            return res.status(400).json({ message: "You have already used this coupon" });
        }

        res.json({
            valid: true,
            type: coupon.type,
            value: coupon.value,
            message: coupon.type === 'DISCOUNT' ? `${coupon.value}% discount applied!` : `Valid for ${coupon.value} free credits!`
        });

    } catch (error) {
        console.error("Coupon Validation Error:", error);
        res.status(500).json({ message: "Error validating coupon" });
    }
};

// Redeem Free Credits Coupon
export const redeemCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        const { userId } = req.auth;

        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon || !coupon.isActive || coupon.type !== 'FREE_CREDITS') {
            return res.status(400).json({ message: "Invalid coupon for redemption" });
        }

        // Check usage
        const existingUsage = await prisma.couponUsage.findUnique({
            where: {
                userId_couponId: {
                    userId,
                    couponId: coupon.id
                }
            }
        });

        if (existingUsage) {
            return res.status(400).json({ message: "You have already redeemed this coupon" });
        }

        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
            return res.status(400).json({ message: "Coupon usage limit reached" });
        }

        // Start transaction
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: Math.floor(coupon.value) } }
            }),
            prisma.couponUsage.create({
                data: {
                    userId,
                    couponId: coupon.id
                }
            }),
            prisma.coupon.update({
                where: { id: coupon.id },
                data: { usedCount: { increment: 1 } }
            })
        ]);

        res.json({
            success: true,
            message: `Successfully redeemed ${coupon.value} credits!`,
            creditsAdded: coupon.value
        });

    } catch (error) {
        console.error("Coupon Redemption Error:", error);
        res.status(500).json({ message: "Error redeeming coupon" });
    }
};

// ADMIN: Create Coupon
export const createCoupon = async (req, res) => {
    try {
        const { code, type, value, maxUses, expiryDate } = req.body;

        const coupon = await prisma.coupon.create({
            data: {
                code: code.toUpperCase(),
                type,
                value: parseFloat(value),
                maxUses: maxUses ? parseInt(maxUses) : null,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        });

        res.json({ success: true, coupon });
    } catch (error) {
        console.error("Coupon Creation Error:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Coupon code already exists" });
        }
        res.status(500).json({ message: "Error creating coupon" });
    }
};

// ADMIN: List Coupons
export const listCoupons = async (req, res) => {
    try {
        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, coupons });
    } catch (error) {
        res.status(500).json({ message: "Error fetching coupons" });
    }
};

// ADMIN: Delete Coupon
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.coupon.delete({
            where: { id }
        });
        res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting coupon" });
    }
};