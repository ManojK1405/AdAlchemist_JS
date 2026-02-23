import express from 'express';
import { getUserCredits, getAllProjects, getUserProjectById, toggleProjectPublic, getBrandKit, updateBrandKit } from '../controllers/userController.js';
import { protect } from '../middlewares/auth.js';

const userRouter = express.Router();

userRouter.get('/credits', protect, getUserCredits);
userRouter.get('/projects', protect, getAllProjects);
userRouter.get('/projects/:projectId', protect, getUserProjectById);
userRouter.post('/projects/:projectId', protect, toggleProjectPublic);

userRouter.get('/brand-kit', protect, getBrandKit);
userRouter.post('/brand-kit', protect, updateBrandKit);

export default userRouter;
