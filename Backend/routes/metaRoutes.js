import express from 'express';
import { connectMeta, getMetaPages, publishToMeta } from '../controllers/metaController.js';
import { protect } from '../middlewares/auth.js';

const metaRouter = express.Router();

metaRouter.post('/connect', protect, connectMeta);
metaRouter.get('/pages', protect, getMetaPages);
metaRouter.post('/publish', protect, publishToMeta);

export default metaRouter;
