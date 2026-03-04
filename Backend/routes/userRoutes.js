import express from 'express';
import { getUserCredits, getAllProjects, getUserProjectById, toggleProjectPublic, getBrandKit, updateBrandKit, deleteBrandKit, unlockProStudio, unlockPipeline, unlockBrandHub } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { prisma } from '../configs/prisma.js';

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.get('/projects', protect, getAllProjects);
userRouter.get('/projects/:projectId', protect, getUserProjectById);
userRouter.post('/projects/:projectId', protect, toggleProjectPublic);

import upload from '../configs/multer.js';

userRouter.get('/brand-kit', protect, getBrandKit);
userRouter.post('/brand-kit', protect, upload.fields([{ name: 'logoDark', maxCount: 1 }, { name: 'logoLight', maxCount: 1 }]), updateBrandKit);
userRouter.delete('/brand-kit/:id', protect, deleteBrandKit);

userRouter.post('/unlock-pipeline', protect, unlockPipeline);
userRouter.post('/unlock-brand-hub', protect, unlockBrandHub);

// Publicly fetch global feature flags/configs
userRouter.get('/config', async (req, res) => {
    try {
        const settings = await prisma.globalSettings.findUnique({ where: { id: 'system' } });
        res.json(settings || {});
    } catch (err) {
        res.status(500).json({ message: "Error fetching config" });
    }
});

export default userRouter;
