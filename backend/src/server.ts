import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { startCronJobs } from './cron/scheduler';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import matchingRoutes from './routes/matching.routes';
import sessionRoutes from './routes/session.routes';
import accountabilityRoutes from './routes/accountability.routes';
import chatRoutes from './routes/chat.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/match-requests', matchingRoutes);
app.use('/sessions', sessionRoutes);
app.use('/score', accountabilityRoutes);
app.use('/chat', chatRoutes);
app.use('/notifications', notificationRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Cron Jobs
startCronJobs();

// Global Error Handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[Server] Running on port ${env.PORT}`);
});
