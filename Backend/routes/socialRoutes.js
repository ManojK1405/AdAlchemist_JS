import express from 'express';
import {
    addComment,
    getComments,
    toggleLikeComment,
    deleteComment,
    createDiscussion,
    getDiscussions,
    getDiscussionById,
    toggleLikeProject,
    deleteDiscussion
} from '../controllers/socialController.js';
import { protect } from '../middlewares/auth.js';

const socialRouter = express.Router();

// Comments
socialRouter.post('/comments', addComment);
socialRouter.get('/comments', getComments);
socialRouter.post('/comments/:commentId/like', protect, toggleLikeComment);
socialRouter.delete('/comments/:commentId', protect, deleteComment);

// Discussions
socialRouter.post('/discussions', protect, createDiscussion);
socialRouter.get('/discussions', getDiscussions);
socialRouter.get('/discussions/:id', getDiscussionById);
socialRouter.delete('/discussions/:id', protect, deleteDiscussion);

// Project Likes
socialRouter.post('/projects/:projectId/like', protect, toggleLikeProject);

export default socialRouter;
