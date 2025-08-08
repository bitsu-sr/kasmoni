import React, { useState, useRef } from 'react';
import { X, Edit, Trash2, Save, XCircle, Download } from 'lucide-react';
import { Payment, Group, Bank } from '../types';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { paymentsApi } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PaymentDetailsModalProps {
  payment: Payment | null;
  onClose: () => void;
  onPaymentUpdated: () => void;
  onPaymentDeleted: () => void;
}

const PaymentDetailsModal: React.FC<PaymentDetailsModalProps> = ({
  payment,
  onClose,
  onPaymentUpdated,
  onPaymentDeleted
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);

  const [editData, setEditData] = useState({
    amount: payment?.amount || 0,
    paymentDate: payment?.paymentDate || '',
    paymentMonth: payment?.paymentMonth || '',
    slot: payment?.slot || '',
    paymentType: payment?.paymentType || 'bank_transfer',
    senderBank: payment?.senderBank || '',
    receiverBank: payment?.receiverBank || '',
    status: payment?.status || 'not_paid',
    proofOfPayment: payment?.proofOfPayment || ''
  });

  const isAdmin = user?.role === 'administrator' || user?.role === 'super_user';

  // Update editData when payment changes
  React.useEffect(() => {
    if (payment) {
      setEditData({
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        paymentMonth: payment.paymentMonth,
        slot: payment.slot,
        paymentType: payment.paymentType,
        senderBank: payment.senderBank || '',
        receiverBank: payment.receiverBank || '',
        status: payment.status,
        proofOfPayment: payment.proofOfPayment || ''
      });
    }
  }, [payment]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    if (!payment) return;

    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.update(payment.id, {
        ...payment,
        ...editData
      });

      if (response.data.success) {
        setSuccessMessage('Payment updated successfully!');
        setIsEditing(false);
        onPaymentUpdated();
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError(response.data.error || 'Failed to update payment');
      }
    } catch (err) {
      setError('Error updating payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment) return;

    if (!confirm(`Are you sure you want to delete this payment? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await paymentsApi.delete(payment.id);

      if (response.data.success) {
        setSuccessMessage('Payment deleted successfully!');
        onPaymentDeleted();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(response.data.error || 'Failed to delete payment');
      }
    } catch (err) {
      setError('Error deleting payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      'not_paid': 'badge-danger',
      'pending': 'badge-warning',
      'received': 'badge-success',
      'settled': 'badge-info'
    };
    
    return (
      <span className={`badge ${statusClasses[status as keyof typeof statusClasses] || 'badge-secondary'}`}>
        {status === 'received' ? 'Received' :
         status === 'pending' ? 'Pending' :
         status === 'settled' ? 'Settled' :
         'Not Paid'}
      </span>
    );
  };

  const getPaymentTypeBadge = (type: string) => {
    return (
      <span className={`badge ${type === 'cash' ? 'badge-success' : 'badge-info'}`}>
        {type === 'cash' ? 'Cash' : 'Bank Transfer'}
      </span>
    );
  };

  const canExportPDF = () => {
    return payment?.status === 'received' || payment?.status === 'settled';
  };

  const exportToPDF = async () => {
    if (!payment || !contentRef.current) return;

    setPdfLoading(true);
    setError(null);

    try {
             // Temporarily apply PDF styles
       const contentElement = contentRef.current;
       const originalClasses = contentElement.className;
       contentElement.setAttribute('data-pdf', 'true');
       contentElement.className = originalClasses + ' pdf-export';
       
       // Show PDF header
       const pdfHeader = contentElement.querySelector('.pdf-header') as HTMLElement;
       if (pdfHeader) {
         pdfHeader.style.display = 'block';
         // Ensure the header is visible and properly styled
         pdfHeader.style.visibility = 'visible';
         pdfHeader.style.position = 'static';
       }

             const canvas = await html2canvas(contentRef.current, {
         scale: 1.5,
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff',
         width: 800,
         height: 700, // Increased height to accommodate header
         logging: false,
         imageTimeout: 15000
       });

             // Restore original styles
       contentElement.removeAttribute('data-pdf');
       contentElement.className = originalClasses;
       
       // Hide PDF header
       if (pdfHeader) {
         pdfHeader.style.display = 'none';
       }

             const imgData = canvas.toDataURL('image/png');
       const pdf = new jsPDF('p', 'mm', 'a4');
       
       const imgWidth = 190; // Slightly smaller to fit better
       const pageHeight = 280; // Leave some margin
       const imgHeight = (canvas.height * imgWidth) / canvas.width;
       
       // Calculate if it fits on one page
       if (imgHeight <= pageHeight) {
         // Fit on one page
         const yOffset = (pageHeight - imgHeight) / 2; // Center vertically
         pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, imgHeight);
       } else {
         // Split across pages if needed
         let heightLeft = imgHeight;
         let position = 0;
         
         pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
         heightLeft -= pageHeight;
         
         while (heightLeft >= 0) {
           position = heightLeft - imgHeight;
           pdf.addPage();
           pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
           heightLeft -= pageHeight;
         }
       }

      const fileName = `payment_${payment.id}_${payment.member?.firstName}_${payment.member?.lastName}_${formatPaymentDate(payment.paymentDate).replace(/\//g, '-')}.pdf`;
      pdf.save(fileName);

      setSuccessMessage('PDF exported successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      setError('Error generating PDF');
      console.error('PDF generation error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (!payment) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Payment Details</h3>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            {successMessage}
          </div>
        )}

                 <div className="modal-body">
           <div className="payment-details-grid" ref={contentRef}>
             {/* PDF Header - only visible in PDF */}
             <div className="pdf-header" style={{ display: 'none' }}>
               <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                 <img 
                   src="/logokasmonigr.png" 
                   alt="Sranan Kasmoni Logo" 
                   style={{ 
                     width: '60px', 
                     height: '60px', 
                     marginBottom: '8px' 
                   }} 
                 />
                 <h1 style={{ 
                   color: '#217346', 
                   fontSize: '24px', 
                   fontWeight: 'bold', 
                   margin: '8px 0',
                   fontFamily: 'Arial, sans-serif'
                 }}>
                   Sranan Kasmoni
                 </h1>
                 <h2 style={{ 
                   color: '#217346', 
                   fontSize: '18px', 
                   marginBottom: '8px',
                   fontFamily: 'Arial, sans-serif'
                 }}>
                   Payment Receipt
                 </h2>
                 <p style={{ 
                   color: '#6c757d', 
                   fontSize: '12px', 
                   margin: '4px 0',
                   fontFamily: 'Arial, sans-serif'
                 }}>
                   Generated on: {new Date().toLocaleDateString('en-CA', { 
                     year: 'numeric', 
                     month: '2-digit', 
                     day: '2-digit',
                     hour: '2-digit',
                     minute: '2-digit',
                     second: '2-digit',
                     timeZone: 'America/Paramaribo'
                   }).replace(',', '')}
                 </p>
               </div>
               <hr style={{ border: '1px solid #dee2e6', marginBottom: '12px' }} />
             </div>
            {/* Basic Information */}
            <div className="detail-section">
              <h4>Basic Information</h4>
              <div className="detail-row">
                <span className="detail-label">Member:</span>
                <span className="detail-value">
                  {payment.member?.firstName} {payment.member?.lastName}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Group:</span>
                <span className="detail-value">{payment.group?.name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="number"
                      name="amount"
                      value={editData.amount}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                      step="0.01"
                      min="0"
                    />
                  ) : (
                    `SRD ${payment.amount.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <select
                      name="status"
                      value={editData.status}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    >
                      <option value="not_paid">Not Paid</option>
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                      <option value="settled">Settled</option>
                    </select>
                  ) : (
                    getStatusBadge(payment.status)
                  )}
                </span>
              </div>
            </div>

            {/* Payment Information */}
            <div className="detail-section">
              <h4>Payment Information</h4>
              <div className="detail-row">
                <span className="detail-label">Payment Date:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="date"
                      name="paymentDate"
                      value={editData.paymentDate}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    />
                  ) : (
                    formatPaymentDate(payment.paymentDate)
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Month:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="month"
                      name="paymentMonth"
                      value={editData.paymentMonth}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    />
                  ) : (
                    payment.paymentMonth ? formatMonthYear(payment.paymentMonth) : '-'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Receive Month:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="month"
                      name="slot"
                      value={editData.slot}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    />
                  ) : (
                    payment.slot ? formatMonthYear(payment.slot) : '-'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Payment Type:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <select
                      name="paymentType"
                      value={editData.paymentType}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  ) : (
                    getPaymentTypeBadge(payment.paymentType)
                  )}
                </span>
              </div>
            </div>

            {/* Bank Information */}
            <div className="detail-section">
              <h4>Bank Information</h4>
              <div className="detail-row">
                <span className="detail-label">Sender's Bank:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="text"
                      name="senderBank"
                      value={editData.senderBank}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                      placeholder="Enter sender's bank"
                    />
                  ) : (
                    payment.senderBank || '-'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Receiver's Bank:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="text"
                      name="receiverBank"
                      value={editData.receiverBank}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                      placeholder="Enter receiver's bank"
                    />
                  ) : (
                    payment.receiverBank || '-'
                  )}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Proof of Payment:</span>
                <span className="detail-value">
                  {isEditing ? (
                    <input
                      type="text"
                      name="proofOfPayment"
                      value={editData.proofOfPayment}
                      onChange={handleInputChange}
                      className="form-control form-control-sm"
                      placeholder="Enter proof of payment"
                    />
                  ) : (
                    payment.proofOfPayment || '-'
                  )}
                </span>
              </div>
            </div>

            {/* System Information */}
            <div className="detail-section">
              <h4>System Information</h4>
              <div className="detail-row">
                <span className="detail-label">Created:</span>
                <span className="detail-value">
                  {payment.createdAt ? formatPaymentDate(payment.createdAt) : '-'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">
                  {payment.updatedAt ? formatPaymentDate(payment.updatedAt) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          {canExportPDF() && !isEditing && (
            <button
              className="btn btn-success"
              onClick={exportToPDF}
              disabled={pdfLoading}
            >
              <Download size={16} className="me-1" />
              {pdfLoading ? 'Generating PDF...' : 'Export to PDF'}
            </button>
          )}

          {isAdmin && !isEditing && (
            <>
              <button
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
                disabled={loading}
                style={{ 
                  padding: '0.5rem 1rem', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Edit size={16} />
                Edit Payment
              </button>
              <button
                className="btn btn-danger"
                onClick={() => setIsDeleting(true)}
                disabled={loading}
                style={{ 
                  padding: '0.5rem 1rem', 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={16} />
                Delete Payment
              </button>
            </>
          )}

          {isAdmin && isEditing && (
            <>
              <button
                className="btn btn-success"
                onClick={handleSave}
                disabled={loading}
              >
                <Save size={16} className="me-1" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn btn-secondary"
                                 onClick={() => {
                   setIsEditing(false);
                   setEditData({
                     amount: payment.amount,
                     paymentDate: payment.paymentDate,
                     paymentMonth: payment.paymentMonth,
                     slot: payment.slot,
                     paymentType: payment.paymentType,
                     senderBank: payment.senderBank || '',
                     receiverBank: payment.receiverBank || '',
                     status: payment.status,
                     proofOfPayment: payment.proofOfPayment || ''
                   });
                 }}
                disabled={loading}
              >
                <XCircle size={16} className="me-1" />
                Cancel
              </button>
            </>
          )}

          <button
            className="btn btn-outline-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsModal; 