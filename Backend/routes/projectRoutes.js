import express from 'express';
import { createProject, createVideo, deleteProject, getAllPublishedProjects, getProjectById, editGeneration, editVideo, getTrendingProjects, saveEditedImage } from '../controllers/projectController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../configs/multer.js';

const projectRouter = express.Router();

projectRouter.post('/create', protect, upload.fields([{ name: 'images', maxCount: 2 }, { name: 'logo', maxCount: 1 }]), createProject);
projectRouter.post('/video', protect, createVideo);
projectRouter.get('/published', getAllPublishedProjects);
projectRouter.get('/trending', getTrendingProjects);
projectRouter.delete('/:projectId', protect, deleteProject);
projectRouter.get('/:projectId', protect, getProjectById);
projectRouter.post("/:projectId/edit", protect, upload.single('logo'), editGeneration);
projectRouter.post("/edit-video", protect, editVideo);
projectRouter.post('/:projectId/save-edit', protect, saveEditedImage);

export default projectRouter;
