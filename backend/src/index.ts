import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler, notFound } from './middleware/errorHandler';
import { authenticateToken } from './middleware/auth';
import memberRoutes from './routes/members';
import groupRoutes from './routes/groups';
import paymentRoutes from './routes/payments';
import paymentRequestRoutes from './routes/paymentRequests';
import paymentLogsRoutes from './routes/paymentLogs';
import dashboardRoutes from './routes/dashboard';
import bankRoutes from './routes/banks';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import messageRoutes from './routes/messages';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

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

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../../frontend/build')));

// Catch-all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return notFound(req, res);
  }
  
  res.sendFile(path.join(__dirname, '../../frontend/build/index.html'));
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sranan Kasmoni API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network access: http://0.0.0.0:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
}); 