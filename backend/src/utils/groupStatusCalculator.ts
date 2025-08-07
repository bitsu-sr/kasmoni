import { getAll } from './database';

export interface GroupStatusData {
  id: number;
  name: string;
  monthlyAmount: number;
  maxMembers: number;
  duration: number;
  startMonth: string;
  endMonth: string;
  createdAt: string;
  updatedAt: string;
  status: 'not_paid' | 'pending' | 'fully_paid';
  pendingCount: number;
  memberCount: number;
  memberNames?: string;
}

export interface GroupWithRecipientData extends GroupStatusData {
  receiveMonth: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  bankName?: string;
  accountNumber?: string;
}

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonthYear(): string {
  const currentDate = new Date();
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentDate.getFullYear().toString();
  return `${currentYear}-${currentMonth}`;
}

/**
 * Calculate group status using the correct logic from the groups endpoint 
 * This ensures consistency across all endpoints
 */
export async function calculateGroupStatus(currentMonthYear: string): Promise<GroupStatusData[]> {
  const groups = await getAll(`
    SELECT 
      g.*, 
      COUNT(DISTINCT gm.receiveMonth) as memberCount,
      CASE 
        WHEN COUNT(DISTINCT gm.receiveMonth) = 0 THEN 'not_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'received' THEN 1 END) = COUNT(DISTINCT gm.receiveMonth) THEN 'fully_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'not_paid' THEN 1 END) + COUNT(CASE WHEN p_current.status IS NULL THEN 1 END) = COUNT(DISTINCT gm.receiveMonth) THEN 'not_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'pending' THEN 1 END) = COUNT(DISTINCT gm.receiveMonth) THEN 'pending'
        ELSE 'pending'
      END as status,
      (SELECT COUNT(*) FROM group_members gm2 
       LEFT JOIN payments p2 ON g.id = p2.groupId AND gm2.memberId = p2.memberId AND p2.slot = gm2.receiveMonth AND p2.paymentMonth = ?
       WHERE gm2.groupId = g.id 
       AND (p2.status IN ('not_paid', 'pending') OR p2.status IS NULL)
      ) as pendingCount,
      GROUP_CONCAT(DISTINCT m.firstName || ' ' || m.lastName) as memberNames
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.groupId
    LEFT JOIN members m ON gm.memberId = m.id
    LEFT JOIN payments p_current ON g.id = p_current.groupId AND gm.memberId = p_current.memberId AND p_current.slot = gm.receiveMonth AND p_current.paymentMonth = ?
    GROUP BY g.id
    ORDER BY g.createdAt DESC
  `, [currentMonthYear, currentMonthYear]);

  return groups;
}

/**
 * Calculate group status with current month recipients
 * Uses the same logic as calculateGroupStatus but includes recipient information
 */
export async function calculateGroupStatusWithRecipients(currentMonthYear: string): Promise<GroupWithRecipientData[]> {
  const groupsWithRecipients = await getAll(`
    SELECT 
      g.id,
      g.name,
      g.monthlyAmount,
      g.endMonth,
      gm.receiveMonth,
      m.firstName,
      m.lastName,
      m.phoneNumber,
      m.bankName,
      m.accountNumber,
      CASE 
        WHEN COUNT(DISTINCT gm2.receiveMonth) = 0 THEN 'not_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'received' THEN 1 END) = COUNT(DISTINCT gm2.receiveMonth) THEN 'fully_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'not_paid' THEN 1 END) + COUNT(CASE WHEN p_current.status IS NULL THEN 1 END) = COUNT(DISTINCT gm2.receiveMonth) THEN 'not_paid'
        WHEN COUNT(CASE WHEN p_current.status = 'pending' THEN 1 END) = COUNT(DISTINCT gm2.receiveMonth) THEN 'pending'
        ELSE 'pending'
      END as status,
      (SELECT COUNT(*) FROM group_members gm3 
       LEFT JOIN payments p3 ON g.id = p3.groupId AND gm3.memberId = p3.memberId AND p3.slot = gm3.receiveMonth AND p3.paymentMonth = ?
       WHERE gm3.groupId = g.id 
       AND (p3.status IN ('not_paid', 'pending') OR p3.status IS NULL)
      ) as pendingCount,
      COUNT(DISTINCT gm2.receiveMonth) as memberCount
    FROM groups g
    LEFT JOIN group_members gm ON g.id = gm.groupId AND gm.receiveMonth = ?
    LEFT JOIN members m ON gm.memberId = m.id
    LEFT JOIN group_members gm2 ON g.id = gm2.groupId
    LEFT JOIN payments p_current ON g.id = p_current.groupId AND gm2.memberId = p_current.memberId AND p_current.slot = gm2.receiveMonth AND p_current.paymentMonth = ?
    WHERE g.endMonth >= ? OR g.endMonth IS NULL
    GROUP BY g.id, g.name, g.monthlyAmount, g.endMonth, gm.receiveMonth, m.firstName, m.lastName, m.phoneNumber, m.bankName, m.accountNumber
    ORDER BY g.name ASC
  `, [currentMonthYear, currentMonthYear, currentMonthYear, currentMonthYear]);

  return groupsWithRecipients;
} 