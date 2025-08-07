import express from 'express';
import { getAll, getRow } from '../utils/database';
import { ApiResponse } from '../types';

const router = express.Router();

// Get analytics stats
router.get('/stats', async (req, res) => {
  try {
    // Get current month-year for filtering
    const currentDate = new Date();
    const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // Get total expected amount (same as dashboard)
    const totalExpectedResult = await getRow(`
      SELECT COALESCE(SUM(g.monthlyAmount * g.duration), 0) as total
      FROM groups g
      WHERE (g.endMonth >= ? OR g.endMonth IS NULL)
    `, [currentMonthYear]);

    // Get total paid for current month
    const totalPaidResult = await getRow(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'settled' AND paymentMonth = ?
    `, [currentMonthYear]);

    // Get total received for current month
    const totalReceivedResult = await getRow(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'received' AND paymentMonth = ?
    `, [currentMonthYear]);

    // Get total pending for current month
    const totalPendingResult = await getRow(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE status = 'pending' AND paymentMonth = ?
    `, [currentMonthYear]);

    // Get DSB members count (De Surinaamsche Bank)
    const dsbMembersResult = await getRow(`
      SELECT COUNT(DISTINCT memberId) as count
      FROM payments
      WHERE receiverBank = 'De Surinaamsche Bank' 
      AND paymentMonth = ?
      AND status IN ('received', 'settled')
    `, [currentMonthYear]);

    // Get Finabank members count
    const finabankMembersResult = await getRow(`
      SELECT COUNT(DISTINCT memberId) as count
      FROM payments
      WHERE receiverBank = 'Finabank' 
      AND paymentMonth = ?
      AND status IN ('received', 'settled')
    `, [currentMonthYear]);

    // Get Cash members count
    const cashMembersResult = await getRow(`
      SELECT COUNT(DISTINCT memberId) as count
      FROM payments
      WHERE paymentType = 'cash' 
      AND paymentMonth = ?
      AND status IN ('received', 'settled')
    `, [currentMonthYear]);

    const analyticsStats = {
      totalExpectedAmount: totalExpectedResult.total,
      totalPaid: totalPaidResult.total,
      totalReceived: totalReceivedResult.total,
      totalPending: totalPendingResult.total,
      dsbMembers: dsbMembersResult.count,
      finabankMembers: finabankMembersResult.count,
      cashMembers: cashMembersResult.count,
    };

    res.json({
      success: true,
      data: analyticsStats
    } as ApiResponse<typeof analyticsStats>);
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics stats'
    });
  }
});

export default router; 