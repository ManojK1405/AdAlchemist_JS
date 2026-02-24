import Razorpay from 'razorpay';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import { prisma } from '../configs/prisma.js';
import * as Sentry from '@sentry/node';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Plans Configuration
const PLANS = {
    starter: { credits: 100, amount: 49.9, name: "Starter" }, // ₹49.9
    pro: { credits: 500, amount: 199.9, name: "Pro" },     // ₹199.9
    agency: { credits: 2000, amount: 499.9, name: "Agency" } // ₹499.9
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
            amount: Math.round(plan.amount * 100), // amount in the smallest currency unit (paise)
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

export const cancelPayment = async (req, res) => {
    try {
        const { orderId } = req.body;

        const transaction = await prisma.transaction.findUnique({
            where: { orderId }
        });

        if (!transaction || transaction.status !== "pending") {
            return res.status(400).json({ message: "Transaction not found or already processed" });
        }

        await prisma.transaction.update({
            where: { id: transaction.id },
            data: { status: "failed" }
        });

        res.json({ message: "Payment marked as failed" });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Cancel Payment Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(JSON.stringify(req.body))
            .digest("hex");

        if (signature === expectedSignature) {
            const { event, payload } = req.body;

            // Handle order.paid event
            if (event === "order.paid") {
                const orderId = payload.order.entity.id;
                const paymentId = payload.payment.entity.id;

                const transaction = await prisma.transaction.findUnique({
                    where: { orderId }
                });

                if (transaction && transaction.status !== "success") {
                    await prisma.$transaction([
                        prisma.transaction.update({
                            where: { id: transaction.id },
                            data: {
                                status: "success",
                                paymentId: paymentId
                            }
                        }),
                        prisma.user.update({
                            where: { id: transaction.userId },
                            data: {
                                credits: { increment: transaction.credits }
                            }
                        })
                    ]);
                    console.log(`Webhook: Credits added for order ${orderId}`);
                }
            }
            res.status(200).json({ status: "ok" });
        } else {
            res.status(400).json({ message: "Invalid webhook signature" });
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Webhook processing failed" });
    }
};

export const getUserTransactions = async (req, res) => {
    try {
        const { userId } = req.auth();
        const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });

        res.json({ transactions });
    } catch (error) {
        Sentry.captureException(error);
        console.error("Fetch Transactions Error:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
    }
};

export const generateReceipt = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { transactionId } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { user: true }
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        if (transaction.userId !== userId) {
            return res.status(403).json({ message: "Unauthorized access to transaction" });
        }

        const doc = new PDFDocument({ margin: 50 });

        // HTTP headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt_${transaction.orderId}.pdf`);

        doc.pipe(res);

        // Header
        doc.fillColor("#06b6d4")
            .fontSize(24)
            .text("AdAlchemist", 50, 50);

        doc.fillColor("#444")
            .fontSize(10)
            .text("ADALCHEMIST AI SOLUTIONS", 200, 55, { align: 'right' })
            .text("contact@adalchemist.ai", 200, 70, { align: 'right' })
            .text("www.adalchemist.ai", 200, 85, { align: 'right' });

        doc.moveDown();
        doc.strokeColor("#eee").lineWidth(1).moveTo(50, 110).lineTo(550, 110).stroke();

        // Invoice Info
        doc.moveDown(2);
        doc.fillColor("#444").fontSize(14).text("RECEIPT / INVOICE");
        doc.fontSize(10).moveDown(0.5);
        doc.text(`Order ID: ${transaction.orderId}`);
        doc.text(`Payment ID: ${transaction.paymentId || 'N/A'}`);
        doc.text(`Date: ${new Date(transaction.createdAt).toLocaleDateString()}`);
        doc.text(`Status: ${transaction.status.toUpperCase()}`);

        // Billing To
        doc.moveDown(2);
        doc.fontSize(12).text("BILL TO:");
        doc.fontSize(10).moveDown(0.5);
        doc.text(transaction.user.name);
        doc.text(transaction.user.email);

        // Table Header
        const tableTop = 300;
        doc.moveDown(3);
        doc.fillColor("#f3f4f6").rect(50, tableTop, 500, 25).fill();
        doc.fillColor("#1f2937").fontSize(10).text("PLAN DESCRIPTION", 60, tableTop + 8);
        doc.text("CREDITS", 300, tableTop + 8);
        doc.text("AMOUNT", 450, tableTop + 8, { align: 'right' });

        // Table Row
        const plan = PLANS[transaction.planId] || { name: transaction.planId, credits: transaction.credits };
        doc.fillColor("#444").text(`${plan.name} Plan`, 60, tableTop + 35);
        doc.text(`${transaction.credits}`, 300, tableTop + 35);
        doc.text(`INR ${transaction.amount.toFixed(2)}`, 450, tableTop + 35, { align: 'right' });

        doc.strokeColor("#eee").lineWidth(1).moveTo(50, tableTop + 60).lineTo(550, tableTop + 60).stroke();

        // Total
        doc.moveDown(2);
        doc.fontSize(12).fillColor("#1f2937").text("TOTAL AMOUNT:", 350, tableTop + 80);
        doc.fontSize(14).fillColor("#06b6d4").text(`INR ${transaction.amount.toFixed(2)}`, 450, tableTop + 78, { align: 'right' });

        // Footer
        const footerPosition = 700;
        doc.fillColor("#9ca3af")
            .fontSize(8)
            .text("This is a computer generated receipt. No physical signature is required.", 50, footerPosition, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        Sentry.captureException(error);
        console.error("Receipt Generation Error:", error);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to generate receipt" });
        }
    }
};
