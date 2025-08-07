import express from 'express';
import { validateRequest, validateId } from '../middleware/validation';
import { bankSchema } from '../middleware/validation';
import { getAll, getRow, runQuery } from '../utils/database';
import { Bank, ApiResponse } from '../types';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = express.Router();

// Get all banks
router.get('/', async (req, res) => {
  try {
    const banks = await getAll(`
      SELECT * FROM banks 
      ORDER BY bankName
    `);
    
    res.json({
      success: true,
      data: banks
    } as ApiResponse<Bank[]>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banks'
    });
  }
});

// Get bank by ID
router.get('/:id', validateId, async (req, res) => {
  try {
    const bank = await getRow(
      'SELECT * FROM banks WHERE id = ?',
      [req.params.id]
    );
    
    if (!bank) {
      return res.status(404).json({
        success: false,
        error: 'Bank not found'
      });
    }

    res.json({
      success: true,
      data: bank
    } as ApiResponse<Bank>);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch bank'
    });
  }
});

// Create new bank
router.post('/', authenticateToken, requireRole(['administrator', 'super_user']), validateRequest(bankSchema), async (req, res) => {
  try {
    console.log('Bank creation request received');
    console.log('Request user:', (req as any).user);
    console.log('Request body:', req.body);
    
    const { bankName, shortName, bankAddress } = req.body;

    // Check if bank with same name already exists
    const existingBank = await getRow(
      'SELECT id FROM banks WHERE bankName = ? OR shortName = ?',
      [bankName, shortName]
    );

    if (existingBank) {
      return res.status(400).json({
        success: false,
        error: 'Bank with this name or short name already exists'
      });
    }

    const result = await runQuery(`
      INSERT INTO banks (bankName, shortName, bankAddress, createdAt, updatedAt)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `, [bankName, shortName, bankAddress]);

    const newBank = await getRow(
      'SELECT * FROM banks WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      data: newBank
    } as ApiResponse<Bank>);
  } catch (error) {
    console.error('Error creating bank:', error);
    console.error('Error details:', {
      message: (error as any).message,
      stack: (error as any).stack,
      name: (error as any).name
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create bank'
    });
  }
});

// Update bank
router.put('/:id', authenticateToken, requireRole(['administrator', 'super_user']), validateId, validateRequest(bankSchema), async (req, res) => {
  try {
    const { bankName, shortName, bankAddress } = req.body;
    const bankId = req.params.id;

    // Check if bank exists
    const existingBank = await getRow(
      'SELECT id FROM banks WHERE id = ?',
      [bankId]
    );

    if (!existingBank) {
      return res.status(404).json({
        success: false,
        error: 'Bank not found'
      });
    }

    // Check if another bank has the same name or short name
    const duplicateBank = await getRow(
      'SELECT id FROM banks WHERE (bankName = ? OR shortName = ?) AND id != ?',
      [bankName, shortName, bankId]
    );

    if (duplicateBank) {
      return res.status(400).json({
        success: false,
        error: 'Bank with this name or short name already exists'
      });
    }

    await runQuery(`
      UPDATE banks 
      SET bankName = ?, shortName = ?, bankAddress = ?, updatedAt = datetime('now')
      WHERE id = ?
    `, [bankName, shortName, bankAddress, bankId]);

    const updatedBank = await getRow(
      'SELECT * FROM banks WHERE id = ?',
      [bankId]
    );

    res.json({
      success: true,
      data: updatedBank
    } as ApiResponse<Bank>);
  } catch (error) {
    console.error('Error updating bank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update bank'
    });
  }
});

// Delete bank
router.delete('/:id', authenticateToken, requireRole(['administrator', 'super_user']), validateId, async (req, res) => {
  try {
    const bankId = req.params.id;

    // Check if bank exists
    const existingBank = await getRow(
      'SELECT id FROM banks WHERE id = ?',
      [bankId]
    );

    if (!existingBank) {
      return res.status(404).json({
        success: false,
        error: 'Bank not found'
      });
    }

    // Check if bank is being used in members or payments
    const usedInMembers = await getRow(
      'SELECT id FROM members WHERE bankName = (SELECT bankName FROM banks WHERE id = ?) LIMIT 1',
      [bankId]
    );

    const usedInPayments = await getRow(
      'SELECT id FROM payments WHERE senderBank = (SELECT bankName FROM banks WHERE id = ?) OR receiverBank = (SELECT bankName FROM banks WHERE id = ?) LIMIT 1',
      [bankId, bankId]
    );

    if (usedInMembers || usedInPayments) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete bank as it is being used by members or payments'
      });
    }

    await runQuery('DELETE FROM banks WHERE id = ?', [bankId]);

    res.json({
      success: true,
      data: undefined
    } as ApiResponse<void>);
  } catch (error) {
    console.error('Error deleting bank:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete bank'
    });
  }
});

export default router; 