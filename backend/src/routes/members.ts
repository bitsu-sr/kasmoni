import express from 'express';
import { validateRequest, validateId } from '../middleware/validation';
import { memberSchema } from '../middleware/validation';
import { getAll, getRow, runQuery } from '../utils/database';
import { Member, ApiResponse } from '../types';
import { createMemberUser } from '../utils/memberAuth';

const router = express.Router();

// Get all members
router.get('/', async (req, res) => {
  try {
    const members = await getAll(`
      SELECT * FROM members 
      ORDER BY firstName, lastName
    `);
    
    res.json({
      success: true,
      data: members
    } as ApiResponse<Member[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch members'
    });
  }
});

// Get member groups
router.get('/:id/groups', validateId, async (req, res) => {
  try {
    // Get current month-year for filtering
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    const currentMonthYear = `${currentYear}-${currentMonth}`;
    
    const memberGroups = await getAll(`
      SELECT 
        g.name as groupName, 
        gm.receiveMonth, 
        g.monthlyAmount,
        COALESCE(
          (SELECT p.status 
           FROM payments p 
           WHERE p.memberId = gm.memberId 
           AND p.groupId = gm.groupId 
           AND p.slot = gm.receiveMonth
           AND p.paymentMonth = ?
           ORDER BY p.createdAt DESC
           LIMIT 1), 
          'not_paid'
        ) as paymentStatus
      FROM group_members gm
      JOIN groups g ON gm.groupId = g.id
      WHERE gm.memberId = ?
      ORDER BY g.name, gm.receiveMonth
    `, [currentMonthYear, req.params.id]);

    res.json({
      success: true,
      data: memberGroups
    } as ApiResponse<{ groupName: string; receiveMonth: string; monthlyAmount: number; paymentStatus: string }[]>);
  } catch (error) {
    console.error('Error fetching member groups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member groups'
    });
  }
});

// Get member by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const member = await getRow(
      'SELECT * FROM members WHERE id = ?',
      [req.params.id]
    );
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    res.json({
      success: true,
      data: member
    } as ApiResponse<Member>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member'
    });
  }
});

// Create new member
router.post('/', validateRequest(memberSchema), async (req, res) => {
  try {
    const {
      firstName, lastName, birthDate, birthplace, address, city,
      phoneNumber, email, nationalId, nationality, occupation,
      bankName, accountNumber, registrationDate
    } = req.body;

    const result = await runQuery(`
      INSERT INTO members (
        firstName, lastName, birthDate, birthplace, address, city,
        phoneNumber, email, nationalId, nationality, occupation,
        bankName, accountNumber, registrationDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      firstName, lastName, birthDate, birthplace, address, city,
      phoneNumber, email, nationalId, nationality, occupation,
      bankName, accountNumber, registrationDate || new Date().toISOString().split('T')[0]
    ]);

    // Automatically create user account for the new member
    const userCredentials = await createMemberUser(result.lastID, firstName, lastName);

    const newMember = await getRow(
      'SELECT * FROM members WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      data: {
        ...newMember,
        userCredentials: {
          username: userCredentials.username,
          password: userCredentials.password
        }
      },
      message: 'Member created successfully with user account'
    } as ApiResponse<Member & { userCredentials: { username: string; password: string } }>);
  } catch (error) {
    console.error('Error creating member:', error);
    let errorMessage = 'Failed to create member';
    
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        if (error.message.includes('email')) {
          errorMessage = 'Email address already exists';
        } else if (error.message.includes('nationalId')) {
          errorMessage = 'National ID already exists';
        } else {
          errorMessage = 'Duplicate data detected';
        }
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Update member
router.put('/:id', validateId, validateRequest(memberSchema), async (req, res) => {
  try {
    console.log('Update member request received for ID:', req.params.id);
    console.log('Request body:', req.body);
    
    const {
      firstName, lastName, birthDate, birthplace, address, city,
      phoneNumber, email, nationalId, nationality, occupation,
      bankName, accountNumber, registrationDate
    } = req.body;

    const result = await runQuery(`
      UPDATE members SET
        firstName = ?, lastName = ?, birthDate = ?, birthplace = ?, 
        address = ?, city = ?, phoneNumber = ?, email = ?, 
        nationalId = ?, nationality = ?, occupation = ?, 
        bankName = ?, accountNumber = ?, registrationDate = ?,
        updatedAt = datetime('now')
      WHERE id = ?
    `, [
      firstName, lastName, birthDate, birthplace, address, city,
      phoneNumber, email, nationalId, nationality, occupation,
      bankName, accountNumber, registrationDate, req.params.id
    ]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    const updatedMember = await getRow(
      'SELECT * FROM members WHERE id = ?',
      [req.params.id]
    );

    console.log('Member updated successfully:', updatedMember);

    res.json({
      success: true,
      data: updatedMember,
      message: 'Member updated successfully'
    } as ApiResponse<Member>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update member'
    });
  }
});

// Delete member
router.delete('/:id', validateId, async (req, res) => {
  try {
    const result = await runQuery(
      'DELETE FROM members WHERE id = ?',
      [req.params.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete member'
    });
  }
});

// Get member slots for dashboard
router.get('/:id/slots', validateId, async (req, res) => {
  try {
    // Get current month for filtering
    const currentDate = new Date();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = currentDate.getFullYear().toString();
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    const memberSlots = await getAll(`
      SELECT 
        g.id as groupId,
        g.name as groupName,
        g.monthlyAmount,
        g.duration,
        gm.receiveMonth,
        gm.receiveMonth as slot,
        (g.monthlyAmount * g.duration) as totalAmount,
        COALESCE(
          (SELECT p.status 
           FROM payments p 
           WHERE p.memberId = gm.memberId 
           AND p.groupId = gm.groupId 
           AND p.slot = gm.receiveMonth
           AND p.paymentMonth = ?
           ORDER BY p.createdAt DESC
           LIMIT 1), 
          'not_paid'
        ) as paymentStatus
      FROM group_members gm
      JOIN groups g ON gm.groupId = g.id
      WHERE gm.memberId = ?
      ORDER BY g.name, gm.receiveMonth
    `, [currentMonthYear, req.params.id]);

    res.json({
      success: true,
      data: memberSlots
    } as ApiResponse<{
      groupId: number;
      groupName: string;
      monthlyAmount: number;
      duration: number;
      receiveMonth: string;
      slot: string;
      totalAmount: number;
      paymentStatus: string;
    }[]>);
  } catch (error) {
    console.error('Error fetching member slots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member slots'
    });
  }
});

export default router; 