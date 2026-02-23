import express from 'express';
import { createOrder, verifyPayment, razorpayWebhook, getUserTransactions } from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', protect, createOrder);
paymentRouter.post('/verify-payment', protect, verifyPayment);
paymentRouter.post('/webhook', razorpayWebhook);
paymentRouter.get('/transactions', protect, getUserTransactions);

export default paymentRouter;
