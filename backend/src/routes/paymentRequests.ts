import express from 'express';
import { validateRequest, validateId, paymentRequestSchema, paymentRequestReviewSchema } from '../middleware/validation';
import { getAll, getRow, runQuery } from '../utils/database';
import { PaymentRequest, ApiResponse, User } from '../types';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const router = express.Router();

// Helper function to get current month year
const getCurrentMonthYear = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to create notification message for admin
const createPaymentRequestNotification = async (paymentRequestId: number, memberName: string, groupName: string, memberId: number) => {
  try {
    await runQuery(`
      INSERT INTO messages (member_id, member_name, member_email, member_phone, request_type, request_details)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      memberId, // Use the actual member ID for the notification
      memberName,
      '', // We'll leave email empty for now
      '', // We'll leave phone empty for now
      'payment_notification',
      `New payment request submitted by ${memberName} for group ${groupName}. Request ID: ${paymentRequestId}`
    ]);
  } catch (error) {
    console.error('Error creating payment request notification:', error);
  }
};

// Get all payment requests (admin only)
router.get('/', authenticateToken, requireRole(['administrator', 'super_user']), async (req, res) => {
  try {
    const { status, memberId, groupId } = req.query;
    
    let whereClause = '';
    let params: any[] = [];
    
    if (status) {
      whereClause += 'WHERE pr.status = ?';
      params.push(status);
    }
    
    if (memberId) {
      whereClause += whereClause ? ' AND pr.memberId = ?' : 'WHERE pr.memberId = ?';
      params.push(memberId);
    }
    
    if (groupId) {
      whereClause += whereClause ? ' AND pr.groupId = ?' : 'WHERE pr.groupId = ?';
      params.push(groupId);
    }

    const paymentRequests = await getAll(`
      SELECT pr.*, 
             m.firstName, m.lastName, m.email, m.phoneNumber,
             g.name as groupName, g.monthlyAmount,
             u.username as reviewerUsername
      FROM payment_requests pr
      JOIN members m ON pr.memberId = m.id
      JOIN groups g ON pr.groupId = g.id
      LEFT JOIN users u ON pr.reviewedBy = u.id
      ${whereClause}
      ORDER BY pr.createdAt DESC
    `, params);

    // Transform the flat data into nested structure
    const transformedRequests = paymentRequests.map(request => ({
      ...request,
      member: {
        id: request.memberId,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        phoneNumber: request.phoneNumber
      },
      group: {
        id: request.groupId,
        name: request.groupName,
        monthlyAmount: request.monthlyAmount
      },
      reviewer: request.reviewerUsername ? {
        username: request.reviewerUsername
      } : null
    }));

    res.json({
      success: true,
      data: transformedRequests
    } as ApiResponse<PaymentRequest[]>);
  } catch (error) {
    console.error('Error fetching payment requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment requests'
    });
  }
});

// Get payment requests for specific member (member only, own data)
router.get('/member/:memberId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    
    // Check if user is accessing their own data or is admin
    if (req.user?.userType !== 'member' || req.user?.memberId !== memberId) {
      if (req.user?.role !== 'administrator' && req.user?.role !== 'super_user') {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
    }

    const paymentRequests = await getAll(`
      SELECT pr.*, 
             g.name as groupName, g.monthlyAmount,
             u.username as reviewerUsername
      FROM payment_requests pr
      JOIN groups g ON pr.groupId = g.id
      LEFT JOIN users u ON pr.reviewedBy = u.id
      WHERE pr.memberId = ?
      ORDER BY pr.createdAt DESC
    `, [memberId]);

    // Transform the flat data into nested structure
    const transformedRequests = paymentRequests.map(request => ({
      ...request,
      group: {
        id: request.groupId,
        name: request.groupName,
        monthlyAmount: request.monthlyAmount
      },
      reviewer: request.reviewerUsername ? {
        username: request.reviewerUsername
      } : null
    }));

    res.json({
      success: true,
      data: transformedRequests
    } as ApiResponse<PaymentRequest[]>);
  } catch (error) {
    console.error('Error fetching member payment requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment requests'
    });
  }
});

// Get eligible groups and slots for member payment requests
router.get('/member/:memberId/eligible', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const memberId = parseInt(req.params.memberId);
    
    // Check if user is accessing their own data
    if (req.user?.userType !== 'member' || req.user?.memberId !== memberId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Get member's groups and slots
    const memberSlots = await getAll(`
      SELECT 
        gm.groupId,
        gm.receiveMonth as slot,
        g.name as groupName,
        g.monthlyAmount
      FROM group_members gm
      JOIN groups g ON gm.groupId = g.id
      WHERE gm.memberId = ?
      ORDER BY g.name, gm.receiveMonth
    `, [memberId]);

    res.json({
      success: true,
      data: memberSlots
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error fetching eligible slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch eligible slots'
    });
  }
});

// Create new payment request (member only)
router.post('/', authenticateToken, validateRequest(paymentRequestSchema), async (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.userType !== 'member') {
      return res.status(403).json({
        success: false,
        error: 'Only members can submit payment requests'
      });
    }

    const {
      groupId, amount, paymentDate, slot, paymentType,
      senderBank, receiverBank, proofOfPayment, requestNotes
    } = req.body;

    const memberId = req.user.memberId!;
    const paymentMonth = getCurrentMonthYear(); // Auto-set to current month

    // Validate that member belongs to this group and slot
    const memberSlot = await getRow(`
      SELECT gm.*, g.name as groupName
      FROM group_members gm
      JOIN groups g ON gm.groupId = g.id
      WHERE gm.groupId = ? AND gm.memberId = ? AND gm.receiveMonth = ?
    `, [groupId, memberId, slot]);

    if (!memberSlot) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group/slot combination for this member'
      });
    }

    // Check if there's already a pending request for this slot and payment month
    const existingRequest = await getRow(`
      SELECT id FROM payment_requests 
      WHERE memberId = ? AND groupId = ? AND slot = ? AND paymentMonth = ? AND status = 'pending_approval'
    `, [memberId, groupId, slot, paymentMonth]);

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending request for this slot this month'
      });
    }

    // Create the payment request
    const result = await runQuery(`
      INSERT INTO payment_requests (
        memberId, groupId, amount, paymentDate, paymentMonth, slot, paymentType,
        senderBank, receiverBank, proofOfPayment, requestNotes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      memberId, groupId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, proofOfPayment, requestNotes
    ]);

    // Get member info for notification
    const member = await getRow('SELECT firstName, lastName FROM members WHERE id = ?', [memberId]);
    const memberName = `${member.firstName} ${member.lastName}`;

    // Create notification for admins
    await createPaymentRequestNotification(result.id, memberName, memberSlot.groupName, memberId);

    // Fetch the created request with joined data
    const newRequest = await getRow(`
      SELECT pr.*, 
             m.firstName, m.lastName,
             g.name as groupName, g.monthlyAmount
      FROM payment_requests pr
      JOIN members m ON pr.memberId = m.id
      JOIN groups g ON pr.groupId = g.id
      WHERE pr.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      data: {
        ...newRequest,
        member: {
          id: newRequest.memberId,
          firstName: newRequest.firstName,
          lastName: newRequest.lastName
        },
        group: {
          id: newRequest.groupId,
          name: newRequest.groupName,
          monthlyAmount: newRequest.monthlyAmount
        }
      },
      message: 'Payment request submitted successfully'
    } as ApiResponse<PaymentRequest>);
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment request'
    });
  }
});

// Review payment request (admin only)
router.put('/:id/review', authenticateToken, requireRole(['administrator', 'super_user']), validateRequest(paymentRequestReviewSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const {
      status, adminNotes,
      // Optional fields for editing before approval
      groupId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, proofOfPayment
    } = req.body;

    // Get existing request
    const existingRequest = await getRow('SELECT * FROM payment_requests WHERE id = ?', [requestId]);
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payment request not found'
      });
    }

    if (existingRequest.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: 'Payment request has already been reviewed'
      });
    }

    // Prepare update data
    const updateData: any = {
      status,
      adminNotes,
      reviewedBy: req.user?.id,
      reviewedAt: new Date().toISOString()
    };

    // If admin modified any fields, update them
    if (groupId) updateData.groupId = groupId;
    if (amount) updateData.amount = amount;
    if (paymentDate) updateData.paymentDate = paymentDate;
    if (paymentMonth) updateData.paymentMonth = paymentMonth;
    if (slot) updateData.slot = slot;
    if (paymentType) updateData.paymentType = paymentType;
    if (senderBank !== undefined) updateData.senderBank = senderBank;
    if (receiverBank !== undefined) updateData.receiverBank = receiverBank;
    if (proofOfPayment !== undefined) updateData.proofOfPayment = proofOfPayment;

    // Update the request
    const updateFields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const updateValues = Object.values(updateData);
    
    await runQuery(`
      UPDATE payment_requests 
      SET ${updateFields}, updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [...updateValues, requestId]);

    // If approved, create payment record
    if (status === 'approved') {
      const finalRequest = { ...existingRequest, ...updateData };
      
      await runQuery(`
        INSERT INTO payments (
          groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
          senderBank, receiverBank, status, proofOfPayment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        finalRequest.groupId, finalRequest.memberId, finalRequest.amount,
        finalRequest.paymentDate, finalRequest.paymentMonth, finalRequest.slot,
        finalRequest.paymentType, finalRequest.senderBank, finalRequest.receiverBank,
        'pending', // Set initial status as pending
        finalRequest.proofOfPayment
      ]);
    }

    res.json({
      success: true,
      message: `Payment request ${status} successfully`
    } as ApiResponse<void>);
  } catch (error) {
    console.error('Error reviewing payment request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to review payment request'
    });
  }
});

// Get payment request by ID (admin or owner)
router.get('/:id', authenticateToken, validateId, async (req: AuthenticatedRequest, res) => {
  try {
    const requestId = parseInt(req.params.id);

    const paymentRequest = await getRow(`
      SELECT pr.*, 
             m.firstName, m.lastName, m.email, m.phoneNumber,
             g.name as groupName, g.monthlyAmount,
             u.username as reviewerUsername
      FROM payment_requests pr
      JOIN members m ON pr.memberId = m.id
      JOIN groups g ON pr.groupId = g.id
      LEFT JOIN users u ON pr.reviewedBy = u.id
      WHERE pr.id = ?
    `, [requestId]);

    if (!paymentRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payment request not found'
      });
    }

    // Check access rights
    const isOwner = req.user?.userType === 'member' && req.user?.memberId === paymentRequest.memberId;
    const isAdmin = req.user?.role === 'administrator' || req.user?.role === 'super_user';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const transformedRequest = {
      ...paymentRequest,
      member: {
        id: paymentRequest.memberId,
        firstName: paymentRequest.firstName,
        lastName: paymentRequest.lastName,
        email: paymentRequest.email,
        phoneNumber: paymentRequest.phoneNumber
      },
      group: {
        id: paymentRequest.groupId,
        name: paymentRequest.groupName,
        monthlyAmount: paymentRequest.monthlyAmount
      },
      reviewer: paymentRequest.reviewerUsername ? {
        username: paymentRequest.reviewerUsername
      } : null
    };

    res.json({
      success: true,
      data: transformedRequest
    } as ApiResponse<PaymentRequest>);
  } catch (error) {
    console.error('Error fetching payment request:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment request'
    });
  }
});

// Get pending payment requests count (admin only)
router.get('/pending-count', authenticateToken, requireRole(['administrator', 'super_user']), async (req, res) => {
  try {
    const result = await getRow(`
      SELECT COUNT(*) as count
      FROM payment_requests
      WHERE status = 'pending_approval'
    `);

    res.json({
      success: true,
      data: { count: result.count }
    } as ApiResponse<{ count: number }>);
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending count'
    });
  }
});

export default router;