import express from 'express';
import { getAll, getRow } from '../utils/database';
import { DashboardStats, ApiResponse } from '../types';
import { calculateGroupStatusWithRecipients, getCurrentMonthYear } from '../utils/groupStatusCalculator';

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    // Get current month for filtering
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    // Get total members (always show all members)
    const totalMembers = await getRow('SELECT COUNT(*) as count FROM members');
    
    // Get total groups (always show all groups)
    const totalGroups = await getRow('SELECT COUNT(*) as count FROM groups');
    
    // Get total payments for current month only
    const totalPayments = await getRow(`
      SELECT COUNT(*) as count 
      FROM payments 
      WHERE paymentMonth = ?
    `, [currentMonthYear]);
    
    // Get total amount received for current month only (received status only)
    const totalAmountReceived = await getRow(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'received' AND paymentMonth = ?
    `, [currentMonthYear]);
    
    // Get total amount settled for current month only (settled status only)
    const totalAmountSettled = await getRow(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE status = 'settled' AND paymentMonth = ?
    `, [currentMonthYear]);
    
    // Get pending payments count and amount for current month only (case insensitive)
    const pendingPayments = await getRow(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
      FROM payments 
      WHERE LOWER(status) = 'pending' AND paymentMonth = ?
    `, [currentMonthYear]);
    
    // Calculate total amount paid = received + pending + settled for current month
    const totalAmountPaid = Number(totalAmountReceived.total) + Number(pendingPayments.totalAmount) + Number(totalAmountSettled.total);
    
    // Get total amount expected for all active groups (monthlyAmount * duration for each active group)
    const totalAmountExpected = await getRow(`
      SELECT COALESCE(SUM(g.monthlyAmount * g.duration), 0) as total
      FROM groups g
      WHERE (g.endMonth >= ? OR g.endMonth IS NULL)
    `, [currentMonthYear]);
    
    // Get overdue payments count for current month
    const currentMonthNum = currentDate.getMonth();
    const currentYearNum = currentDate.getFullYear();
    
    // Create deadline: 11:59 PM on the 28th of the current month
    const deadlineDate = new Date(currentYearNum, currentMonthNum, 28, 23, 59, 59);
    
    let overduePayments = 0;
    // Only count as overdue if current time is after 11:59 PM on the 28th
    if (currentDate > deadlineDate) {
      const overdueResult = await getRow(`
        SELECT COUNT(*) as count
        FROM payments p
        WHERE p.status IN ('not_paid', 'pending')
        AND p.paymentMonth = ?
        AND date(p.paymentDate) <= date(?)
      `, [currentMonthYear, deadlineDate.toISOString().split('T')[0]]);
      overduePayments = overdueResult.count;
    }

    const stats: DashboardStats = {
      totalMembers: totalMembers.count,
      totalGroups: totalGroups.count,
      totalPayments: totalPayments.count,
      totalAmountPaid: totalAmountPaid,
      totalAmountReceived: totalAmountReceived.total,
      totalAmountExpected: totalAmountExpected.total,
      overduePayments,
      pendingPayments: pendingPayments.count,
      pendingAmount: Number(pendingPayments.totalAmount) || 0
    };

    res.json({
      success: true,
      data: stats
    } as ApiResponse<DashboardStats>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Get payment statistics by status
router.get('/payments-by-status', async (req, res) => {
  try {
    const paymentsByStatus = await getAll(`
      SELECT status, COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
      FROM payments
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: paymentsByStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment statistics'
    });
  }
});

// Get monthly payment trends
router.get('/monthly-trends', async (req, res) => {
  try {
    const monthlyTrends = await getAll(`
      SELECT 
        strftime('%Y-%m', paymentDate) as month,
        COUNT(*) as paymentCount,
        COALESCE(SUM(amount), 0) as totalAmount,
        COUNT(CASE WHEN status IN ('received', 'settled') THEN 1 END) as completedPayments,
        COUNT(CASE WHEN status IN ('not_paid', 'pending') THEN 1 END) as pendingPayments
      FROM payments
      GROUP BY strftime('%Y-%m', paymentDate)
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      success: true,
      data: monthlyTrends
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trends'
    });
  }
});

// Get group performance statistics
router.get('/group-performance', async (req, res) => {
  try {
    const groupPerformance = await getAll(`
      SELECT 
        g.id,
        g.name,
        g.monthlyAmount,
        COUNT(gm.id) as memberCount,
        COUNT(p.id) as totalPayments,
        COALESCE(SUM(CASE WHEN p.status IN ('received', 'settled') THEN p.amount ELSE 0 END), 0) as totalPaid,
        COALESCE(SUM(CASE WHEN p.status IN ('not_paid', 'pending') THEN p.amount ELSE 0 END), 0) as totalPending
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.groupId
      LEFT JOIN payments p ON g.id = p.groupId
      GROUP BY g.id
      ORDER BY g.createdAt DESC
    `);

    res.json({
      success: true,
      data: groupPerformance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group performance'
    });
  }
});

// Get recent activities
router.get('/recent-activities', async (req, res) => {
  try {
    const recentActivities = await getAll(`
      SELECT 
        'payment' as type,
        p.id,
        p.createdAt,
        p.status,
        m.firstName || ' ' || m.lastName as memberName,
        g.name as groupName,
        p.amount
      FROM payments p
      JOIN members m ON p.memberId = m.id
      JOIN groups g ON p.groupId = g.id
      UNION ALL
      SELECT 
        'member' as type,
        m.id,
        m.createdAt,
        'registered' as status,
        m.firstName || ' ' || m.lastName as memberName,
        NULL as groupName,
        NULL as amount
      FROM members m
      ORDER BY createdAt DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      data: recentActivities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activities'
    });
  }
});

// Get groups with current month recipients
router.get('/groups-current-month', async (req, res) => {
  try {
    const currentMonthYear = getCurrentMonthYear();
    const groupsWithRecipients = await calculateGroupStatusWithRecipients(currentMonthYear);

    res.json({
      success: true,
      data: groupsWithRecipients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups with current month recipients'
    });
  }
});

// Test endpoint to check payments data
router.get('/test-payments', async (req, res) => {
  try {
    const allPayments = await getAll(`
      SELECT id, status, amount, paymentDate, createdAt
      FROM payments 
      ORDER BY createdAt DESC
    `);
    
    const uniqueStatuses = await getAll(`
      SELECT DISTINCT status, COUNT(*) as count
      FROM payments 
      GROUP BY status
    `);
    
    const pendingTest = await getRow(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount
      FROM payments 
      WHERE LOWER(status) = 'pending'
    `);
    
    res.json({
      success: true,
      data: {
        allPayments,
        uniqueStatuses,
        pendingTest
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test data'
    });
  }
});

export default router; 