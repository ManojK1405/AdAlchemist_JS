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
    deleteDiscussion,
    tipCreator
} from '../controllers/socialController.js';
import { getLeaderboard } from '../controllers/leaderboardController.js';
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

// Tipping
socialRouter.post('/tip', protect, tipCreator);

// Leaderboard
socialRouter.get('/leaderboard', getLeaderboard);

export default socialRouter;
