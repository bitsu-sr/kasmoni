import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Search, Filter, AlertTriangle, Calendar, User, DollarSign } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const PaymentsTrashbox = () => {
  const { user, isAuthenticated } = useAuth();
  const [trashboxPayments, setTrashboxPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Multi-select state
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter state
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'administrator' || user?.role === 'super_user')) {
      fetchTrashboxPayments();
    }
  }, [user, isAuthenticated]);

  const fetchTrashboxPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getTrashbox();
      
      if (response.data.success && response.data.data) {
        setTrashboxPayments(response.data.data);
        setFilteredPayments(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch trashbox payments');
      }
    } catch (err) {
      console.error('Error fetching trashbox payments:', err);
      setError('Error loading trashbox payments');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterType === 'all' || !filterValue.trim()) {
      setFilteredPayments(trashboxPayments);
      return;
    }

    const filtered = trashboxPayments.filter(payment => {
      const searchValue = filterValue.toLowerCase().trim();
      
      switch (filterType) {
        case 'memberName':
          const memberName = payment.member ? 
            `${payment.member.firstName} ${payment.member.lastName}`.toLowerCase() : '';
          return memberName.includes(searchValue);
        
        case 'groupName':
          return payment.group && 
                 payment.group.name.toLowerCase().includes(searchValue);
        
        case 'deletedBy':
          return payment.deleted_by_username && 
                 payment.deleted_by_username.toLowerCase().includes(searchValue);
        
        default:
          return true;
      }
    });

    setFilteredPayments(filtered);
    setCurrentPage(1); // Reset to first page when filters change
    clearSelections();
  };

  const handleFilterChange = (type, value = '') => {
    setFilterType(type);
    setFilterValue(value);
    
    if (type === 'all' || !value.trim()) {
      setFilteredPayments(trashboxPayments);
    } else {
      const filtered = trashboxPayments.filter(payment => {
        const searchValue = value.toLowerCase().trim();
        
        switch (type) {
          case 'memberName':
            const memberName = payment.member ? 
              `${payment.member.firstName} ${payment.member.lastName}`.toLowerCase() : '';
            return memberName.includes(searchValue);
          
          case 'groupName':
            return payment.group && 
                   payment.group.name.toLowerCase().includes(searchValue);
          
          case 'deletedBy':
            return payment.deleted_by_username && 
                   payment.deleted_by_username.toLowerCase().includes(searchValue);
          
          default:
            return true;
        }
      });
      
      setFilteredPayments(filtered);
    }
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setFilteredPayments(trashboxPayments);
    setCurrentPage(1);
    clearSelections();
  };

  const handleSelectPayment = (paymentId) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
    setSelectAll(newSelected.size === filteredPayments.length);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredPayments.map(p => p.id));
      setSelectedPayments(allIds);
      setSelectAll(true);
    }
  };

  const clearSelections = () => {
    setSelectedPayments(new Set());
    setSelectAll(false);
  };

  const handleRestorePayment = async (id) => {
    try {
      await paymentsApi.restoreFromTrashbox(id);
      setError(null);
      fetchTrashboxPayments();
    } catch (err) {
      setError('Failed to restore payment');
      console.error('Error restoring payment:', err);
    }
  };

  const handlePermanentlyDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this payment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await paymentsApi.permanentlyDeleteFromTrashbox(id);
      setError(null);
      fetchTrashboxPayments();
    } catch (err) {
      setError('Failed to permanently delete payment');
      console.error('Error permanently deleting payment:', err);
    }
  };

  const handleBulkRestore = async () => {
    if (selectedPayments.size === 0) return;
    
    try {
      const paymentIds = Array.from(selectedPayments);
      await paymentsApi.bulkRestoreFromTrashbox(paymentIds);
      setError(null);
      clearSelections();
      fetchTrashboxPayments();
    } catch (err) {
      setError('Failed to restore selected payments');
      console.error('Error bulk restoring payments:', err);
    }
  };

  const handleBulkPermanentlyDelete = async () => {
    if (selectedPayments.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedPayments.size} payment(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const paymentIds = Array.from(selectedPayments);
      await paymentsApi.bulkPermanentlyDeleteFromTrashbox(paymentIds);
      setError(null);
      clearSelections();
      fetchTrashboxPayments();
    } catch (err) {
      setError('Failed to permanently delete selected payments');
      console.error('Error bulk permanently deleting payments:', err);
    }
  };

  const formatDeletedDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'administrator' && user?.role !== 'super_user')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="mt-1 text-gray-600">You don't have permission to view the payments trashbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trash2 className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Payments Trashbox</h1>
        </div>
        <div className="text-sm text-gray-500">
          {trashboxPayments.length} deleted payment(s)
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by:</span>
          </div>
          
          <select
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="all">All</option>
            <option value="memberName">Member Name</option>
            <option value="groupName">Group Name</option>
            <option value="deletedBy">Deleted By</option>
          </select>
          
          {filterType !== 'all' && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              placeholder={`Enter ${filterType.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}
          
          <button
            onClick={applyFilters}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Apply Filters
          </button>
          
          <button
            onClick={clearFilters}
            className="bg-gray-500 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedPayments.size > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-red-800 font-medium">
              {selectedPayments.size} payment(s) selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={handleBulkRestore}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore Selected</span>
              </button>
              <button
                onClick={handleBulkPermanentlyDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
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
                  Deleted Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deleted By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPayments.has(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payment.member?.phoneNumber || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.group?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${payment.amount?.toLocaleString() || '0'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.paymentMonth ? formatMonthYear(payment.paymentMonth) : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDeletedDate(payment.deleted_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payment.deleted_by_username || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRestorePayment(payment.id)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="Restore payment"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handlePermanentlyDelete(payment.id)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                        title="Delete permanently"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {currentPayments.length === 0 && (
          <div className="text-center py-12">
            <Trash2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted payments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredPayments.length === 0 && trashboxPayments.length > 0 
                ? 'No payments match your current filters.' 
                : 'There are no deleted payments to display.'}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={filteredPayments.length}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentsTrashbox;
