import express from 'express';
import { Database } from 'sqlite3';
import { ApiResponse, PaymentLog } from '../types';
import { authenticateToken } from '../middleware/auth';
import db from '../utils/database';

const router = express.Router();

// Get all payment logs with optional filtering
router.get('/list', authenticateToken, async (req, res) => {
  try {
    
    // Check if user is admin
    if (req.user?.role !== 'administrator' && req.user?.role !== 'super_user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view payment logs.'
      });
    }

    const {
      action,
      member_id,
      group_id,
      performed_by,
      start_date,
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        pl.*,
        m.firstName as member_firstName,
        m.lastName as member_lastName,
        g.name as group_name,
        p.amount as payment_amount,
        p.paymentDate as payment_date,
        p.paymentMonth as payment_month,
        p.paymentType as payment_type,
        p.status as payment_status
      FROM payment_logs pl
      LEFT JOIN members m ON pl.member_id = m.id
      LEFT JOIN groups g ON pl.group_id = g.id
      LEFT JOIN payments p ON pl.payment_id = p.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Add filters
    if (action) {
      query += ` AND pl.action = ?`;
      params.push(action);
    }

    if (member_id) {
      query += ` AND pl.member_id = ?`;
      params.push(member_id);
    }

    if (group_id) {
      query += ` AND pl.group_id = ?`;
      params.push(group_id);
    }

    if (performed_by) {
      query += ` AND pl.performed_by_username LIKE ?`;
      params.push(`%${performed_by}%`);
    }

    if (start_date) {
      query += ` AND pl.timestamp >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND pl.timestamp <= ?`;
      params.push(end_date);
    }

    // Add ordering and pagination
    query += ` ORDER BY pl.timestamp DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Error fetching payment logs:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching payment logs'
        });
      }

      // Transform rows to PaymentLog objects
      const logs: PaymentLog[] = rows.map((row: any) => ({
        id: row.id,
        payment_id: row.payment_id,
        action: row.action,
        old_status: row.old_status,
        new_status: row.new_status,
        old_amount: row.old_amount,
        new_amount: row.new_amount,
        old_payment_date: row.old_payment_date,
        new_payment_date: row.new_payment_date,
        old_payment_month: row.old_payment_month,
        new_payment_month: row.new_payment_month,
        old_payment_type: row.old_payment_type,
        new_payment_type: row.new_payment_type,
        old_sender_bank: row.old_sender_bank,
        new_sender_bank: row.new_sender_bank,
        old_receiver_bank: row.old_receiver_bank,
        new_receiver_bank: row.new_receiver_bank,
        old_proof_of_payment: row.old_proof_of_payment,
        new_proof_of_payment: row.new_proof_of_payment,
        member_id: row.member_id,
        group_id: row.group_id,
        bulk_payment_count: row.bulk_payment_count,
        details: row.details,
        performed_by_user_id: row.performed_by_user_id,
        performed_by_username: row.performed_by_username,
        timestamp: row.timestamp,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        member: row.member_firstName ? {
          id: row.member_id,
          firstName: row.member_firstName,
          lastName: row.member_lastName,
          birthDate: '',
          birthplace: '',
          address: '',
          city: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          nationality: '',
          occupation: '',
          bankName: '',
          accountNumber: '',
          registrationDate: '',
          createdAt: '',
          updatedAt: ''
        } : undefined,
        group: row.group_name ? {
          id: row.group_id,
          name: row.group_name,
          monthlyAmount: 0,
          maxMembers: 0,
          duration: 0,
          startMonth: '',
          endMonth: '',
          createdAt: '',
          updatedAt: ''
        } : undefined,
        payment: row.payment_amount ? {
          id: row.payment_id,
          amount: row.payment_amount,
          paymentDate: row.payment_date,
          paymentMonth: row.payment_month,
          paymentType: row.payment_type,
          status: row.payment_status,
          groupId: row.group_id,
          memberId: row.member_id,
          slot: '',
          createdAt: '',
          updatedAt: ''
        } : undefined
      }));

      res.json({
        success: true,
        data: logs,
        pagination: {
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          total: logs.length
        }
      });
    });
  } catch (error) {
    console.error('Error in payment logs route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get payment log statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    
    // Check if user is admin
    if (req.user?.role !== 'administrator' && req.user?.role !== 'super_user') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only administrators can view payment log statistics.'
      });
    }

    const statsQuery = `
      SELECT 
        action,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM payment_logs 
      WHERE timestamp >= date('now', '-30 days')
      GROUP BY action, DATE(timestamp)
      ORDER BY date DESC, action
    `;

    db.all(statsQuery, [], (err, rows) => {
      if (err) {
        console.error('Error fetching payment log stats:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching payment log statistics'
        });
      }

      // Group by date and action
      const stats: any = {};
      rows.forEach((row: any) => {
        if (!stats[row.date]) {
          stats[row.date] = {};
        }
        stats[row.date][row.action] = row.count;
      });

      res.json({
        success: true,
        data: stats
      });
    });
  } catch (error) {
    console.error('Error in payment logs stats route:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router; 