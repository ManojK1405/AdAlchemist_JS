import 'dotenv/config';
import './configs/instument.js';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import clerkWebHooks from './controllers/clerk.js';
import * as Sentry from "@sentry/node";
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import socialRouter from './routes/socialRoutes.js';
import metaRouter from './routes/metaRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import couponRouter from './routes/couponRoutes.js';
import { startWorker } from './worker.js';
import { connectRedis } from './configs/redis.js';

// Initialize Redis 
connectRedis();

const app = express();

app.use(compression());

//Middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5178', 'https://adalchemist.vercel.app', 'https://www.ad-alchemist.shop']
}
));

app.post('/api/clerk', express.raw({ type: 'application/json' }), clerkWebHooks)

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(clerkMiddleware());

//Routes
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
app.use('/api/social', socialRouter);
app.use('/api/meta', metaRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupon', couponRouter);


app.get('/', (req, res) => {
    res.send('Server is live');
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

// Start background worker
startWorker();

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
