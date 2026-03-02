import express from 'express';
import { validateCoupon, redeemCoupon, createCoupon, listCoupons, deleteCoupon } from '../controllers/couponController.js';

const couponRouter = express.Router();

// Public/User Routes
couponRouter.post('/validate', validateCoupon);
couponRouter.post('/redeem', redeemCoupon);

// Admin Routes (Add middleware if needed)
couponRouter.post('/admin/create', createCoupon);
couponRouter.get('/admin/list', listCoupons);
couponRouter.delete('/admin/:id', deleteCoupon);

export default couponRouter;
