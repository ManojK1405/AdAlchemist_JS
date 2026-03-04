import express from 'express';
import { getAdminSettings, updateAdminSettings, grantDemoAccess, revokeDemoAccess, verifyAdminPasscode } from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';

const adminRouter = express.Router();

// Verify passcode — public, no auth needed (passcode stays server-side)
adminRouter.post('/verify', verifyAdminPasscode);

// Fetch settings
adminRouter.get('/settings', protect, getAdminSettings);

// Update settings
adminRouter.post('/settings', protect, updateAdminSettings);

// Grant demo access to a user by email
adminRouter.post('/demo-access', protect, grantDemoAccess);

// Revoke demo access from a user by email
adminRouter.delete('/demo-access', protect, revokeDemoAccess);

export default adminRouter;
