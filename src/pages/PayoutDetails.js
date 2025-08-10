import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, DollarSign, Calendar, User, Building, CreditCard, CheckCircle } from 'lucide-react';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';

const PayoutDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payout, setPayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPayoutDetails();
    }
  }, [id]);

  const fetchPayoutDetails = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockPayout = {
        id: parseInt(id),
        memberName: 'John Doe',
        memberId: 123,
        groupName: 'Group A',
        groupId: 456,
        monthlyAmount: 1000,
        totalAmount: 12000,
        duration: 12,
        startMonth: '2024-01',
        endMonth: '2024-12',
        receiveMonth: '2024-06',
        status: 'completed',
        paymentDate: '2024-06-15',
        bankName: 'DSB Bank',
        accountNumber: '1234-5678-9012-3456',
        member: {
          firstName: 'John',
          lastName: 'Doe',
          phoneNumber: '+1234567890',
          email: 'john.doe@example.com',
          address: '123 Main St',
          city: 'New York',
          nationalId: 'NY123456789'
        },
        group: {
          name: 'Group A',
          monthlyAmount: 1000,
          maxMembers: 12,
          duration: 12
        },
        payments: [
          {
            id: 1,
            amount: 1000,
            paymentMonth: '2024-01',
            status: 'settled',
            paymentDate: '2024-01-15'
          },
          {
            id: 2,
            amount: 1000,
            paymentMonth: '2024-02',
            status: 'settled',
            paymentDate: '2024-02-15'
          },
          {
            id: 3,
            amount: 1000,
            paymentMonth: '2024-03',
            status: 'settled',
            paymentDate: '2024-03-15'
          },
          {
            id: 4,
            amount: 1000,
            paymentMonth: '2024-04',
            status: 'settled',
            paymentDate: '2024-04-15'
          },
          {
            id: 5,
            amount: 1000,
            paymentMonth: '2024-05',
            status: 'settled',
            paymentDate: '2024-05-15'
          }
        ]
      };
      
      setPayout(mockPayout);
      setError(null);
    } catch (err) {
      setError('Failed to load payout details');
      console.error('Error fetching payout details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Implement PDF download functionality
    console.log('Downloading payout details...');
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'N/A'}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusClasses = {
      'settled': 'bg-green-100 text-green-800',
      'received': 'bg-blue-100 text-blue-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'not_paid': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'N/A'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">{error}</div>
          <button
            onClick={() => navigate('/payouts')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Payouts
          </button>
        </div>
      </div>
    );
  }

  if (!payout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Payout not found</div>
          <button
            onClick={() => navigate('/payouts')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Payouts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 print:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/payouts')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Payouts</span>
          </button>
          <div className="h-8 w-px bg-gray-300"></div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Details</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handlePrint}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Payout Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Payout Summary</h2>
          {getStatusBadge(payout.status)}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${payout.totalAmount?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500">Total Payout Amount</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${payout.monthlyAmount?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-gray-500">Monthly Contribution</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {payout.duration || '0'}
            </div>
            <div className="text-sm text-gray-500">Duration (Months)</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {payout.receiveMonth ? formatMonthYear(payout.receiveMonth) : 'N/A'}
            </div>
            <div className="text-sm text-gray-500">Receive Month</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Member Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 text-blue-600 mr-2" />
            Member Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Full Name:</span>
              <span className="text-sm text-gray-900">{payout.memberName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Phone:</span>
              <span className="text-sm text-gray-900">{payout.member?.phoneNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <span className="text-sm text-gray-900">{payout.member?.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Address:</span>
              <span className="text-sm text-gray-900">
                {payout.member?.address}, {payout.member?.city}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">National ID:</span>
              <span className="text-sm text-gray-900">{payout.member?.nationalId || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Group Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building className="h-5 w-5 text-green-600 mr-2" />
            Group Information
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Group Name:</span>
              <span className="text-sm text-gray-900">{payout.groupName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Monthly Amount:</span>
              <span className="text-sm text-gray-900">${payout.monthlyAmount?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Max Members:</span>
              <span className="text-sm text-gray-900">{payout.group?.maxMembers || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Start Month:</span>
              <span className="text-sm text-gray-900">
                {payout.startMonth ? formatMonthYear(payout.startMonth) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">End Month:</span>
              <span className="text-sm text-gray-900">
                {payout.endMonth ? formatMonthYear(payout.endMonth) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 print:shadow-none print:border-0">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CreditCard className="h-5 w-5 text-purple-600 mr-2" />
          Bank Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Bank Name:</span>
              <span className="text-sm text-gray-900">{payout.bankName || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Account Number:</span>
              <span className="text-sm text-gray-900 font-mono">{payout.accountNumber || 'N/A'}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Payment Date:</span>
              <span className="text-sm text-gray-900">
                {payout.paymentDate ? formatPaymentDate(payout.paymentDate) : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-500">Payout ID:</span>
              <span className="text-sm text-gray-900 font-mono">#{payout.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:shadow-none print:border-0">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          Payment History
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payout.payments?.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentMonth ? formatMonthYear(payment.paymentMonth) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${payment.amount?.toLocaleString() || '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.paymentDate ? formatPaymentDate(payment.paymentDate) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPaymentStatusBadge(payment.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {(!payout.payments || payout.payments.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-500">No payment history available.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500 print:mt-4">
        <p>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
        <p>Kasmoni - Rotating Savings Management System</p>
      </div>
    </div>
  );
};

export default PayoutDetails;
