import express from 'express';
import { validateCoupon, redeemCoupon, createCoupon, listCoupons } from '../controllers/couponController.js';

const couponRouter = express.Router();

// Public/User Routes
couponRouter.post('/validate', validateCoupon);
couponRouter.post('/redeem', redeemCoupon);

// Admin Routes (Add middleware if needed)
couponRouter.post('/admin/create', createCoupon);
couponRouter.get('/admin/list', listCoupons);

export default couponRouter;
