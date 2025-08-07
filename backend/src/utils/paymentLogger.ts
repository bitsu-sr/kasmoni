import { Database } from 'sqlite3';
import { PaymentLog, Payment, User } from '../types';

export class PaymentLogger {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // Log payment creation
  async logPaymentCreated(payment: Payment, user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'created',
      new_status: payment.status,
      new_amount: payment.amount,
      new_payment_date: payment.paymentDate,
      new_payment_month: payment.paymentMonth,
      new_payment_type: payment.paymentType,
      new_sender_bank: payment.senderBank,
      new_receiver_bank: payment.receiverBank,
      new_proof_of_payment: payment.proofOfPayment,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Payment created for member ${payment.memberId} in group ${payment.groupId}`
    };

    await this.insertLog(log);
  }

  // Log payment status change
  async logStatusChanged(
    payment: Payment, 
    oldStatus: string, 
    newStatus: string, 
    user: User, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'status_changed',
      old_status: oldStatus as any,
      new_status: newStatus as any,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Payment status changed from ${oldStatus} to ${newStatus}`
    };

    await this.insertLog(log);
  }

  // Log payment update
  async logPaymentUpdated(
    oldPayment: Payment, 
    newPayment: Payment, 
    user: User, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: newPayment.id,
      action: 'updated',
      old_amount: oldPayment.amount,
      new_amount: newPayment.amount,
      old_payment_date: oldPayment.paymentDate,
      new_payment_date: newPayment.paymentDate,
      old_payment_month: oldPayment.paymentMonth,
      new_payment_month: newPayment.paymentMonth,
      old_payment_type: oldPayment.paymentType,
      new_payment_type: newPayment.paymentType,
      old_sender_bank: oldPayment.senderBank,
      new_sender_bank: newPayment.senderBank,
      old_receiver_bank: oldPayment.receiverBank,
      new_receiver_bank: newPayment.receiverBank,
      old_proof_of_payment: oldPayment.proofOfPayment,
      new_proof_of_payment: newPayment.proofOfPayment,
      member_id: newPayment.memberId,
      group_id: newPayment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Payment details updated`
    };

    await this.insertLog(log);
  }

  // Log payment deletion (soft delete)
  async logPaymentDeleted(payment: Payment, user: User, ipAddress?: string, userAgent?: string, customDetails?: string): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'deleted',
      old_status: payment.status,
      old_amount: payment.amount,
      old_payment_date: payment.paymentDate,
      old_payment_month: payment.paymentMonth,
      old_payment_type: payment.paymentType,
      old_sender_bank: payment.senderBank,
      old_receiver_bank: payment.receiverBank,
      old_proof_of_payment: payment.proofOfPayment,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: customDetails || `Payment moved to trashbox`
    };

    await this.insertLog(log);
  }

  // Log bulk payment creation
  async logBulkPaymentCreated(
    payments: Payment[], 
    user: User, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const log: Partial<PaymentLog> = {
      action: 'bulk_created',
      bulk_payment_count: payments.length,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Bulk payment creation: ${payments.length} payments created`
    };

    await this.insertLog(log);
  }

  // Log payment restoration from trashbox or archive
  async logPaymentRestored(payment: Payment, user: User, ipAddress?: string, userAgent?: string, customDetails?: string): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'restored',
      new_status: payment.status,
      new_amount: payment.amount,
      new_payment_date: payment.paymentDate,
      new_payment_month: payment.paymentMonth,
      new_payment_type: payment.paymentType,
      new_sender_bank: payment.senderBank,
      new_receiver_bank: payment.receiverBank,
      new_proof_of_payment: payment.proofOfPayment,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: customDetails || `Payment restored from trashbox`
    };

    await this.insertLog(log);
  }

  // Log permanent deletion from trashbox
  async logPermanentlyDeleted(payment: Payment, user: User, ipAddress?: string, userAgent?: string): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'permanently_deleted',
      old_status: payment.status,
      old_amount: payment.amount,
      old_payment_date: payment.paymentDate,
      old_payment_month: payment.paymentMonth,
      old_payment_type: payment.paymentType,
      old_sender_bank: payment.senderBank,
      old_receiver_bank: payment.receiverBank,
      old_proof_of_payment: payment.proofOfPayment,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Payment permanently deleted from trashbox`
    };

    await this.insertLog(log);
  }

  // Log payment archiving
  async logPaymentArchived(
    payment: Payment, 
    user: User, 
    ipAddress?: string, 
    userAgent?: string, 
    archiveReason?: string
  ): Promise<void> {
    const log: Partial<PaymentLog> = {
      payment_id: payment.id,
      action: 'archived',
      old_status: payment.status,
      old_amount: payment.amount,
      old_payment_date: payment.paymentDate,
      old_payment_month: payment.paymentMonth,
      old_payment_type: payment.paymentType,
      old_sender_bank: payment.senderBank,
      old_receiver_bank: payment.receiverBank,
      old_proof_of_payment: payment.proofOfPayment,
      member_id: payment.memberId,
      group_id: payment.groupId,
      performed_by_user_id: user.id,
      performed_by_username: user.username,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: `Payment archived${archiveReason ? `: ${archiveReason}` : ''}`
    };

    await this.insertLog(log);
  }

  // Helper method to insert log into database
  private async insertLog(log: Partial<PaymentLog>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = Object.keys(log).filter(key => log[key as keyof PaymentLog] !== undefined);
      const values = fields.map(field => log[field as keyof PaymentLog]);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO payment_logs (${fields.join(', ')}) VALUES (${placeholders})`;
      
      this.db.run(query, values, function(err) {
        if (err) {
          console.error('Error inserting payment log:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
} 