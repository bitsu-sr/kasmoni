import express from 'express';
import { validateRequest, validateId } from '../middleware/validation';
import { groupSchema, groupMemberSchema } from '../middleware/validation';
import { getAll, getRow, runQuery } from '../utils/database';
import { Group, GroupMember, ApiResponse } from '../types';
import { calculateGroupStatus, getCurrentMonthYear } from '../utils/groupStatusCalculator';

const router = express.Router();

// Get all groups
router.get('/', async (req, res) => {
  try {
    const currentMonthYear = getCurrentMonthYear();
    const groups = await calculateGroupStatus(currentMonthYear);
    
    res.json({
      success: true,
      data: groups
    } as ApiResponse<Group[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch groups'
    });
  }
});

// Get group by ID with members
router.get('/:id', validateId, async (req, res) => {
  try {
    const group = await getRow(
      'SELECT * FROM groups WHERE id = ?',
      [req.params.id]
    );
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const members = await getAll(`
      SELECT gm.*, m.firstName, m.lastName, m.phoneNumber, m.bankName, m.accountNumber, m.nationalId
      FROM group_members gm
      JOIN members m ON gm.memberId = m.id
      WHERE gm.groupId = ?
      ORDER BY gm.receiveMonth
    `, [req.params.id]);

    res.json({
      success: true,
      data: { ...group, members }
    } as ApiResponse<Group & { members: GroupMember[] }>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch group'
    });
  }
});

// Create new group
router.post('/', validateRequest(groupSchema), async (req, res) => {
  try {
    const { name, monthlyAmount, maxMembers, duration, startMonth } = req.body;

    // Calculate end month
    const [year, month] = startMonth.split('-').map(Number);
    const endMonth = month + duration - 1;
    const endYear = year + Math.floor((endMonth - 1) / 12);
    const finalMonth = ((endMonth - 1) % 12) + 1;
    const endMonthStr = `${endYear}-${finalMonth.toString().padStart(2, '0')}`;

    const result = await runQuery(`
      INSERT INTO groups (name, monthlyAmount, maxMembers, duration, startMonth, endMonth)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, monthlyAmount, maxMembers, duration, startMonth, endMonthStr]);

    const newGroup = await getRow(
      'SELECT * FROM groups WHERE id = ?',
      [result.id]
    );

    res.status(201).json({
      success: true,
      data: newGroup,
      message: 'Group created successfully'
    } as ApiResponse<Group>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create group'
    });
  }
});

// Update group
router.put('/:id', validateId, validateRequest(groupSchema), async (req, res) => {
  try {
    const { name, monthlyAmount, maxMembers, duration, startMonth } = req.body;

    // Calculate end month
    const [year, month] = startMonth.split('-').map(Number);
    const endMonth = month + duration - 1;
    const endYear = year + Math.floor((endMonth - 1) / 12);
    const finalMonth = ((endMonth - 1) % 12) + 1;
    const endMonthStr = `${endYear}-${finalMonth.toString().padStart(2, '0')}`;

    const result = await runQuery(`
      UPDATE groups SET
        name = ?, monthlyAmount = ?, maxMembers = ?, duration = ?,
        startMonth = ?, endMonth = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [name, monthlyAmount, maxMembers, duration, startMonth, endMonthStr, req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    const updatedGroup = await getRow(
      'SELECT * FROM groups WHERE id = ?',
      [req.params.id]
    );

    res.json({
      success: true,
      data: updatedGroup,
      message: 'Group updated successfully'
    } as ApiResponse<Group>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update group'
    });
  }
});

// Delete group
router.delete('/:id', validateId, async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM groups WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete group'
    });
  }
});

// Add member to group
router.post('/:id/members', validateId, async (req, res) => {
  try {
    const { memberId, receiveMonth } = req.body;
    const groupId = parseInt(req.params.id);

    // Manual validation
    if (!memberId || typeof memberId !== 'number' || memberId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'memberId is required and must be a positive number'
      });
    }

    if (!receiveMonth || typeof receiveMonth !== 'string' || !/^\d{4}-\d{2}$/.test(receiveMonth)) {
      return res.status(400).json({
        success: false,
        error: 'receiveMonth is required and must be in YYYY-MM format'
      });
    }

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

    // Check if member is already assigned to this specific month in the group
    const existingMemberMonth = await getRow(
      'SELECT * FROM group_members WHERE groupId = ? AND memberId = ? AND receiveMonth = ?',
      [groupId, memberId, receiveMonth]
    );
    if (existingMemberMonth) {
      return res.status(400).json({
        success: false,
        error: 'Member is already assigned to this month in this group'
      });
    }

    // Check if month is already taken
    const existingMonth = await getRow(
      'SELECT gm.*, m.firstName, m.lastName FROM group_members gm JOIN members m ON gm.memberId = m.id WHERE gm.groupId = ? AND gm.receiveMonth = ?',
      [groupId, receiveMonth]
    );
    if (existingMonth) {
      return res.status(400).json({
        success: false,
        error: `This month is already assigned to ${existingMonth.firstName} ${existingMonth.lastName}`
      });
    }

    // Check if group is full (based on unique months assigned, not total member entries)
    const monthCount = await getRow(
      'SELECT COUNT(DISTINCT receiveMonth) as count FROM group_members WHERE groupId = ?',
      [groupId]
    );
    if (monthCount.count >= group.maxMembers) {
      return res.status(400).json({
        success: false,
        error: 'Group is already full (all months are assigned)'
      });
    }

    const result = await runQuery(`
      INSERT INTO group_members (groupId, memberId, receiveMonth)
      VALUES (?, ?, ?)
    `, [groupId, memberId, receiveMonth]);

    const newGroupMember = await getRow(`
      SELECT gm.*, m.firstName, m.lastName, m.phoneNumber, m.bankName, m.accountNumber
      FROM group_members gm
      JOIN members m ON gm.memberId = m.id
      WHERE gm.id = ?
    `, [result.id]);

    res.status(201).json({
      success: true,
      data: newGroupMember,
      message: 'Member added to group successfully'
    } as ApiResponse<GroupMember>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add member to group'
    });
  }
});

 // Remove member from group
 router.delete('/:id/members/:memberId', validateId, async (req, res) => {
   try {
     const { receiveMonth } = req.query;
     
     let query, params;
     
     if (receiveMonth) {
       // Remove specific month assignment for the member
       query = 'DELETE FROM group_members WHERE groupId = ? AND memberId = ? AND receiveMonth = ?';
       params = [req.params.id, req.params.memberId, receiveMonth];
     } else {
       // Remove all assignments for the member in this group
       query = 'DELETE FROM group_members WHERE groupId = ? AND memberId = ?';
       params = [req.params.id, req.params.memberId];
     }

     const result = await runQuery(query, params);

     if (result.changes === 0) {
       return res.status(404).json({
         success: false,
         error: 'Group member not found'
       });
     }

     res.json({
       success: true,
       message: receiveMonth 
         ? 'Member removed from specific month successfully'
         : 'Member removed from group successfully'
     });
   } catch (error) {
     res.status(500).json({
       success: false,
       error: 'Failed to remove member from group'
     });
   }
 });



export default router; 