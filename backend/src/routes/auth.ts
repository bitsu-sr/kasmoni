import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getAll, getRow, runQuery } from '../utils/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { LoginRequest, CreateUserRequest, User, UserLog, ApiResponse } from '../types';
import { createMemberUser } from '../utils/memberAuth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }

    // First check system users table
    let user = await getRow('SELECT * FROM users WHERE LOWER(username) = LOWER(?) AND is_active = 1', [username]);
    let userType = 'system';
    
    // If not found in system users, check members table
    if (!user) {
      user = await getRow('SELECT * FROM members WHERE LOWER(username) = LOWER(?) AND is_active = 1', [username]);
      userType = 'member';
    }
    
    if (!user) {
      // Log failed login attempt
      await runQuery(`
        INSERT INTO user_logs (user_id, action, ip_address, user_agent) 
        VALUES (0, 'failed_login', ?, ?)
      `, [req.ip, req.get('User-Agent')]);
      
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      // Log failed login attempt
      await runQuery(`
        INSERT INTO user_logs (user_id, action, ip_address, user_agent) 
        VALUES (?, 'failed_login', ?, ?)
      `, [user.id, req.ip, req.get('User-Agent')]);
      
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Update last login
    if (userType === 'system') {
      await runQuery('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    } else {
      await runQuery('UPDATE members SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    }

    // Log successful login
    await runQuery(`
      INSERT INTO user_logs (user_id, action, ip_address, user_agent) 
      VALUES (?, 'login', ?, ?)
    `, [user.id, req.ip, req.get('User-Agent')]);

    const token = jwt.sign({ userId: user.id, userType }, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          userType
        }
      }
    } as ApiResponse<{ token: string; user: Partial<User> & { userType: string } }>);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user) {
      await runQuery(`
        INSERT INTO user_logs (user_id, action, ip_address, user_agent) 
        VALUES (?, 'logout', ?, ?)
      `, [req.user.id, req.ip, req.get('User-Agent')]);
    }

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ success: false, error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    const userData: any = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      userType: req.user.userType
    };

    // Add member-specific fields for member users
    if (req.user.userType === 'member') {
      userData.memberId = req.user.memberId;
      userData.firstName = req.user.firstName;
      userData.lastName = req.user.lastName;
    }

    res.json({
      success: true,
      data: userData
    } as ApiResponse<Partial<User>>);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
});

// Create user (only administrators and super users can create users)
router.post('/users', authenticateToken, requireRole(['administrator', 'super_user']), async (req: AuthenticatedRequest, res) => {
  try {
    const { username, email, password, role }: CreateUserRequest = req.body;

    if (!username || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Check permissions
    if (req.user?.role === 'super_user' && role === 'administrator') {
      return res.status(403).json({ success: false, error: 'Super users cannot create administrators' });
    }

    if (req.user?.role === 'super_user' && role === 'super_user') {
      return res.status(403).json({ success: false, error: 'Super users cannot create other super users' });
    }

    // Check if username or email already exists
    const existingUser = await getRow('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await runQuery(`
      INSERT INTO users (username, email, password_hash, role, created_by) 
      VALUES (?, ?, ?, ?, ?)
    `, [username, email, hashedPassword, role, req.user?.id]);

    res.json({
      success: true,
      data: { 
        id: result.lastID,
        initialPassword: password // Return the initial password for display
      },
      message: 'User created successfully'
    } as ApiResponse<{ id: number; initialPassword: string }>);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Get all users (only administrators can view all users)
router.get('/users', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    // Get system users
    const systemUsers = await getAll(`
      SELECT 
        u.id, u.username, u.email, u.role, u.is_active, u.last_login, u.created_at,
        creator.username as created_by_username,
        'system' as userType
      FROM users u
      LEFT JOIN users creator ON u.created_by = creator.id
      ORDER BY u.created_at DESC
    `);

    // Get member users (only those with user accounts)
    const memberUsers = await getAll(`
      SELECT 
        m.id, m.username, m.firstName, m.lastName, m.email, m.role, m.is_active, 
        m.last_login, m.user_created_at as created_at,
        'member' as userType,
        m.id as memberId
      FROM members m
      WHERE m.username IS NOT NULL AND m.password_hash IS NOT NULL
      ORDER BY m.user_created_at DESC
    `);

    // Combine both user types
    const allUsers = [...systemUsers, ...memberUsers];

    res.json({
      success: true,
      data: allUsers
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Get user logs (only administrators can view logs)
router.get('/logs', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const logs = await getAll(`
      SELECT ul.id, ul.user_id as userId, ul.action, ul.ip_address as ipAddress, ul.user_agent as userAgent, ul.created_at as createdAt,
             CASE 
               WHEN u.username IS NOT NULL THEN u.username
               WHEN m.firstName IS NOT NULL AND m.lastName IS NOT NULL THEN m.firstName || '.' || m.lastName
               WHEN m.firstName IS NOT NULL THEN m.firstName
               ELSE 'User ' || ul.user_id
             END as username,
             COALESCE(u.email, m.email) as email
      FROM user_logs ul
      LEFT JOIN users u ON ul.user_id = u.id
      LEFT JOIN members m ON ul.user_id = m.id
      ORDER BY ul.created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      data: logs
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get logs' });
  }
});

// Create user account for existing member
router.post('/members/:id/create-user', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    
    // Check if member exists
    const member = await getRow('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }
    
    // Check if member already has user account
    if (member.username && member.password_hash) {
      return res.status(400).json({ success: false, error: 'Member already has a user account' });
    }
    
    // Create user account
    const userCredentials = await createMemberUser(memberId, member.firstName, member.lastName);
    
    res.json({
      success: true,
      data: {
        memberId,
        username: userCredentials.username,
        password: userCredentials.password
      },
      message: 'User account created successfully for member'
    });
  } catch (error) {
    console.error('Error creating member user account:', error);
    res.status(500).json({ success: false, error: 'Failed to create user account' });
  }
});

// Update member username
router.put('/members/:id/username', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({ success: false, error: 'Username is required' });
    }
    
    const { updateMemberUsername } = require('../utils/memberAuth');
    const success = await updateMemberUsername(memberId, username);
    
    if (!success) {
      return res.status(400).json({ success: false, error: 'Username already taken' });
    }
    
    res.json({
      success: true,
      message: 'Username updated successfully'
    });
  } catch (error) {
    console.error('Error updating member username:', error);
    res.status(500).json({ success: false, error: 'Failed to update username' });
  }
});

// Update member password
router.put('/members/:id/password', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    
    const { updateMemberPassword } = require('../utils/memberAuth');
    await updateMemberPassword(memberId, password);
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error updating member password:', error);
    res.status(500).json({ success: false, error: 'Failed to update password' });
  }
});

// Update member role
router.put('/members/:id/role', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    const { role } = req.body;
    
    if (!role || !['administrator', 'super_user', 'normal_user'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Valid role is required' });
    }
    
    const { updateMemberRole } = require('../utils/memberAuth');
    await updateMemberRole(memberId, role);
    
    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// Toggle member user account status
router.put('/members/:id/toggle-status', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    
    const { toggleMemberUserStatus } = require('../utils/memberAuth');
    await toggleMemberUserStatus(memberId);
    
    res.json({
      success: true,
      message: 'User account status toggled successfully'
    });
  } catch (error) {
    console.error('Error toggling member user status:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle user account status' });
  }
});

// Generate new password for existing member
router.post('/members/:id/generate-password', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const memberId = parseInt(req.params.id);
    
    // Check if member exists and has user account
    const member = await getRow('SELECT * FROM members WHERE id = ? AND username IS NOT NULL AND password_hash IS NOT NULL', [memberId]);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found or does not have a user account' });
    }
    
    const { generateNewPasswordForMember } = require('../utils/memberAuth');
    const newPassword = await generateNewPasswordForMember(memberId);
    
    res.json({
      success: true,
      data: {
        memberId,
        newPassword
      },
      message: 'New password generated successfully'
    });
  } catch (error) {
    console.error('Error generating new password for member:', error);
    res.status(500).json({ success: false, error: 'Failed to generate new password' });
  }
});

// Change own password (for authenticated users)
router.put('/change-password', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
    }

    // Get user data based on user type
    let user;
    if (req.user?.userType === 'member') {
      user = await getRow('SELECT * FROM members WHERE id = ?', [req.user.id]);
    } else {
      user = await getRow('SELECT * FROM users WHERE id = ?', [req.user?.id]);
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password based on user type
    if (req.user?.userType === 'member') {
      await runQuery('UPDATE members SET password_hash = ? WHERE id = ?', [hashedPassword, req.user.id]);
    } else {
      await runQuery('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, req.user?.id]);
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, error: 'Failed to change password' });
  }
});

export default router; 