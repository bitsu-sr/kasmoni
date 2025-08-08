import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calculator, Users2, Download } from 'lucide-react';
import { groupsApi } from '../services/api';
import { Group } from '../types';
import ToggleSwitch from '../components/ToggleSwitch';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PayoutDetailsState {
  group: Group | null;
  currentRecipient: {
    firstName: string;
    lastName: string;
    nationalId: string;
    bankName: string;
    accountNumber: string;
  } | null;
  lastSlotPaid: boolean;
  adminFeePaid: boolean;
  adminFee: number;
  calculation: {
    baseAmount: number;
    lastSlotDeduction: number;
    adminFeeDeduction: number;
    totalAmount: number;
  };
}

const PayoutDetails: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PayoutDetailsState>({
    group: null,
    currentRecipient: null,
    lastSlotPaid: false,
    adminFeePaid: false,
    adminFee: 200, // Default SRD 200
    calculation: {
      baseAmount: 0,
      lastSlotDeduction: 0,
      adminFeeDeduction: 0,
      totalAmount: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const payoutFormRef = useRef<HTMLDivElement>(null);

  const fetchGroupDetails = async () => {
    if (!groupId) {
      setError('Invalid group ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await groupsApi.getById(parseInt(groupId));
      const group = response.data.data;
      if (!group) {
        setError('Group not found');
        return;
      }
      
      // Find current month's recipient
      const currentDate = new Date();
      const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const currentYear = currentDate.getFullYear().toString();
      const currentMonthYear = `${currentYear}-${currentMonth}`;
      
      const currentRecipient = group.members?.find((member: any) => 
        member.receiveMonth === currentMonthYear
      ) || null;

      setState(prev => ({
        ...prev,
        group,
        currentRecipient: currentRecipient ? {
          firstName: currentRecipient.firstName || '',
          lastName: currentRecipient.lastName || '',
          nationalId: currentRecipient.nationalId || 'N/A',
          bankName: currentRecipient.bankName || 'N/A',
          accountNumber: currentRecipient.accountNumber || 'N/A'
        } : null
      }));
      setError(null);
    } catch (err) {
      setError('Failed to load group details');
      console.error('Error fetching group details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  // Calculate totals whenever relevant values change
  useEffect(() => {
    if (!state.group) return;

    const baseAmount = state.group.monthlyAmount * state.group.duration;
    const lastSlotDeduction = state.lastSlotPaid ? 0 : state.group.monthlyAmount;
    const adminFeeDeduction = state.adminFeePaid ? 0 : state.adminFee;
    const totalAmount = baseAmount - lastSlotDeduction - adminFeeDeduction;

    setState(prev => ({
      ...prev,
      calculation: {
        baseAmount,
        lastSlotDeduction,
        adminFeeDeduction,
        totalAmount
      }
    }));
  }, [state.group, state.lastSlotPaid, state.adminFeePaid, state.adminFee]);

  const handleLastSlotToggle = (checked: boolean) => {
    setState(prev => ({
      ...prev,
      lastSlotPaid: checked
    }));
  };

  const handleAdminFeeToggle = (checked: boolean) => {
    setState(prev => ({
      ...prev,
      adminFeePaid: checked
    }));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SRD',
    }).format(amount);
  };

  const formatPayoutDate = (): string => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[now.getDay()];
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${dayName}, ${year}-${month}-${day}`;
  };

  const handleBackClick = () => {
    navigate('/payouts');
  };

  const generatePDF = async () => {
    if (!payoutFormRef.current) return;

    try {
      // Add a small delay to ensure all content is rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(payoutFormRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `payout_${state.group?.name}_${state.currentRecipient?.firstName}_${state.currentRecipient?.lastName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="d-flex justify-center align-center" style={{ minHeight: '200px' }}>
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !state.group) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Error</h2>
            <p>{error || 'Group not found'}</p>
            <button className="btn btn-primary" onClick={handleBackClick}>
              Back to Payouts
            </button>
          </div>
        </div>
      </div>
    );
  }

    return (
    <>
      <div className="container">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-between align-center">
              <div className="d-flex align-center gap-3">
                <button 
                  className="btn btn-outline"
                  onClick={handleBackClick}
                  style={{ padding: '8px', minWidth: 'auto' }}
                >
                  <ArrowLeft size={16} />
                </button>
                               <div>
                   <h1 className="card-title">Payout Details</h1>
                   <p>Calculate the payout amount for {state.currentRecipient ? `${state.currentRecipient.firstName} ${state.currentRecipient.lastName}` : 'the recipient'} from {state.group.name}</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="card-body">
            {/* Group Information */}
            <div className="group-info-section">
              <h3>Group Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Group Name:</strong>
                  <span>{state.group.name}</span>
                </div>
                <div className="info-item">
                  <strong>Monthly Amount:</strong>
                  <span>{formatCurrency(state.group.monthlyAmount)}</span>
                </div>
                <div className="info-item">
                  <strong>Duration:</strong>
                  <span>{state.group.duration} months</span>
                </div>
                <div className="info-item">
                  <strong>Administration Fee:</strong>
                  <span>{formatCurrency(state.adminFee)}</span>
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="recipient-info-section">
              <h3>Recipient Information</h3>
              {state.currentRecipient ? (
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Recipient Name:</strong>
                    <span>{state.currentRecipient.firstName} {state.currentRecipient.lastName}</span>
                  </div>
                  <div className="info-item">
                    <strong>National ID:</strong>
                    <span>{state.currentRecipient.nationalId}</span>
                  </div>
                  <div className="info-item">
                    <strong>Bank:</strong>
                    <span>{state.currentRecipient.bankName}</span>
                  </div>
                  <div className="info-item">
                    <strong>Account Number:</strong>
                    <span>{state.currentRecipient.accountNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="no-recipient">
                  <p>No recipient assigned for the current month</p>
                </div>
              )}
            </div>

            {/* Toggle Switches */}
            <div className="toggle-section">
              <h3>Payment Status</h3>
              <div className="toggle-grid">
                <ToggleSwitch
                  label="Last Slot"
                  checked={state.lastSlotPaid}
                  onChange={handleLastSlotToggle}
                  className="toggle-switch-large"
                />
                <ToggleSwitch
                  label="Administration Fee"
                  checked={state.adminFeePaid}
                  onChange={handleAdminFeeToggle}
                  className="toggle-switch-large"
                />
              </div>
            </div>

                       {/* Calculation Breakdown */}
             <div className="calculation-section">
               <h3>Calculation Breakdown</h3>
               <div className="calculation-grid">
                 <div className="calculation-item">
                   <span>Base Amount:</span>
                   <span>{formatCurrency(state.calculation.baseAmount)}</span>
                 </div>
                 <div className={`calculation-item ${state.calculation.lastSlotDeduction > 0 ? 'deduction' : 'no-deduction'}`}>
                   <span>Last Slot Deduction:</span>
                   <span>-{formatCurrency(state.calculation.lastSlotDeduction)}</span>
                 </div>
                 <div className={`calculation-item ${state.calculation.adminFeeDeduction > 0 ? 'deduction' : 'no-deduction'}`}>
                   <span>Administration Fee Deduction:</span>
                   <span>-{formatCurrency(state.calculation.adminFeeDeduction)}</span>
                 </div>
                 <div className="calculation-item total">
                   <span>Total Amount:</span>
                   <span>{formatCurrency(state.calculation.totalAmount)}</span>
                 </div>
               </div>
             </div>

                                                 {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  className="btn btn-secondary"
                  onClick={handleBackClick}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowPayoutForm(true)}
                >
                  Payout
                </button>
              </div>
           </div>
         </div>
       </div>

               {/* Payout Form Modal */}
                 {showPayoutForm && (
           <PayoutForm 
             state={state}
             formatCurrency={formatCurrency}
             formatPayoutDate={formatPayoutDate}
             onClose={() => setShowPayoutForm(false)}
             generatePDF={generatePDF}
             payoutFormRef={payoutFormRef}
           />
         )}
     </>
   );
  };

     // Payout Form Component
   const PayoutForm: React.FC<{
     state: PayoutDetailsState;
     formatCurrency: (amount: number) => string;
     formatPayoutDate: () => string;
     onClose: () => void;
     generatePDF: () => void;
     payoutFormRef: React.RefObject<HTMLDivElement | null>;
   }> = ({ state, formatCurrency, formatPayoutDate, onClose, generatePDF, payoutFormRef }) => {
    return (
      <div className="payout-form-overlay">
        <div className="payout-form-modal">
                     <div className="payout-form-header">
             <div className="payout-form-actions">
               <button 
                 className="btn btn-primary"
                 onClick={generatePDF}
               >
                 <Download size={16} />
                 Save to PDF
               </button>
               <button 
                 className="btn-close"
                 onClick={onClose}
               >
                 ×
               </button>
             </div>
           </div>
          
                     <div className="payout-form-content" ref={payoutFormRef}>
                         {/* Logo and Title */}
             <div className="payout-form-logo">
               <img src="/logokasmonigr.png" alt="Sranan Kasmoni" className="payout-logo" />
               <h1 className="payout-title">Sranan Kasmoni</h1>
             </div>

                                       {/* Payout Details Header */}
              <div className="payout-details-header">
                <h2>Payout Details of {state.currentRecipient ? `${state.currentRecipient.firstName} ${state.currentRecipient.lastName}` : 'the recipient'} from {state.group?.name}</h2>
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px 16px', 
                  backgroundColor: '#f0f0f0', 
                  border: '1px solid #000000', 
                  borderRadius: '4px', 
                  display: 'inline-block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#000000'
                }}>
                  <strong>Payout Date: </strong>
                  <span>{formatPayoutDate()}</span>
                </div>
              </div>

             

            {/* Group Information */}
            <div className="payout-section">
              <h3>Group Information</h3>
              <div className="payout-info-grid">
                <div className="payout-info-item">
                  <strong>Group Name:</strong>
                  <span>{state.group?.name}</span>
                </div>
                <div className="payout-info-item">
                  <strong>Monthly Amount:</strong>
                  <span>{formatCurrency(state.group?.monthlyAmount || 0)}</span>
                </div>
                <div className="payout-info-item">
                  <strong>Duration:</strong>
                  <span>{state.group?.duration} months</span>
                </div>
                <div className="payout-info-item">
                  <strong>Administration Fee:</strong>
                  <span>{formatCurrency(state.adminFee)}</span>
                </div>
              </div>
            </div>

            {/* Recipient Information */}
            <div className="payout-section">
              <h3>Recipient Information</h3>
              {state.currentRecipient ? (
                <div className="payout-info-grid">
                  <div className="payout-info-item">
                    <strong>Recipient Name:</strong>
                    <span>{state.currentRecipient.firstName} {state.currentRecipient.lastName}</span>
                  </div>
                  <div className="payout-info-item">
                    <strong>National ID:</strong>
                    <span>{state.currentRecipient.nationalId}</span>
                  </div>
                  <div className="payout-info-item">
                    <strong>Bank:</strong>
                    <span>{state.currentRecipient.bankName}</span>
                  </div>
                  <div className="payout-info-item">
                    <strong>Account Number:</strong>
                    <span>{state.currentRecipient.accountNumber}</span>
                  </div>
                </div>
              ) : (
                <div className="no-recipient">
                  <p>No recipient assigned for the current month</p>
                </div>
              )}
            </div>

            {/* Calculation Breakdown */}
            <div className="payout-section">
              <h3>Calculation Breakdown</h3>
              <div className="payout-calculation-grid">
                <div className="payout-calculation-item">
                  <span>Base Amount:</span>
                  <span>{formatCurrency(state.calculation.baseAmount)}</span>
                </div>
                <div className={`payout-calculation-item ${state.calculation.lastSlotDeduction > 0 ? 'deduction' : 'no-deduction'}`}>
                  <span>Last Slot Deduction:</span>
                  <span>-{formatCurrency(state.calculation.lastSlotDeduction)}</span>
                </div>
                <div className={`payout-calculation-item ${state.calculation.adminFeeDeduction > 0 ? 'deduction' : 'no-deduction'}`}>
                  <span>Administration Fee Deduction:</span>
                  <span>-{formatCurrency(state.calculation.adminFeeDeduction)}</span>
                </div>
                <div className="payout-calculation-item total">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(state.calculation.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

export default PayoutDetails; 