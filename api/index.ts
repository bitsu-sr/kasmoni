import express from 'express';
import cors from 'cors';
import { errorHandler, notFound } from '../backend/src/middleware/errorHandler';
import { authenticateToken } from '../backend/src/middleware/auth';
import memberRoutes from '../backend/src/routes/members';
import groupRoutes from '../backend/src/routes/groups';
import paymentRoutes from '../backend/src/routes/payments';
import paymentRequestRoutes from '../backend/src/routes/paymentRequests';
import paymentLogsRoutes from '../backend/src/routes/paymentLogs';
import dashboardRoutes from '../backend/src/routes/dashboard';
import bankRoutes from '../backend/src/routes/banks';
import analyticsRoutes from '../backend/src/routes/analytics';
import authRoutes from '../backend/src/routes/auth';
import messageRoutes from '../backend/src/routes/messages';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/members', memberRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/payment-requests', paymentRequestRoutes);
app.use('/api/payment-logs', paymentLogsRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sranan Kasmoni API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export for Vercel
export default app;
