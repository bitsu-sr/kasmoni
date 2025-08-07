import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

// Member validation schema
export const memberSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  birthDate: Joi.date().iso().required(),
  birthplace: Joi.string().max(100).optional(),
  address: Joi.string().max(200).optional(),
  city: Joi.string().max(100).optional(),
  phoneNumber: Joi.string().min(5).max(20).required(),
  email: Joi.string().email().optional(),
  nationalId: Joi.string().min(5).max(20).required(),
  nationality: Joi.string().max(50).optional(),
  occupation: Joi.string().max(100).optional(),
  bankName: Joi.string().max(100).optional(),
  accountNumber: Joi.string().max(50).optional(),
  registrationDate: Joi.date().iso().optional()
});

// Group validation schema
export const groupSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  monthlyAmount: Joi.number().positive().precision(2).required(),
  maxMembers: Joi.number().integer().min(2).max(12).default(12),
  duration: Joi.number().integer().min(2).max(12).required(),
  startMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
});

// Group Member validation schema
export const groupMemberSchema = Joi.object({
  memberId: Joi.number().integer().positive().required(),
  receiveMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).required()
});

// Payment validation schema
export const paymentSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  memberId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentDate: Joi.date().iso().required(),
  paymentMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  slot: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // The specific month/slot this payment is for
  paymentType: Joi.string().valid('cash', 'bank_transfer').required(),
  senderBank: Joi.when('paymentType', {
    is: 'bank_transfer',
    then: Joi.string().max(100).required(),
    otherwise: Joi.string().optional()
  }),
  receiverBank: Joi.when('paymentType', {
    is: 'bank_transfer',
    then: Joi.string().max(100).required(),
    otherwise: Joi.string().optional()
  }),
  status: Joi.string().valid('not_paid', 'pending', 'received', 'settled').default('not_paid'),
  proofOfPayment: Joi.string().optional()
});

// Payment status update schema
export const paymentStatusSchema = Joi.object({
  status: Joi.string().valid('not_paid', 'pending', 'received', 'settled').required()
});

// Bulk payment validation schema
export const bulkPaymentSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  paymentMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
  payments: Joi.array().items(Joi.object({
    memberId: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().precision(2).required(),
    paymentDate: Joi.date().iso().required(),
    slot: Joi.string().pattern(/^\d{4}-\d{2}$/).required(),
    paymentType: Joi.string().valid('cash', 'bank_transfer').required(),
    senderBank: Joi.when('paymentType', {
      is: 'bank_transfer',
      then: Joi.string().max(100).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    receiverBank: Joi.when('paymentType', {
      is: 'bank_transfer',
      then: Joi.string().max(100).required(),
      otherwise: Joi.string().allow('').optional()
    }),
    status: Joi.string().valid('not_paid', 'pending', 'received', 'settled').default('not_paid')
  })).min(1).required()
});

// Payment request validation schema (for member submissions)
export const paymentRequestSchema = Joi.object({
  groupId: Joi.number().integer().positive().required(),
  amount: Joi.number().positive().precision(2).required(),
  paymentDate: Joi.date().iso().required(),
  slot: Joi.string().pattern(/^\d{4}-\d{2}$/).required(), // The specific month/slot this payment is for
  paymentType: Joi.string().valid('cash', 'bank_transfer').required(),
  senderBank: Joi.when('paymentType', {
    is: 'bank_transfer',
    then: Joi.string().max(100).required(),
    otherwise: Joi.string().optional()
  }),
  receiverBank: Joi.when('paymentType', {
    is: 'bank_transfer',
    then: Joi.string().max(100).required(),
    otherwise: Joi.string().optional()
  }),
  proofOfPayment: Joi.string().optional(),
  requestNotes: Joi.string().max(500).optional()
});

// Payment request review schema (for admin review)
export const paymentRequestReviewSchema = Joi.object({
  status: Joi.string().valid('approved', 'rejected').required(),
  adminNotes: Joi.string().max(500).optional(),
  // Allow admins to modify any field before approval
  groupId: Joi.number().integer().positive().optional(),
  amount: Joi.number().positive().precision(2).optional(),
  paymentDate: Joi.date().iso().optional(),
  paymentMonth: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  slot: Joi.string().pattern(/^\d{4}-\d{2}$/).optional(),
  paymentType: Joi.string().valid('cash', 'bank_transfer').optional(),
  senderBank: Joi.string().max(100).optional(),
  receiverBank: Joi.string().max(100).optional(),
  proofOfPayment: Joi.string().optional()
});

// Bank validation schema
export const bankSchema = Joi.object({
  bankName: Joi.string().min(2).max(100).required(),
  shortName: Joi.string().min(2).max(20).required(),
  bankAddress: Joi.string().min(5).max(200).required()
});

// Validation middleware
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    
    next();
  };
};

// ID validation middleware
export const validateId = (req: Request, res: Response, next: NextFunction) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid ID parameter'
    });
  }
  
  req.params.id = id.toString();
  next();
}; 