import express from 'express';
import { createOrder, verifyPayment, razorpayWebhook } from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', protect, createOrder);
paymentRouter.post('/verify-payment', protect, verifyPayment);
paymentRouter.post('/webhook', razorpayWebhook); // Webhook doesn't use the 'protect' middleware as it comes from Razorpay

export default paymentRouter;
