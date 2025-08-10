import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Search, Filter, Calendar, Eye, Download, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';
import Pagination from '../components/Pagination';

const Payouts = () => {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState([]);
  const [filteredPayouts, setFilteredPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockPayouts = [
        {
          id: 1,
          memberName: 'John Doe',
          memberId: 123,
          groupName: 'Group A',
          groupId: 456,
          monthlyAmount: 1000,
          totalAmount: 12000,
          duration: 12,
          receiveMonth: '2024-06',
          status: 'completed',
          paymentDate: '2024-06-15',
          bankName: 'DSB Bank',
          accountNumber: '1234-5678-9012-3456'
        },
        {
          id: 2,
          memberName: 'Jane Smith',
          memberId: 124,
          groupName: 'Group B',
          groupId: 457,
          monthlyAmount: 800,
          totalAmount: 9600,
          duration: 12,
          receiveMonth: '2024-07',
          status: 'pending',
          paymentDate: null,
          bankName: 'Finabank',
          accountNumber: '9876-5432-1098-7654'
        },
        {
          id: 3,
          memberName: 'Mike Johnson',
          memberId: 125,
          groupName: 'Group A',
          groupId: 456,
          monthlyAmount: 1000,
          totalAmount: 12000,
          duration: 12,
          receiveMonth: '2024-08',
          status: 'processing',
          paymentDate: null,
          bankName: 'DSB Bank',
          accountNumber: '1111-2222-3333-4444'
        },
        {
          id: 4,
          memberName: 'Sarah Wilson',
          memberId: 126,
          groupName: 'Group C',
          groupId: 458,
          monthlyAmount: 1200,
          totalAmount: 14400,
          duration: 12,
          receiveMonth: '2024-09',
          status: 'completed',
          paymentDate: '2024-09-15',
          bankName: 'Finabank',
          accountNumber: '5555-6666-7777-8888'
        }
      ];
      
      setPayouts(mockPayouts);
      setFilteredPayouts(mockPayouts);
      setError(null);
    } catch (err) {
      setError('Failed to load payouts');
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = payouts;

    // Apply text filter
    if (filterType !== 'all' && filterValue.trim()) {
      const searchValue = filterValue.toLowerCase().trim();
      filtered = filtered.filter(payout => {
        switch (filterType) {
          case 'memberName':
            return payout.memberName && payout.memberName.toLowerCase().includes(searchValue);
          case 'groupName':
            return payout.groupName && payout.groupName.toLowerCase().includes(searchValue);
          case 'bankName':
            return payout.bankName && payout.bankName.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payout => payout.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(payout => {
        if (payout.receiveMonth) {
          const payoutDate = new Date(payout.receiveMonth + '-01');
          payoutDate.setHours(0, 0, 0, 0);
          return payoutDate.getTime() === filterDate.getTime();
        }
        return false;
      });
    }

    setFilteredPayouts(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value = '') => {
    setFilterType(type);
    setFilterValue(value);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setStatusFilter('all');
    setDateFilter('');
    setFilteredPayouts(payouts);
    setCurrentPage(1);
  };

  const handleViewDetails = (payoutId) => {
    navigate(`/payouts/${payoutId}`);
  };

  const handleDownload = (payout) => {
    // Implement PDF download functionality
    console.log('Downloading payout details for:', payout.memberName);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status?.replace('_', ' ').toUpperCase() || 'N/A'}
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

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayouts = filteredPayouts.slice(startIndex, endIndex);

  // Calculate summary statistics
  const totalPayouts = filteredPayouts.length;
  const totalAmount = filteredPayouts.reduce((sum, payout) => sum + (payout.totalAmount || 0), 0);
  const completedPayouts = filteredPayouts.filter(p => p.status === 'completed').length;
  const pendingPayouts = filteredPayouts.filter(p => p.status === 'pending').length;

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
          <DollarSign className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
        </div>
        <div className="text-sm text-gray-500">
          {totalPayouts} payout(s) found
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Payouts</p>
              <p className="text-2xl font-bold text-gray-900">{totalPayouts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">${totalAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedPayouts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingPayouts}</p>
            </div>
          </div>
        </div>
      </div>

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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="memberName">Member Name</option>
            <option value="groupName">Group Name</option>
            <option value="bankName">Bank Name</option>
          </select>
          
          {filterType !== 'all' && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              placeholder={`Enter ${filterType.replace(/([A-Z])/g, ' $1').toLowerCase()}...`}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <button
            onClick={applyFilters}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  Receive Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Details
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
              {currentPayouts.map((payout) => (
                <tr key={payout.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {payout.memberName}
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {payout.memberId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payout.groupName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {payout.duration} months
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${payout.totalAmount?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${payout.monthlyAmount?.toLocaleString() || '0'}/month
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payout.receiveMonth ? formatMonthYear(payout.receiveMonth) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {payout.bankName}
                    </div>
                    <div className="text-sm text-gray-500 font-mono">
                      {payout.accountNumber}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(payout.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(payout.id)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleDownload(payout)}
                        className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {currentPayouts.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No payouts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredPayouts.length === 0 && payouts.length > 0 
                ? 'No payouts match your current filters.' 
                : 'There are no payouts to display.'}
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
            totalItems={filteredPayouts.length}
          />
        </div>
      )}
    </div>
  );
};

export default Payouts;
