import express from 'express';
import { getAdminSettings, updateAdminSettings } from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';

const adminRouter = express.Router();

// Fetch settings
adminRouter.get('/settings', protect, getAdminSettings);

// Update settings
adminRouter.post('/settings', protect, updateAdminSettings);

export default adminRouter;
