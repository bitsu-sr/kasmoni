import React, { useEffect, useState } from 'react';
import { Activity, Search, Filter, Calendar, User, Monitor, Globe } from 'lucide-react';
import { authApi } from '../services/api';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const UserLogs = () => {
  const { user, isAuthenticated } = useAuth();
  const [userLogs, setUserLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter state
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'administrator' || user?.role === 'super_user')) {
      fetchUserLogs();
    }
  }, [user, isAuthenticated]);

  const fetchUserLogs = async () => {
    try {
      setLoading(true);
      const response = await authApi.getLogs();
      
      if (response.data.success && response.data.data) {
        setUserLogs(response.data.data);
        setFilteredLogs(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch user logs');
      }
    } catch (err) {
      console.error('Error fetching user logs:', err);
      setError('Error loading user logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = userLogs;

    // Apply text filter
    if (filterType !== 'all' && filterValue.trim()) {
      const searchValue = filterValue.toLowerCase().trim();
      filtered = filtered.filter(log => {
        switch (filterType) {
          case 'username':
            return log.username && log.username.toLowerCase().includes(searchValue);
          case 'email':
            return log.email && log.email.toLowerCase().includes(searchValue);
          case 'action':
            return log.action && log.action.toLowerCase().includes(searchValue);
          case 'ipAddress':
            return log.ipAddress && log.ipAddress.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      });
    }

    // Apply date filter
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(log => {
        const logDate = new Date(log.createdAt);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === filterDate.getTime();
      });
    }

    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value = '') => {
    setFilterType(type);
    setFilterValue(value);
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setDateFilter('');
    setFilteredLogs(userLogs);
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadge = (action) => {
    const actionClasses = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-red-100 text-red-800',
      'password_change': 'bg-blue-100 text-blue-800',
      'profile_update': 'bg-yellow-100 text-yellow-800',
      'user_created': 'bg-purple-100 text-purple-800',
      'user_deleted': 'bg-red-100 text-red-800',
      'role_changed': 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${actionClasses[action] || 'bg-gray-100 text-gray-800'}`}>
        {action?.replace('_', ' ').toUpperCase() || 'N/A'}
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
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== 'administrator' && user?.role !== 'super_user')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Activity className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-2 text-xl font-semibold text-gray-900">Access Denied</h1>
          <p className="mt-1 text-gray-600">You don't have permission to view user logs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">User Activity Logs</h1>
        </div>
        <div className="text-sm text-gray-500">
          {userLogs.length} log entries
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
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="username">Username</option>
            <option value="email">Email</option>
            <option value="action">Action</option>
            <option value="ipAddress">IP Address</option>
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
          
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
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

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {log.username || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900 font-mono">
                        {log.ipAddress || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate">
                      <div className="flex items-center space-x-2">
                        <Monitor className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-900 truncate" title={log.userAgent}>
                          {log.userAgent || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(log.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {currentLogs.length === 0 && (
          <div className="text-center py-12">
            <Activity className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No user logs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filteredLogs.length === 0 && userLogs.length > 0 
                ? 'No logs match your current filters.' 
                : 'There are no user activity logs to display.'}
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
            totalItems={filteredLogs.length}
          />
        </div>
      )}
    </div>
  );
};

export default UserLogs;
