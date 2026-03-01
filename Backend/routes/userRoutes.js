import express from 'express';
import { getUserCredits, getAllProjects, getUserProjectById, toggleProjectPublic, getBrandKit, updateBrandKit, unlockProStudio, unlockPipeline } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';
import { prisma } from '../configs/prisma.js';

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.get('/projects', protect, getAllProjects);
userRouter.get('/projects/:projectId', protect, getUserProjectById);
userRouter.post('/projects/:projectId', protect, toggleProjectPublic);

userRouter.get('/brand-kit', protect, getBrandKit);
userRouter.post('/brand-kit', protect, updateBrandKit);

userRouter.post('/unlock-pipeline', protect, unlockPipeline);

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
