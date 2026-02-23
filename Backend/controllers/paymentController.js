import Razorpay from 'razorpay';
import crypto from 'crypto';
import { prisma } from '../configs/prisma.js';
import * as Sentry from '@sentry/node';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plans Configuration
const PLANS = {
    starter: { credits: 100, amount: 499, name: "Starter" }, // ₹499
    pro: { credits: 500, amount: 1999, name: "Pro" },     // ₹1999
    agency: { credits: 2000, amount: 4999, name: "Agency" } // ₹4999
};

export const createOrder = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { planId } = req.body;

        const plan = PLANS[planId.toLowerCase()];
        if (!plan) {
            return res.status(400).json({ message: "Invalid plan selected" });
        }

        const options = {
            amount: plan.amount * 100, // amount in the smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}_${userId.slice(-5)}`,
        };

        const order = await razorpay.orders.create(options);

        // Create a pending transaction in DB
        await prisma.transaction.create({
            data: {
                userId,
                planId: planId.toLowerCase(),
                amount: plan.amount,
                credits: plan.credits,
                orderId: order.id,
                status: "pending"
            }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        Sentry.captureException(error);
        console.error("Razorpay Order Error:", error);
        res.status(500).json({ message: "Failed to create payment order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {
            // Update transaction and user credits
            const transaction = await prisma.transaction.findUnique({
                where: { orderId: razorpay_order_id }
            });

            if (!transaction || transaction.status === "success") {
                return res.status(400).json({ message: "Transaction already processed or not found" });
            }

            // Atomically update transaction and user credits
            await prisma.$transaction([
                prisma.transaction.update({
                    where: { id: transaction.id },
                    data: {
                        status: "success",
                        paymentId: razorpay_payment_id,
                        signature: razorpay_signature
                    }
                }),
                prisma.user.update({
                    where: { id: userId },
                    data: {
                        credits: { increment: transaction.credits }
                    }
                })
            ]);

            res.json({ message: "Payment verified and credits added successfully!" });
        } else {
            // Mark transaction as failed
            await prisma.transaction.update({
                where: { orderId: razorpay_order_id },
                data: { status: "failed" }
            });
            res.status(400).json({ message: "Invalid payment signature" });
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error("Razorpay Verification Error:", error);
        res.status(500).json({ message: "Payment verification failed" });
    }
};
