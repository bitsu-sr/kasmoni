import React, { useEffect, useState } from 'react';
import { Archive, Search, Filter, RotateCcw, Undo2, Trash2 } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const ArchivedPayments = () => {
  const [archivedPayments, setArchivedPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  
  // Selection state
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  const { user } = useAuth();

  useEffect(() => {
    fetchArchivedPayments();
  }, [user]);

  const fetchArchivedPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getArchive();
      
      if (response.data.success && response.data.data) {
        setArchivedPayments(response.data.data);
        setFilteredPayments(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch archived payments');
      }
    } catch (err) {
      setError('Error loading archived payments');
      console.error('Error fetching archived payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterType === 'all' || !filterValue.trim()) {
      setFilteredPayments(archivedPayments);
      return;
    }

    const filtered = archivedPayments.filter(payment => {
      const searchValue = filterValue.toLowerCase().trim();
      
      switch (filterType) {
        case 'paymentMonth':
          return payment.paymentMonth && 
                 formatMonthYear(payment.paymentMonth).toLowerCase().includes(searchValue);
        
        case 'memberName':
          const memberName = payment.member ? 
            `${payment.member.firstName} ${payment.member.lastName}`.toLowerCase() : '';
          return memberName.includes(searchValue);
        
        case 'groupName':
          return payment.group && 
                 payment.group.name.toLowerCase().includes(searchValue);
        
        case 'status':
          return payment.status && 
                 payment.status.toLowerCase().includes(searchValue);
        
        default:
          return true;
      }
    });

    setFilteredPayments(filtered);
  };

  const handleFilterChange = (type, value = '') => {
    setFilterType(type);
    setFilterValue(value);
    
    if (type === 'all' || !value.trim()) {
      setFilteredPayments(archivedPayments);
    } else {
      const filtered = archivedPayments.filter(payment => {
        const searchValue = value.toLowerCase().trim();
        
        switch (type) {
          case 'paymentMonth':
            return payment.paymentMonth && payment.paymentMonth === value;
          
          case 'memberName':
            const memberName = payment.member ? 
              `${payment.member.firstName} ${payment.member.lastName}`.toLowerCase() : '';
            return memberName.includes(searchValue);
          
          case 'groupName':
            return payment.group && 
                   payment.group.name.toLowerCase().includes(searchValue);
          
          case 'status':
            return payment.status && 
                   payment.status.toLowerCase().includes(searchValue);
          
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
    setSearchTerm('');
    setFilteredPayments(archivedPayments);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'not_paid': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'received': 'bg-blue-100 text-blue-800',
      'settled': 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getPaymentTypeBadge = (type) => {
    const typeClasses = {
      'cash': 'bg-green-100 text-green-800',
      'bank_transfer': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${typeClasses[type] || 'bg-gray-100 text-gray-800'}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
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

  const handleRestoreSelected = async () => {
    if (selectedPayments.size === 0) return;
    
    try {
      const paymentIds = Array.from(selectedPayments);
      await paymentsApi.bulkRestoreFromArchive(paymentIds);
      
      showSuccessMessage(`Successfully restored ${paymentIds.length} payment(s)`);
      setSelectedPayments(new Set());
      setSelectAll(false);
      fetchArchivedPayments();
    } catch (err) {
      setError('Failed to restore selected payments');
      console.error('Error restoring payments:', err);
    }
  };

  const handleMoveToTrashboxSelected = async () => {
    if (selectedPayments.size === 0) return;
    
    try {
      const paymentIds = Array.from(selectedPayments);
      await paymentsApi.bulkMoveArchiveToTrashbox(paymentIds, 'Bulk move to trashbox');
      
      showSuccessMessage(`Successfully moved ${paymentIds.length} payment(s) to trashbox`);
      setSelectedPayments(new Set());
      setSelectAll(false);
      fetchArchivedPayments();
    } catch (err) {
      setError('Failed to move selected payments to trashbox');
      console.error('Error moving payments to trashbox:', err);
    }
  };

  const handleRestoreSingle = async (payment) => {
    try {
      await paymentsApi.restoreFromArchive(payment.id);
      showSuccessMessage('Payment restored successfully');
      fetchArchivedPayments();
    } catch (err) {
      setError('Failed to restore payment');
      console.error('Error restoring payment:', err);
    }
  };

  const handleMoveToTrashboxSingle = async (payment) => {
    try {
      await paymentsApi.moveArchiveToTrashbox(payment.id, 'Moved to trashbox from archive');
      showSuccessMessage('Payment moved to trashbox successfully');
      fetchArchivedPayments();
    } catch (err) {
      setError('Failed to move payment to trashbox');
      console.error('Error moving payment to trashbox:', err);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Archive className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Archived Payments</h1>
        </div>
        <div className="text-sm text-gray-500">
          {archivedPayments.length} archived payment(s)
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="paymentMonth">Payment Month</option>
            <option value="memberName">Member Name</option>
            <option value="groupName">Group Name</option>
            <option value="status">Status</option>
          </select>
          
          {filterType !== 'all' && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              placeholder={`Enter ${filterType.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
          
          <button
            onClick={applyFilters}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-blue-800 font-medium">
              {selectedPayments.size} payment(s) selected
            </span>
            <div className="flex space-x-3">
              <button
                onClick={handleRestoreSelected}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Restore Selected</span>
              </button>
              <button
                onClick={handleMoveToTrashboxSelected}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>Move to Trashbox</span>
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
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                    {getPaymentTypeBadge(payment.paymentType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payment.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleRestoreSingle(payment)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="Restore payment"
                      >
                        <RotateCcw className="h-4 w-4" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleMoveToTrashboxSingle(payment)}
                        className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                        title="Move to trashbox"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Trash</span>
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
            <Archive className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No archived payments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredPayments.length === 0 && archivedPayments.length > 0 
                ? 'No payments match your current filters.' 
                : 'There are no archived payments to display.'}
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

export default ArchivedPayments;
