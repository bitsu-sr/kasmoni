import express from 'express';
import { validateRequest, validateId, paymentSchema, paymentStatusSchema, bulkPaymentSchema } from '../middleware/validation';
import { getAll, getRow, runQuery } from '../utils/database';
import { Payment, ApiResponse, User } from '../types';
import { authenticateToken } from '../middleware/auth';
import { PaymentLogger } from '../utils/paymentLogger';
import db from '../utils/database';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const router = express.Router();

// Helper function to create payment notification message
const createPaymentNotification = async (memberId: number, paymentDetails: any) => {
  try {
    // Get member information
    const member = await getRow('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!member) {
      console.error('Member not found for payment notification:', memberId);
      return;
    }

    // Get group information
    const group = await getRow('SELECT * FROM groups WHERE id = ?', [paymentDetails.groupId]);
    if (!group) {
      console.error('Group not found for payment notification:', paymentDetails.groupId);
      return;
    }

    // Format payment details for the message
    const paymentDate = new Date(paymentDetails.paymentDate).toLocaleDateString();
    const paymentMonth = new Date(paymentDetails.paymentMonth + '-01').toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    const messageDetails = `A new payment has been added to your account:
    
Payment Details:
- Amount: $${paymentDetails.amount}
- Payment Date: ${paymentDate}
- Payment Month: ${paymentMonth}
- Group: ${group.name}
- Status: ${paymentDetails.status}

This payment has been recorded in your account. You can view your payment history in your dashboard.`;

    // Create the notification message
    await runQuery(`
      INSERT INTO messages (member_id, member_name, member_email, member_phone, request_type, request_details, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      member.id,
      `${member.firstName} ${member.lastName}`,
      member.email,
      member.phoneNumber,
      'payment_notification',
      messageDetails,
      'approved' // Payment notifications are automatically approved
    ]);

    console.log(`Payment notification sent to member ${memberId}`);
  } catch (error) {
    console.error('Error creating payment notification:', error);
  }
};

// Get payments by group
router.get('/group/:groupId', (req, res, next) => {
  const groupId = parseInt(req.params.groupId);
  
  if (isNaN(groupId) || groupId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid group ID parameter'
    });
  }
  
  req.params.groupId = groupId.toString();
  next();
}, async (req, res) => {
  try {
    const payments = await getAll(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.groupId = ?
      ORDER BY p.paymentDate DESC
    `, [req.params.groupId]);

    // Transform the flat data into nested structure
    const transformedPayments = payments.map(payment => ({
      ...payment,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    }));
    
    res.json({
      success: true,
      data: transformedPayments
    } as ApiResponse<Payment[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments for group'
    });
  }
});

// Get all payments with member and group details
router.get('/', async (req, res) => {
  try {
    const payments = await getAll(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      ORDER BY p.paymentDate DESC
    `);

    // Transform the flat data into nested structure
    const transformedPayments = payments.map(payment => ({
      ...payment,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    }));
    
    res.json({
      success: true,
      data: transformedPayments
    } as ApiResponse<Payment[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    });
  }
});

// Get payments by member ID
router.get('/member/:memberId', (req, res, next) => {
  const memberId = parseInt(req.params.memberId);
  
  if (isNaN(memberId) || memberId <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid member ID parameter'
    });
  }
  
  req.params.memberId = memberId.toString();
  next();
}, async (req, res) => {
  try {
    const payments = await getAll(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.memberId = ?
      ORDER BY p.paymentDate DESC
    `, [req.params.memberId]);

    // Transform the flat data into nested structure
    const transformedPayments = payments.map(payment => ({
      ...payment,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    }));
    
    res.json({
      success: true,
      data: transformedPayments
    } as ApiResponse<Payment[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments for member'
    });
  }
});

// Get payment by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const payment = await getRow(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.id = ?
    `, [req.params.id]);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Transform the flat data into nested structure
    const transformedPayment = {
      ...payment,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    };
    
    res.json({
      success: true,
      data: transformedPayment
    } as ApiResponse<Payment>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    });
  }
});

// Create new payment
router.post('/', authenticateToken, validateRequest(paymentSchema), async (req, res) => {
  try {
    const {
      groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, status, proofOfPayment
    } = req.body;

    // Check if group exists
    const group = await getRow('SELECT * FROM groups WHERE id = ?', [groupId]);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if member exists
    const member = await getRow('SELECT * FROM members WHERE id = ?', [memberId]);
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Check if member is in the group
    const groupMember = await getRow(
      'SELECT * FROM group_members WHERE groupId = ? AND memberId = ?',
      [groupId, memberId]
    );
    if (!groupMember) {
      return res.status(400).json({
        success: false,
        error: 'Member is not part of this group'
      });
    }

    // Check if the slot is valid for this member in this group
    const memberSlot = await getRow(
      'SELECT * FROM group_members WHERE groupId = ? AND memberId = ? AND receiveMonth = ?',
      [groupId, memberId, slot]
    );
    if (!memberSlot) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slot for this member in this group'
      });
    }

    const result = await runQuery(`
      INSERT INTO payments (
        groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
        senderBank, receiverBank, status, proofOfPayment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, status || 'not_paid', proofOfPayment
    ]);

    const newPayment = await getRow(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.id = ?
    `, [result.id]);

    // Transform the flat data into nested structure
    const transformedPayment = {
      ...newPayment,
      member: {
        id: newPayment.memberId,
        firstName: newPayment.firstName,
        lastName: newPayment.lastName,
        birthDate: newPayment.birthDate,
        birthplace: newPayment.birthplace,
        address: newPayment.address,
        city: newPayment.city,
        phoneNumber: newPayment.phoneNumber,
        email: newPayment.email,
        nationalId: newPayment.nationalId,
        nationality: newPayment.nationality,
        occupation: newPayment.occupation,
        bankName: newPayment.bankName,
        accountNumber: newPayment.accountNumber,
        registrationDate: newPayment.registrationDate,
        createdAt: newPayment.memberCreatedAt,
        updatedAt: newPayment.memberUpdatedAt
      },
      group: {
        id: newPayment.groupId,
        name: newPayment.name,
        monthlyAmount: newPayment.monthlyAmount,
        maxMembers: newPayment.maxMembers,
        duration: newPayment.duration,
        startMonth: newPayment.startMonth,
        endMonth: newPayment.endMonth,
        createdAt: newPayment.groupCreatedAt,
        updatedAt: newPayment.groupUpdatedAt
      }
    };

    // Log payment creation
    try {
      if (!req.user) {
        console.warn('No user found in request for payment logging');
        return;
      }
      const paymentLogger = new PaymentLogger(db);
      await paymentLogger.logPaymentCreated(
        transformedPayment,
        req.user,
        req.ip,
        req.get('User-Agent')
      );
    } catch (logError) {
      console.error('Error logging payment creation:', logError);
      // Continue with the response even if logging fails
    }

    // Send notification
    try {
      await createPaymentNotification(memberId, {
        groupId: groupId,
        memberId: memberId,
        amount: amount,
        paymentDate: paymentDate,
        paymentMonth: paymentMonth,
        slot: slot,
        paymentType: paymentType,
        senderBank: senderBank,
        receiverBank: receiverBank,
        status: status,
        proofOfPayment: proofOfPayment
      });
    } catch (notificationError) {
      console.error('Error creating payment notification:', notificationError);
      // Continue with the response even if notification fails
    }

    res.status(201).json({
      success: true,
      data: transformedPayment,
      message: 'Payment created successfully'
    } as ApiResponse<Payment>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
});

// Update payment
router.put('/:id', validateId, validateRequest(paymentSchema), async (req, res) => {
  try {
    const {
      groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, status, proofOfPayment
    } = req.body;

    const result = await runQuery(`
      UPDATE payments SET
        groupId = ?, memberId = ?, amount = ?, paymentDate = ?, paymentMonth = ?, slot = ?,
        paymentType = ?, senderBank = ?, receiverBank = ?,
        status = ?, proofOfPayment = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [
      groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
      senderBank, receiverBank, status, proofOfPayment, req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const updatedPayment = await getRow(`
      SELECT p.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.id = ?
    `, [req.params.id]);

    // Transform the flat data into nested structure
    const transformedPayment = {
      ...updatedPayment,
      member: {
        id: updatedPayment.memberId,
        firstName: updatedPayment.firstName,
        lastName: updatedPayment.lastName,
        birthDate: updatedPayment.birthDate,
        birthplace: updatedPayment.birthplace,
        address: updatedPayment.address,
        city: updatedPayment.city,
        phoneNumber: updatedPayment.phoneNumber,
        email: updatedPayment.email,
        nationalId: updatedPayment.nationalId,
        nationality: updatedPayment.nationality,
        occupation: updatedPayment.occupation,
        bankName: updatedPayment.bankName,
        accountNumber: updatedPayment.accountNumber,
        registrationDate: updatedPayment.registrationDate,
        createdAt: updatedPayment.memberCreatedAt,
        updatedAt: updatedPayment.memberUpdatedAt
      },
      group: {
        id: updatedPayment.groupId,
        name: updatedPayment.name,
        monthlyAmount: updatedPayment.monthlyAmount,
        maxMembers: updatedPayment.maxMembers,
        duration: updatedPayment.duration,
        startMonth: updatedPayment.startMonth,
        endMonth: updatedPayment.endMonth,
        createdAt: updatedPayment.groupCreatedAt,
        updatedAt: updatedPayment.groupUpdatedAt
      }
    };

    res.json({
      success: true,
      data: transformedPayment,
      message: 'Payment updated successfully'
    } as ApiResponse<Payment>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    });
  }
});

// Update payment status only
router.patch('/:id/status', authenticateToken, validateId, validateRequest(paymentStatusSchema), async (req, res) => {
  try {
    const { status } = req.body;

    // Get the old payment data first
    const oldPayment = await getRow('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    
    if (!oldPayment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const result = await runQuery(`
      UPDATE payments SET
        status = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [status, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const updatedPayment = await getRow(`
      SELECT p.*, 
             m.firstName, m.lastName,
             g.name as groupName, g.monthlyAmount
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      WHERE p.id = ?
    `, [req.params.id]);

    // Log status change
    const paymentLogger = new PaymentLogger(db);
    await paymentLogger.logStatusChanged(
      updatedPayment,
      oldPayment.status, // Get old status from the payment before update
      status,
      req.user!,
      req.ip,
      req.get('User-Agent')
    );

    res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment status updated successfully'
    } as ApiResponse<Payment>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update payment status'
    });
  }
});

// Soft delete payment (move to trashbox)
router.delete('/:id', authenticateToken, validateId, async (req, res) => {
  try {
    // Get the payment details first
    const payment = await getRow('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Move payment to trashbox
    await runQuery(`
      INSERT INTO payments_trashbox (
        original_id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
        paymentType, senderBank, receiverBank, status, proofOfPayment,
        deleted_at, deleted_by_user_id, deleted_by_username
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?)
    `, [
      payment.id,
      payment.groupId,
      payment.memberId,
      payment.amount,
      payment.paymentDate,
      payment.paymentMonth,
      payment.slot,
      payment.paymentType,
      payment.senderBank,
      payment.receiverBank,
      payment.status,
      payment.proofOfPayment,
      userId || null,
      username || null
    ]);

    // Log payment deletion
    const paymentLogger = new PaymentLogger(db);
    await paymentLogger.logPaymentDeleted(
      payment,
      req.user!,
      req.ip,
      req.get('User-Agent')
    );

    // Delete from payments table
    await runQuery('DELETE FROM payments WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Payment moved to trashbox successfully'
    });
  } catch (error) {
    console.error('Error soft deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move payment to trashbox'
    });
  }
});

// Archive payment (move to archive)
router.post('/:id/archive', authenticateToken, validateId, async (req, res) => {
  try {
    // Get the payment details first
    const payment = await getRow('SELECT * FROM payments WHERE id = ?', [req.params.id]);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check if payment is already archived
    const existingArchive = await getRow('SELECT id FROM payments_archive WHERE original_id = ?', [payment.id]);
    if (existingArchive) {
      return res.status(400).json({
        success: false,
        error: 'Payment is already archived'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      // Move payment to archive
      await runQuery(`
        INSERT INTO payments_archive (
          original_id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
          paymentType, senderBank, receiverBank, status, proofOfPayment,
          archived_at, archived_by_user_id, archived_by_username, archive_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
      `, [
        payment.id,
        payment.groupId,
        payment.memberId,
        payment.amount,
        payment.paymentDate,
        payment.paymentMonth,
        payment.slot,
        payment.paymentType,
        payment.senderBank,
        payment.receiverBank,
        payment.status,
        payment.proofOfPayment,
        userId || null,
        username || null,
        req.body.archive_reason || null
      ]);

      // Log payment archiving
      const paymentLogger = new PaymentLogger(db);
      await paymentLogger.logPaymentArchived(
        payment,
        req.user!,
        req.ip,
        req.get('User-Agent'),
        req.body.archive_reason
      );

      // Delete from payments table
      const deleteResult = await runQuery('DELETE FROM payments WHERE id = ?', [req.params.id]);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: 'Payment archived successfully',
        data: {
          archived: 1,
          deleted: deleteResult.changes
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error archiving payment:', error);
    res.status(500).json({
      success: false,
      error: `Failed to archive payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Bulk archive payments
router.post('/bulk-archive', authenticateToken, async (req, res) => {
  try {
    const { paymentIds, archive_reason } = req.body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment IDs are required'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Get all payments to be archived
    const payments = await getAll('SELECT * FROM payments WHERE id IN (' + paymentIds.map(() => '?').join(',') + ')', paymentIds);

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No payments found to archive'
      });
    }

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      // Archive each payment
      for (const payment of payments) {
        // Check if payment is already archived
        const existingArchive = await getRow('SELECT id FROM payments_archive WHERE original_id = ?', [payment.id]);
        if (existingArchive) {
          throw new Error(`Payment ${payment.id} is already archived`);
        }

        // Insert into archive
        await runQuery(`
          INSERT INTO payments_archive (
            original_id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
            paymentType, senderBank, receiverBank, status, proofOfPayment,
            archived_at, archived_by_user_id, archived_by_username, archive_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
        `, [
          payment.id,
          payment.groupId,
          payment.memberId,
          payment.amount,
          payment.paymentDate,
          payment.paymentMonth,
          payment.slot,
          payment.paymentType,
          payment.senderBank,
          payment.receiverBank,
          payment.status,
          payment.proofOfPayment,
          userId || null,
          username || null,
          archive_reason || null
        ]);

        // Log payment archiving
        const paymentLogger = new PaymentLogger(db);
        await paymentLogger.logPaymentArchived(
          payment,
          req.user!,
          req.ip,
          req.get('User-Agent'),
          archive_reason
        );
      }

      // Delete all payments from payments table
      const deleteResult = await runQuery('DELETE FROM payments WHERE id IN (' + paymentIds.map(() => '?').join(',') + ')', paymentIds);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: `${payments.length} payment(s) archived successfully`,
        data: {
          archived: payments.length,
          deleted: deleteResult.changes
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error bulk archiving payments:', error);
    res.status(500).json({
      success: false,
      error: `Failed to archive payments: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Get overdue payments (after 28th of each month)
router.get('/overdue/list', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Calculate the 28th of current month
    const deadlineDate = new Date(currentYear, currentMonth, 28);
    
    // If current date is after 28th, get payments that should have been made
    if (currentDate > deadlineDate) {
      const overduePayments = await getAll(`
        SELECT p.*, 
               m.firstName, m.lastName,
               g.name as groupName, g.monthlyAmount,
               julianday('now') - julianday(p.paymentDate) as daysLate
        FROM payments p
        JOIN members m ON p.memberId = m.id
        JOIN groups g ON p.groupId = g.id
        WHERE p.status IN ('not_paid', 'pending')
        AND date(p.paymentDate) <= date(?)
        ORDER BY p.paymentDate ASC
      `, [deadlineDate.toISOString().split('T')[0]]);
      
      res.json({
        success: true,
        data: overduePayments
      } as ApiResponse<Payment[]>);
    } else {
      res.json({
        success: true,
        data: []
      } as ApiResponse<Payment[]>);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue payments'
    });
  }
});

// Get available slots for a member in a group
router.get('/slots/:groupId/:memberId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);
    
    if (isNaN(groupId) || groupId <= 0 || isNaN(memberId) || memberId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID or member ID parameter'
      });
    }

    // Get current month for filtering
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    // Get all slots (months) for this member in this group, excluding already paid slots
    // First step: check if Payment Month = Current Month
    const slots = await getAll(`
      SELECT gm.receiveMonth as slot
      FROM group_members gm
      LEFT JOIN payments p ON p.groupId = gm.groupId 
        AND p.memberId = gm.memberId 
        AND p.slot = gm.receiveMonth
        AND p.paymentMonth = ?
        AND p.status IN ('received', 'settled')
      WHERE gm.groupId = ? AND gm.memberId = ?
        AND p.id IS NULL
      ORDER BY gm.receiveMonth ASC
    `, [currentMonthYear, groupId, memberId]);

    res.json({
      success: true,
      data: slots.map(slot => ({
        value: slot.slot,
        label: formatMonthYear(slot.slot)
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available slots'
    });
  }
});

// Get group members with payment status
router.get('/group-members/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID parameter'
      });
    }

    // Get current month for filtering
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    // Get group members with their payment status
    // First step: check if Payment Month = Current Month
    const members = await getAll(`
      SELECT 
        gm.memberId,
        gm.receiveMonth,
        m.firstName,
        m.lastName,
        CASE 
          WHEN p.id IS NOT NULL THEN 1 
          ELSE 0 
        END as hasPaid
      FROM group_members gm
      JOIN members m ON m.id = gm.memberId
      LEFT JOIN payments p ON p.groupId = gm.groupId 
        AND p.memberId = gm.memberId 
        AND p.slot = gm.receiveMonth
        AND p.paymentMonth = ?
        AND p.status IN ('received', 'settled')
      WHERE gm.groupId = ?
      ORDER BY m.firstName, m.lastName, gm.receiveMonth
    `, [currentMonthYear, groupId]);

    // Group by member and calculate payment status
    const memberMap = new Map();
    
    members.forEach(member => {
      const memberKey = `${member.memberId}-${member.firstName}-${member.lastName}`;
      
      if (!memberMap.has(memberKey)) {
        memberMap.set(memberKey, {
          memberId: member.memberId,
          firstName: member.firstName,
          lastName: member.lastName,
          totalSlots: 0,
          paidSlots: 0,
          hasUnpaidSlots: false
        });
      }
      
      const memberData = memberMap.get(memberKey);
      memberData.totalSlots++;
      if (member.hasPaid) {
        memberData.paidSlots++;
      } else {
        memberData.hasUnpaidSlots = true;
      }
    });

    const result = Array.from(memberMap.values()).map(member => ({
      ...member,
      isFullyPaid: !member.hasUnpaidSlots
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group members with payment status'
    });
  }
});

// Get group members with individual slots for bulk payments
router.get('/group-members-slots/:groupId', async (req, res) => {
  try {
    const groupId = parseInt(req.params.groupId);
    
    if (isNaN(groupId) || groupId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID parameter'
      });
    }

    // Get group members with individual slots and payment info
    const memberSlots = await getAll(`
      SELECT 
        gm.memberId,
        gm.receiveMonth as slot,
        m.firstName,
        m.lastName,
        CASE 
          WHEN p.id IS NOT NULL THEN 1 
          ELSE 0 
        END as hasPaid,
        p.amount,
        p.paymentDate,
        p.paymentType,
        p.senderBank,
        p.receiverBank,
        p.status
      FROM group_members gm
      JOIN members m ON m.id = gm.memberId
      LEFT JOIN payments p ON p.groupId = gm.groupId 
        AND p.memberId = gm.memberId 
        AND p.slot = gm.receiveMonth
        AND p.status IN ('pending', 'received', 'settled')
      WHERE gm.groupId = ?
      ORDER BY m.firstName, m.lastName, gm.receiveMonth
    `, [groupId]);

    // Return all slots with payment info for paid slots
    const allSlots = memberSlots.map(slot => ({
      memberId: slot.memberId,
      firstName: slot.firstName,
      lastName: slot.lastName,
      slot: slot.slot,
      slotLabel: formatMonthYear(slot.slot),
      hasPaid: slot.hasPaid === 1,
      payment: slot.hasPaid === 1 ? {
        amount: slot.amount,
        paymentDate: slot.paymentDate,
        paymentType: slot.paymentType,
        senderBank: slot.senderBank,
        receiverBank: slot.receiverBank,
        status: slot.status
      } : null
    }));

    res.json({
      success: true,
      data: allSlots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group members with slots'
    });
  }
});

// Bulk payment validation endpoint
router.post('/bulk/validate', authenticateToken, validateRequest(bulkPaymentSchema), async (req, res) => {
  try {
    const { groupId, paymentMonth, payments } = req.body;
    
    const validationResults = [];
    
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      const errors = [];
      
      // Check if group exists
      const group = await getRow('SELECT * FROM groups WHERE id = ?', [groupId]);
      if (!group) {
        errors.push('Group not found');
      }
      
      // Check if member exists
      const member = await getRow('SELECT * FROM members WHERE id = ?', [payment.memberId]);
      if (!member) {
        errors.push('Member not found');
      }
      
      // Check if member is in the group
      const groupMember = await getRow(
        'SELECT * FROM group_members WHERE groupId = ? AND memberId = ?',
        [groupId, payment.memberId]
      );
      if (!groupMember) {
        errors.push('Member is not part of this group');
      }
      
      // Check if the slot is valid for this member in this group
      const memberSlot = await getRow(
        'SELECT * FROM group_members WHERE groupId = ? AND memberId = ? AND receiveMonth = ?',
        [groupId, payment.memberId, payment.slot]
      );
      if (!memberSlot) {
        errors.push('Invalid slot for this member in this group');
      }
      
      // Check if payment already exists for this slot
      const existingPayment = await getRow(
        'SELECT * FROM payments WHERE groupId = ? AND memberId = ? AND slot = ?',
        [groupId, payment.memberId, payment.slot]
      );
      // Allow updates to existing payments - the user can modify status in bulk interface
      
      validationResults.push({
        index: i,
        memberId: payment.memberId,
        errors: errors
      });
    }
    
    const hasErrors = validationResults.some(result => result.errors.length > 0);
    
    res.json({
      success: !hasErrors,
      data: validationResults,
      message: hasErrors ? 'Validation failed' : 'All payments are valid'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to validate bulk payments'
    });
  }
});

// Create bulk payments
router.post('/bulk', authenticateToken, validateRequest(bulkPaymentSchema), async (req, res) => {
  try {
    const { groupId, paymentMonth, payments } = req.body;
    
    // Start transaction
    await runQuery('BEGIN TRANSACTION');
    
    const createdPayments = [];
    const errors = [];
    
    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i];
      
      try {
        // Check if group exists
        const group = await getRow('SELECT * FROM groups WHERE id = ?', [groupId]);
        if (!group) {
          throw new Error('Group not found');
        }

        // Check if member exists
        const member = await getRow('SELECT * FROM members WHERE id = ?', [payment.memberId]);
        if (!member) {
          throw new Error('Member not found');
        }

        // Check if member is in the group
        const groupMember = await getRow(
          'SELECT * FROM group_members WHERE groupId = ? AND memberId = ?',
          [groupId, payment.memberId]
        );
        if (!groupMember) {
          throw new Error('Member is not part of this group');
        }

        // Check if the slot is valid for this member in this group
        const memberSlot = await getRow(
          'SELECT * FROM group_members WHERE groupId = ? AND memberId = ? AND receiveMonth = ?',
          [groupId, payment.memberId, payment.slot]
        );
        if (!memberSlot) {
          throw new Error('Invalid slot for this member in this group');
        }

        // Check if payment already exists for this slot
        console.log('Checking for existing payment:', {
          groupId: groupId,
          memberId: payment.memberId,
          slot: payment.slot,
          groupIdType: typeof groupId,
          memberIdType: typeof payment.memberId,
          slotType: typeof payment.slot
        });
        
        // Also log the exact query being executed
        const query = 'SELECT * FROM payments WHERE groupId = ? AND memberId = ? AND slot = ?';
        const params = [groupId, payment.memberId, payment.slot];
        console.log('Query:', query);
        console.log('Parameters:', params);
        
        const existingPayment = await getRow(query, params);
        
        console.log('Existing payment found:', existingPayment ? 'YES' : 'NO');
        if (existingPayment) {
          console.log('Existing payment details:', existingPayment);
        } else {
          console.log('No existing payment found');
        }
        
        let paymentId;
        if (existingPayment) {
          // Update existing payment (allow status changes in bulk interface)
          console.log('Updating existing payment with ID:', existingPayment.id);
          await runQuery(`
            UPDATE payments SET
              amount = ?, paymentDate = ?, paymentMonth = ?, paymentType = ?,
              senderBank = ?, receiverBank = ?, status = ?
            WHERE id = ?
          `, [
            payment.amount, payment.paymentDate, paymentMonth, payment.paymentType,
            payment.senderBank, payment.receiverBank, payment.status || 'not_paid',
            existingPayment.id
          ]);
          paymentId = existingPayment.id;
        } else {
          // Create new payment
          console.log('Creating new payment');
          const result = await runQuery(`
            INSERT INTO payments (
              groupId, memberId, amount, paymentDate, paymentMonth, slot, paymentType,
              senderBank, receiverBank, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            groupId, payment.memberId, payment.amount, payment.paymentDate, paymentMonth, 
            payment.slot, payment.paymentType, payment.senderBank, payment.receiverBank, 
            payment.status || 'not_paid'
          ]);
          paymentId = result.id;
        }

        // Fetch the created payment with member and group details
        const newPayment = await getRow(`
          SELECT p.*, 
                 m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
                 m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
                 m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
                 g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
                 g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
          FROM payments p
          JOIN members m ON p.memberId = m.id
          JOIN groups g ON p.groupId = g.id
          WHERE p.id = ?
        `, [paymentId]);

        // Transform the flat data into nested structure
        const transformedPayment = {
          ...newPayment,
          member: {
            id: newPayment.memberId,
            firstName: newPayment.firstName,
            lastName: newPayment.lastName,
            birthDate: newPayment.birthDate,
            birthplace: newPayment.birthplace,
            address: newPayment.address,
            city: newPayment.city,
            phoneNumber: newPayment.phoneNumber,
            email: newPayment.email,
            nationalId: newPayment.nationalId,
            nationality: newPayment.nationality,
            occupation: newPayment.occupation,
            bankName: newPayment.bankName,
            accountNumber: newPayment.accountNumber,
            registrationDate: newPayment.registrationDate,
            createdAt: newPayment.memberCreatedAt,
            updatedAt: newPayment.memberUpdatedAt
          },
          group: {
            id: newPayment.groupId,
            name: newPayment.name,
            monthlyAmount: newPayment.monthlyAmount,
            maxMembers: newPayment.maxMembers,
            duration: newPayment.duration,
            startMonth: newPayment.startMonth,
            endMonth: newPayment.endMonth,
            createdAt: newPayment.groupCreatedAt,
            updatedAt: newPayment.groupUpdatedAt
          }
        };

        createdPayments.push(transformedPayment);

        // Send notification for each successful payment
        await createPaymentNotification(payment.memberId, {
          groupId: groupId,
          memberId: payment.memberId,
          amount: payment.amount,
          paymentDate: payment.paymentDate,
          paymentMonth: paymentMonth,
          slot: payment.slot,
          paymentType: payment.paymentType,
          senderBank: payment.senderBank,
          receiverBank: payment.receiverBank,
          status: payment.status || 'not_paid',
          proofOfPayment: payment.proofOfPayment
        });

      } catch (error) {
        errors.push({
          index: i,
          memberId: payment.memberId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    if (errors.length > 0) {
      // Rollback transaction if there are errors
      await runQuery('ROLLBACK');
      
      return res.status(400).json({
        success: false,
        error: 'Some payments failed to create',
        data: {
          created: createdPayments,
          errors: errors
        }
      });
    }
    
    // Commit transaction if all payments succeeded
    await runQuery('COMMIT');
    
    // Log bulk payment creation
    const paymentLogger = new PaymentLogger(db);
    await paymentLogger.logBulkPaymentCreated(
      createdPayments,
      req.user!,
      req.ip,
      req.get('User-Agent')
    );
    
    res.status(201).json({
      success: true,
      data: createdPayments,
      message: `Successfully created ${createdPayments.length} payments`
    });
  } catch (error) {
    // Rollback transaction on any error
    await runQuery('ROLLBACK');
    
    res.status(500).json({
      success: false,
      error: 'Failed to create bulk payments'
    });
  }
});

// Helper function to format month-year
const formatMonthYear = (monthYear: string): string => {
  if (!monthYear) return '';
  const [year, month] = monthYear.split('-').map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
};

// ===== TRASHBOX ROUTES =====

// Get all payments in trashbox
router.get('/trashbox/list', authenticateToken, async (req, res) => {
  try {
    const trashboxPayments = await getAll(`
      SELECT pt.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments_trashbox pt
      JOIN members m ON pt.memberId = m.id
      JOIN groups g ON pt.groupId = g.id
      ORDER BY pt.deleted_at DESC
    `);

    // Transform the flat data into nested structure
    const transformedPayments = trashboxPayments.map(payment => ({
      id: payment.id,
      original_id: payment.original_id,
      groupId: payment.groupId,
      memberId: payment.memberId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMonth: payment.paymentMonth,
      slot: payment.slot,
      paymentType: payment.paymentType,
      senderBank: payment.senderBank,
      receiverBank: payment.receiverBank,
      status: payment.status,
      proofOfPayment: payment.proofOfPayment,
      deleted_at: payment.deleted_at,
      deleted_by_user_id: payment.deleted_by_user_id,
      deleted_by_username: payment.deleted_by_username,
      restore_reason: payment.restore_reason,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    }));

    res.json({
      success: true,
      data: transformedPayments
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error fetching trashbox payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trashbox payments'
    });
  }
});

// Restore payment from trashbox
router.post('/trashbox/:id/restore', authenticateToken, validateId, async (req, res) => {
  try {
    // Get the payment from trashbox
    const trashboxPayment = await getRow('SELECT * FROM payments_trashbox WHERE id = ?', [req.params.id]);
    
    if (!trashboxPayment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found in trashbox'
      });
    }

    // Check if original ID already exists in payments table
    const existingPayment = await getRow('SELECT id FROM payments WHERE id = ?', [trashboxPayment.original_id]);
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'A payment with this ID already exists. Cannot restore.'
      });
    }

    // Restore payment to payments table
    await runQuery(`
      INSERT INTO payments (
        id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
        paymentType, senderBank, receiverBank, status, proofOfPayment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      trashboxPayment.original_id,
      trashboxPayment.groupId,
      trashboxPayment.memberId,
      trashboxPayment.amount,
      trashboxPayment.paymentDate,
      trashboxPayment.paymentMonth,
      trashboxPayment.slot,
      trashboxPayment.paymentType,
      trashboxPayment.senderBank,
      trashboxPayment.receiverBank,
      trashboxPayment.status,
      trashboxPayment.proofOfPayment
    ]);

    // Delete from trashbox
    await runQuery('DELETE FROM payments_trashbox WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Payment restored successfully'
    });
  } catch (error) {
    console.error('Error restoring payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restore payment'
    });
  }
});

// Permanently delete payment from trashbox
router.delete('/trashbox/:id/permanent', authenticateToken, validateId, async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM payments_trashbox WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found in trashbox'
      });
    }

    res.json({
      success: true,
      message: 'Payment permanently deleted from trashbox'
    });
  } catch (error) {
    console.error('Error permanently deleting payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to permanently delete payment'
    });
  }
});

// Bulk restore payments from trashbox
router.post('/trashbox/bulk-restore', authenticateToken, async (req, res) => {
  try {
    const { paymentIds } = req.body;
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment IDs array is required'
      });
    }

    let restoredCount = 0;
    const errors = [];

    for (const trashboxId of paymentIds) {
      try {
        // Get the payment from trashbox
        const trashboxPayment = await getRow('SELECT * FROM payments_trashbox WHERE id = ?', [trashboxId]);
        
        if (!trashboxPayment) {
          errors.push({ id: trashboxId, error: 'Payment not found in trashbox' });
          continue;
        }

        // Check if original ID already exists in payments table
        const existingPayment = await getRow('SELECT id FROM payments WHERE id = ?', [trashboxPayment.original_id]);
        if (existingPayment) {
          errors.push({ id: trashboxId, error: 'A payment with this ID already exists' });
          continue;
        }

        // Restore payment to payments table
        await runQuery(`
          INSERT INTO payments (
            id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
            paymentType, senderBank, receiverBank, status, proofOfPayment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          trashboxPayment.original_id,
          trashboxPayment.groupId,
          trashboxPayment.memberId,
          trashboxPayment.amount,
          trashboxPayment.paymentDate,
          trashboxPayment.paymentMonth,
          trashboxPayment.slot,
          trashboxPayment.paymentType,
          trashboxPayment.senderBank,
          trashboxPayment.receiverBank,
          trashboxPayment.status,
          trashboxPayment.proofOfPayment
        ]);

        // Delete from trashbox
        await runQuery('DELETE FROM payments_trashbox WHERE id = ?', [trashboxId]);
        restoredCount++;
      } catch (error) {
        errors.push({ id: trashboxId, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    res.json({
      success: true,
      data: {
        restored: restoredCount,
        errors: errors
      },
      message: `Successfully restored ${restoredCount} payments`
    });
  } catch (error) {
    console.error('Error bulk restoring payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk restore payments'
    });
  }
});

// Bulk permanently delete payments from trashbox
router.delete('/trashbox/bulk-permanent', authenticateToken, async (req, res) => {
  try {
    const { paymentIds } = req.body;
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Payment IDs array is required'
      });
    }

    const result = await runQuery(
      'DELETE FROM payments_trashbox WHERE id IN (' + paymentIds.map(() => '?').join(',') + ')',
      paymentIds
    );

    res.json({
      success: true,
      data: {
        deleted: result.changes
      },
      message: `Successfully permanently deleted ${result.changes} payments`
    });
  } catch (error) {
    console.error('Error bulk permanently deleting payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to bulk permanently delete payments'
    });
  }
});

// ===== ARCHIVE ROUTES =====

// Get all archived payments
router.get('/archive/list', authenticateToken, async (req, res) => {
  try {
    const archivedPayments = await getAll(`
      SELECT pa.*, 
             m.firstName, m.lastName, m.birthDate, m.birthplace, m.address, m.city,
             m.phoneNumber, m.email, m.nationalId, m.nationality, m.occupation,
             m.bankName, m.accountNumber, m.registrationDate, m.createdAt as memberCreatedAt, m.updatedAt as memberUpdatedAt,
             g.name, g.monthlyAmount, g.maxMembers, g.duration, g.startMonth, g.endMonth,
             g.createdAt as groupCreatedAt, g.updatedAt as groupUpdatedAt
      FROM payments_archive pa
      JOIN members m ON pa.memberId = m.id
      JOIN groups g ON pa.groupId = g.id
      ORDER BY pa.archived_at DESC
    `);

    // Transform the flat data into nested structure
    const transformedPayments = archivedPayments.map(payment => ({
      id: payment.id,
      original_id: payment.original_id,
      groupId: payment.groupId,
      memberId: payment.memberId,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMonth: payment.paymentMonth,
      slot: payment.slot,
      paymentType: payment.paymentType,
      senderBank: payment.senderBank,
      receiverBank: payment.receiverBank,
      status: payment.status,
      proofOfPayment: payment.proofOfPayment,
      archived_at: payment.archived_at,
      archived_by_user_id: payment.archived_by_user_id,
      archived_by_username: payment.archived_by_username,
      archive_reason: payment.archive_reason,
      member: {
        id: payment.memberId,
        firstName: payment.firstName,
        lastName: payment.lastName,
        birthDate: payment.birthDate,
        birthplace: payment.birthplace,
        address: payment.address,
        city: payment.city,
        phoneNumber: payment.phoneNumber,
        email: payment.email,
        nationalId: payment.nationalId,
        nationality: payment.nationality,
        occupation: payment.occupation,
        bankName: payment.bankName,
        accountNumber: payment.accountNumber,
        registrationDate: payment.registrationDate,
        createdAt: payment.memberCreatedAt,
        updatedAt: payment.memberUpdatedAt
      },
      group: {
        id: payment.groupId,
        name: payment.name,
        monthlyAmount: payment.monthlyAmount,
        maxMembers: payment.maxMembers,
        duration: payment.duration,
        startMonth: payment.startMonth,
        endMonth: payment.endMonth,
        createdAt: payment.groupCreatedAt,
        updatedAt: payment.groupUpdatedAt
      }
    }));

    res.json({
      success: true,
      data: transformedPayments
    } as ApiResponse<any[]>);
  } catch (error) {
    console.error('Error fetching archived payments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch archived payments'
    });
  }
});

// Restore archived payment (move back to payments table)
router.post('/archive/:id/restore', authenticateToken, validateId, async (req, res) => {
  try {
    const archiveId = parseInt(req.params.id);
    
    // Get the archived payment
    const archivedPayment = await getRow('SELECT * FROM payments_archive WHERE id = ?', [archiveId]);
    if (!archivedPayment) {
      return res.status(404).json({
        success: false,
        error: 'Archived payment not found'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      // Insert back into payments table
      const result = await runQuery(`
        INSERT INTO payments (
          groupId, memberId, amount, paymentDate, paymentMonth, slot,
          paymentType, senderBank, receiverBank, status, proofOfPayment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        archivedPayment.groupId,
        archivedPayment.memberId,
        archivedPayment.amount,
        archivedPayment.paymentDate,
        archivedPayment.paymentMonth,
        archivedPayment.slot,
        archivedPayment.paymentType,
        archivedPayment.senderBank,
        archivedPayment.receiverBank,
        archivedPayment.status,
        archivedPayment.proofOfPayment
      ]);

      // Log payment restoration
      const paymentLogger = new PaymentLogger(db);
      await paymentLogger.logPaymentRestored(
        { ...archivedPayment, id: result.id },
        req.user!,
        req.ip,
        req.get('User-Agent'),
        `Restored from archive (original archive ID: ${archiveId})`
      );

      // Delete from archive
      await runQuery('DELETE FROM payments_archive WHERE id = ?', [archiveId]);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: 'Payment restored successfully',
        data: {
          restored: 1,
          newPaymentId: result.id
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error restoring archived payment:', error);
    res.status(500).json({
      success: false,
      error: `Failed to restore payment: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Move archived payment to trashbox
router.post('/archive/:id/move-to-trashbox', authenticateToken, validateId, async (req, res) => {
  try {
    const archiveId = parseInt(req.params.id);
    const { deletion_reason } = req.body;
    
    // Get the archived payment
    const archivedPayment = await getRow('SELECT * FROM payments_archive WHERE id = ?', [archiveId]);
    if (!archivedPayment) {
      return res.status(404).json({
        success: false,
        error: 'Archived payment not found'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      // Insert into trashbox
      await runQuery(`
        INSERT INTO payments_trashbox (
          original_id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
          paymentType, senderBank, receiverBank, status, proofOfPayment,
          deleted_at, deleted_by_user_id, deleted_by_username, deletion_reason
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
      `, [
        archivedPayment.original_id,
        archivedPayment.groupId,
        archivedPayment.memberId,
        archivedPayment.amount,
        archivedPayment.paymentDate,
        archivedPayment.paymentMonth,
        archivedPayment.slot,
        archivedPayment.paymentType,
        archivedPayment.senderBank,
        archivedPayment.receiverBank,
        archivedPayment.status,
        archivedPayment.proofOfPayment,
        userId || null,
        username || null,
        deletion_reason || `Moved from archive: ${archivedPayment.archive_reason || 'No reason provided'}`
      ]);

      // Log payment deletion
      const paymentLogger = new PaymentLogger(db);
      await paymentLogger.logPaymentDeleted(
        archivedPayment,
        req.user!,
        req.ip,
        req.get('User-Agent'),
        `Moved to trashbox from archive (original archive ID: ${archiveId})`
      );

      // Delete from archive
      await runQuery('DELETE FROM payments_archive WHERE id = ?', [archiveId]);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: 'Payment moved to trashbox successfully',
        data: {
          moved: 1
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error moving archived payment to trashbox:', error);
    res.status(500).json({
      success: false,
      error: `Failed to move payment to trashbox: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Bulk restore archived payments
router.post('/archive/bulk-restore', authenticateToken, async (req, res) => {
  try {
    const { archiveIds } = req.body;

    if (!archiveIds || !Array.isArray(archiveIds) || archiveIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Archive IDs are required'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Get all archived payments to be restored
    const archivedPayments = await getAll('SELECT * FROM payments_archive WHERE id IN (' + archiveIds.map(() => '?').join(',') + ')', archiveIds);

    if (archivedPayments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No archived payments found to restore'
      });
    }

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      const restoredPaymentIds = [];
      
      // Restore each payment
      for (const archivedPayment of archivedPayments) {
        // Insert back into payments table
        const result = await runQuery(`
          INSERT INTO payments (
            groupId, memberId, amount, paymentDate, paymentMonth, slot,
            paymentType, senderBank, receiverBank, status, proofOfPayment
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          archivedPayment.groupId,
          archivedPayment.memberId,
          archivedPayment.amount,
          archivedPayment.paymentDate,
          archivedPayment.paymentMonth,
          archivedPayment.slot,
          archivedPayment.paymentType,
          archivedPayment.senderBank,
          archivedPayment.receiverBank,
          archivedPayment.status,
          archivedPayment.proofOfPayment
        ]);

        restoredPaymentIds.push(result.id);

        // Log payment restoration
        const paymentLogger = new PaymentLogger(db);
        await paymentLogger.logPaymentRestored(
          { ...archivedPayment, id: result.id },
          req.user!,
          req.ip,
          req.get('User-Agent'),
          `Bulk restored from archive (original archive ID: ${archivedPayment.id})`
        );
      }

      // Delete all from archive
      await runQuery('DELETE FROM payments_archive WHERE id IN (' + archiveIds.map(() => '?').join(',') + ')', archiveIds);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: `${archivedPayments.length} payment(s) restored successfully`,
        data: {
          restored: archivedPayments.length,
          newPaymentIds: restoredPaymentIds
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error bulk restoring archived payments:', error);
    res.status(500).json({
      success: false,
      error: `Failed to restore payments: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

// Bulk move archived payments to trashbox
router.post('/archive/bulk-move-to-trashbox', authenticateToken, async (req, res) => {
  try {
    const { archiveIds, deletion_reason } = req.body;

    if (!archiveIds || !Array.isArray(archiveIds) || archiveIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Archive IDs are required'
      });
    }

    // Get user info for audit trail
    const userId = req.user?.id;
    const username = req.user?.username;

    // Get all archived payments to be moved
    const archivedPayments = await getAll('SELECT * FROM payments_archive WHERE id IN (' + archiveIds.map(() => '?').join(',') + ')', archiveIds);

    if (archivedPayments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No archived payments found to move'
      });
    }

    // Use a transaction to ensure data consistency
    await runQuery('BEGIN TRANSACTION');

    try {
      // Move each payment to trashbox
      for (const archivedPayment of archivedPayments) {
        // Insert into trashbox
        await runQuery(`
          INSERT INTO payments_trashbox (
            original_id, groupId, memberId, amount, paymentDate, paymentMonth, slot,
            paymentType, senderBank, receiverBank, status, proofOfPayment,
            deleted_at, deleted_by_user_id, deleted_by_username, deletion_reason
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?)
        `, [
          archivedPayment.original_id,
          archivedPayment.groupId,
          archivedPayment.memberId,
          archivedPayment.amount,
          archivedPayment.paymentDate,
          archivedPayment.paymentMonth,
          archivedPayment.slot,
          archivedPayment.paymentType,
          archivedPayment.senderBank,
          archivedPayment.receiverBank,
          archivedPayment.status,
          archivedPayment.proofOfPayment,
          userId || null,
          username || null,
          deletion_reason || `Bulk moved from archive: ${archivedPayment.archive_reason || 'No reason provided'}`
        ]);

        // Log payment deletion
        const paymentLogger = new PaymentLogger(db);
        await paymentLogger.logPaymentDeleted(
          archivedPayment,
          req.user!,
          req.ip,
          req.get('User-Agent'),
          `Bulk moved to trashbox from archive (original archive ID: ${archivedPayment.id})`
        );
      }

      // Delete all from archive
      await runQuery('DELETE FROM payments_archive WHERE id IN (' + archiveIds.map(() => '?').join(',') + ')', archiveIds);

      // Commit the transaction
      await runQuery('COMMIT');

      res.json({
        success: true,
        message: `${archivedPayments.length} payment(s) moved to trashbox successfully`,
        data: {
          moved: archivedPayments.length
        }
      });
    } catch (error) {
      // Rollback the transaction on error
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error bulk moving archived payments to trashbox:', error);
    res.status(500).json({
      success: false,
      error: `Failed to move payments to trashbox: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
});

export default router; 