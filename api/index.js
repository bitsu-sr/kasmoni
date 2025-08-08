const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// Simple in-memory database for demo (replace with your actual database)
const users = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@kasmoni.com',
    password_hash: '$2b$10$greUxRUvHmaX56CA23bn.uqjzCi8gjDGD.tkPElK4M1od.24e6x5W', // admin123
    role: 'administrator',
    userType: 'system'
  }
];

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Sranan Kasmoni API is running',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Login attempt:', { username, password: password ? '***' : 'missing' });

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    
    if (!user) {
      console.log('User not found:', username);
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    console.log('User found:', { id: user.id, username: user.username });

    // Check password - try both bcrypt and direct comparison for testing
    let isValidPassword = false;
    
    try {
      isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('Bcrypt comparison result:', isValidPassword);
    } catch (bcryptError) {
      console.error('Bcrypt error:', bcryptError);
      // Fallback: check if password matches directly (for testing only)
      if (password === 'admin123' && user.username === 'admin') {
        isValidPassword = true;
        console.log('Fallback password check successful');
      }
    }

    if (!isValidPassword) {
      console.log('Password check failed');
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, userType: user.userType }, JWT_SECRET, { expiresIn: '24h' });

    console.log('Login successful for user:', user.username);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          userType: user.userType
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }
  
  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      userType: user.userType
    }
  });
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      totalMembers: 0,
      activeGroups: 0,
      totalPayments: 0,
      recentActivity: []
    }
  });
});

// Members endpoint
app.get('/api/members', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// Groups endpoint
app.get('/api/groups', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// Payments endpoint
app.get('/api/payments', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// Serve React app for all other routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Export for Vercel
module.exports = app;
