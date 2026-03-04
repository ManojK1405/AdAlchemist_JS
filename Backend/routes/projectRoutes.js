import express from 'express';
import { createProject, createVideo, deleteProject, getAllPublishedProjects, getProjectById, editGeneration, editVideo, getTrendingProjects, saveEditedImage, setAsMaster, toggleReview, getReviewProject } from '../controllers/projectController.js';
import { addToQueue, deleteFromQueue, getQueue, reorderQueue, updateQueueItem } from '../controllers/queueController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../configs/multer.js';
import { prisma } from '../configs/prisma.js';

const projectRouter = express.Router();

projectRouter.post('/create', protect, upload.fields([{ name: 'images', maxCount: 2 }, { name: 'logo', maxCount: 1 }]), createProject);
projectRouter.post('/video', protect, createVideo);
projectRouter.get('/published', getAllPublishedProjects);
projectRouter.get('/trending', getTrendingProjects);
projectRouter.delete('/:projectId', protect, deleteProject);

// Queue Routes
projectRouter.post('/queue', protect, addToQueue);
projectRouter.get('/queue', protect, getQueue);
projectRouter.delete('/queue/:jobId', protect, deleteFromQueue);
projectRouter.patch('/queue/:jobId', protect, updateQueueItem);
projectRouter.post('/queue/reorder', protect, reorderQueue);

projectRouter.get('/:projectId', protect, getProjectById);
projectRouter.post("/:projectId/edit", protect, upload.single('logo'), editGeneration);
projectRouter.post("/edit-video", protect, editVideo);
projectRouter.post('/:projectId/save-edit', protect, saveEditedImage);
projectRouter.post('/:projectId/set-master', protect, setAsMaster);
projectRouter.post('/:projectId/evaluate', protect, async (req, res) => {
    const { projectId } = req.params;
    const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
    const userId = auth?.userId;
    try {
        const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
        if (!project) return res.status(404).json({ message: "Project not found" });

        // This is a free utility but depends on Gemini Flash
        const { evaluateAdPerformance } = await import('../controllers/projectController.js');
        await evaluateAdPerformance(projectId);

        const updated = await prisma.project.findUnique({ where: { id: projectId } });
        res.json({ score: updated.engagementScore, feedback: updated.scoringFeedback });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

projectRouter.post('/:projectId/review/toggle', protect, toggleReview);
projectRouter.get('/review/:projectId', getReviewProject);

export default projectRouter;
