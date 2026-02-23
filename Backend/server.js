import 'dotenv/config';
import './configs/instument.js';
import express from 'express';
import cors from 'cors';
import { clerkMiddleware } from '@clerk/express'
import clerkWebHooks from './controllers/clerk.js';
import * as Sentry from "@sentry/node";
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import socialRouter from './routes/socialRoutes.js';
import metaRouter from './routes/metaRoutes.js';
import paymentRouter from './routes/paymentRoutes.js';


const app = express();

//Middleware
app.use(cors({
    origin: ['http://localhost:5174', 'https://adalchemist.vercel.app', 'https://www.ad-alchemist.shop']
}
));

app.post('/api/clerk', express.raw({ type: 'application/json' }), clerkWebHooks)

app.use(express.json());
app.use(clerkMiddleware());

//Routes
app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);
app.use('/api/social', socialRouter);
app.use('/api/meta', metaRouter);
app.use('/api/payment', paymentRouter);


app.get('/', (req, res) => {
    res.send('Server is live');
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;
