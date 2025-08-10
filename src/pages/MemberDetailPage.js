import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, User, Phone, Mail, MapPin, Calendar, CreditCard, Building } from 'lucide-react';
import { membersApi, paymentsApi } from '../services/api';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';
import Pagination from '../components/Pagination';

const MemberDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [payments, setPayments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (id) {
      fetchMemberData();
    }
  }, [id]);

  const fetchMemberData = async () => {
    try {
      setLoading(true);
      const [memberResponse, paymentsResponse, slotsResponse] = await Promise.all([
        membersApi.getById(parseInt(id)),
        paymentsApi.getByMemberId(parseInt(id)),
        membersApi.getSlots(parseInt(id))
      ]);

      if (memberResponse.data.success) {
        setMember(memberResponse.data.data);
      }

      if (paymentsResponse.data.success) {
        setPayments(paymentsResponse.data.data);
      }

      if (slotsResponse.data.success) {
        setSlots(slotsResponse.data.data);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load member data');
      console.error('Error fetching member data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) {
      return;
    }

    try {
      await membersApi.delete(parseInt(id));
      navigate('/members');
    } catch (err) {
      setError('Failed to delete member');
      console.error('Error deleting member:', err);
    }
  };

  const handleEdit = () => {
    navigate(`/members/${id}/edit`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Calculate pagination for payments
  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = payments.slice(startIndex, endIndex);

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
            onClick={() => navigate('/members')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Member not found</div>
          <button
            onClick={() => navigate('/members')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/members')}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Members</span>
          </button>
          <div className="h-8 w-px bg-gray-300"></div>
          <h1 className="text-3xl font-bold text-gray-900">Member Details</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleEdit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Member Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <User className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
              <p className="text-lg font-semibold text-gray-900">
                {member.firstName} {member.lastName}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Phone className="h-6 w-6 text-green-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone Number</h3>
              <p className="text-lg font-semibold text-gray-900">{member.phoneNumber}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Mail className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p className="text-lg font-semibold text-gray-900">{member.email || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="h-6 w-6 text-orange-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Birth Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {member.birthDate ? new Date(member.birthDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="h-6 w-6 text-red-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p className="text-lg font-semibold text-gray-900">
                {member.address}, {member.city}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Building className="h-6 w-6 text-indigo-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Birthplace</h3>
              <p className="text-lg font-semibold text-gray-900">{member.birthplace}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <CreditCard className="h-6 w-6 text-teal-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Bank Details</h3>
              <p className="text-lg font-semibold text-gray-900">
                {member.bankName} - {member.accountNumber}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Calendar className="h-6 w-6 text-gray-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Registration Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {member.registrationDate ? new Date(member.registrationDate).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-6 w-6 text-gray-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">National ID</h3>
              <p className="text-lg font-semibold text-gray-900">{member.nationalId}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-6 w-6 text-gray-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nationality</h3>
              <p className="text-lg font-semibold text-gray-900">{member.nationality}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <User className="h-6 w-6 text-gray-600 mt-1" />
            <div>
              <h3 className="text-sm font-medium text-gray-500">Occupation</h3>
              <p className="text-lg font-semibold text-gray-900">{member.occupation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payments ({payments.length})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'slots'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Slots ({slots.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {member.createdAt ? new Date(member.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {member.updatedAt ? new Date(member.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Payment History</h3>
              {payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.group?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${payment.amount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentMonth ? formatMonthYear(payment.paymentMonth) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              payment.status === 'settled' ? 'bg-green-100 text-green-800' :
                              payment.status === 'received' ? 'bg-blue-100 text-blue-800' :
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status?.replace('_', ' ').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.paymentDate ? formatPaymentDate(payment.paymentDate) : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No payments found for this member.</p>
                </div>
              )}

              {/* Pagination for payments */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    itemsPerPage={itemsPerPage}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    totalItems={payments.length}
                  />
                </div>
              )}
            </div>
          )}

          {/* Slots Tab */}
          {activeTab === 'slots' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Group Slots</h3>
              {slots.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Group
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monthly Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Receive Month
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {slots.map((slot) => (
                        <tr key={`${slot.groupId}-${slot.slot}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {slot.groupName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${slot.monthlyAmount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slot.duration} months
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {slot.receiveMonth ? formatMonthYear(slot.receiveMonth) : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${slot.totalAmount?.toLocaleString() || '0'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              slot.paymentStatus === 'fully_paid' ? 'bg-green-100 text-green-800' :
                              slot.paymentStatus === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {slot.paymentStatus?.replace('_', ' ').toUpperCase() || 'N/A'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No group slots found for this member.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemberDetailPage;
