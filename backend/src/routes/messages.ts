import express from 'express';
import { getAll, getRow, runQuery } from '../utils/database';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

const router = express.Router();

// Get all messages (only administrators can view messages)
router.get('/', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const messages = await getAll(`
      SELECT 
        id, member_id as memberId, member_name as memberName, 
        member_email as memberEmail, member_phone as memberPhone,
        request_type as requestType, request_details as requestDetails,
        status, admin_notes as adminNotes, 
        created_at as createdAt,
        updated_at as updatedAt
      FROM messages 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: messages
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

// Create a new message (members can create messages)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { requestType, requestDetails } = req.body;

    if (!requestType || !requestDetails) {
      return res.status(400).json({ success: false, error: 'Request type and details are required' });
    }

    if (!['delete_account', 'change_info', 'payment_notification'].includes(requestType)) {
      return res.status(400).json({ success: false, error: 'Invalid request type' });
    }

    // Get member information
    const member = await getRow('SELECT * FROM members WHERE id = ?', [req.user?.memberId]);
    if (!member) {
      return res.status(404).json({ success: false, error: 'Member not found' });
    }

    const result = await runQuery(`
      INSERT INTO messages (member_id, member_name, member_email, member_phone, request_type, request_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      member.id,
      `${member.firstName} ${member.lastName}`,
      member.email,
      member.phoneNumber,
      requestType,
      requestDetails
    ]);

    res.json({
      success: true,
      data: {
        id: result.lastID,
        message: 'Message sent successfully'
      }
    } as ApiResponse<{ id: number; message: string }>);
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

// Update message status (only administrators can update status)
router.put('/:id/status', authenticateToken, requireRole(['administrator']), async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);
    const { status, adminNotes } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'read'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Valid status is required' });
    }

    await runQuery(`
      UPDATE messages 
      SET status = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, adminNotes || null, messageId]);

    res.json({
      success: true,
      message: 'Message status updated successfully'
    } as ApiResponse<void>);
  } catch (error) {
    console.error('Update message status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update message status' });
  }
});

// Get messages by member ID (members can view their own messages)
router.get('/member/:memberId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const memberId = parseInt(req.params.memberId);

    // Check if user is authorized to view these messages
    if (req.user?.userType === 'member' && req.user?.memberId !== memberId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    const messages = await getAll(`
      SELECT 
        id, member_id as memberId, member_name as memberName, 
        member_email as memberEmail, member_phone as memberPhone,
        request_type as requestType, request_details as requestDetails,
        status, admin_notes as adminNotes, created_at as createdAt,
        updated_at as updatedAt
      FROM messages 
      WHERE member_id = ?
      ORDER BY created_at DESC
    `, [memberId]);

    res.json({
      success: true,
      data: messages
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Get member messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

// Mark message as read (all authenticated users)
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id);

    // Check if message exists and is pending
    const message = await getRow('SELECT * FROM messages WHERE id = ?', [messageId]);
    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    if (message.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending messages can be marked as read' });
    }

    // Check authorization: members can only mark their own messages as read
    if (req.user?.userType === 'member' && req.user?.memberId !== message.member_id) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update message status to 'read' (we'll add this status)
    await runQuery(`
      UPDATE messages 
      SET status = 'read', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [messageId]);

    res.json({
      success: true,
      message: 'Message marked as read successfully'
    } as ApiResponse<void>);
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark message as read' });
  }
});

// Get unread messages count (admin only)
router.get('/unread-count', authenticateToken, requireRole(['administrator', 'super_user']), async (req, res) => {
  try {
    const result = await getRow(`
      SELECT COUNT(*) as count
      FROM messages
      WHERE status = 'pending'
    `);

    res.json({
      success: true,
      data: { count: result.count }
    } as ApiResponse<{ count: number }>);
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch unread count'
    });
  }
});

export default router; 