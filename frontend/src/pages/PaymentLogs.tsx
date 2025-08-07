import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Plus,
  Edit,
  Eye
} from 'lucide-react';
import { paymentLogsApi } from '../services/api';
import { PaymentLog } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';

const PaymentLogs: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'action' | 'member' | 'group' | 'performed_by'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'administrator' || user?.role === 'super_user')) {
      fetchLogs();
    }
  }, [user, isAuthenticated]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (filterType !== 'all' && filterValue) {
        switch (filterType) {
          case 'action':
            params.action = filterValue;
            break;
          case 'member':
            params.member_id = filterValue;
            break;
          case 'group':
            params.group_id = filterValue;
            break;
          case 'performed_by':
            params.performed_by = filterValue;
            break;
        }
      }
      
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      
      const response = await paymentLogsApi.getList(params);
      
      if (response.data.success && response.data.data) {
        setLogs(response.data.data);
        setFilteredLogs(response.data.data);
        setError(null);
      } else {
        setError('Failed to fetch payment logs');
      }
    } catch (err) {
      console.error('Error fetching payment logs:', err);
      setError('Error loading payment logs');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    if (filterType === 'all' && !filterValue && !startDate && !endDate) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(log => {
      // Date range filter
      if (startDate && new Date(log.timestamp) < new Date(startDate)) {
        return false;
      }
      if (endDate && new Date(log.timestamp) > new Date(endDate)) {
        return false;
      }

      // Other filters
      if (filterType !== 'all' && filterValue) {
        const searchValue = filterValue.toLowerCase().trim();
        
        switch (filterType) {
          case 'action':
            return log.action.toLowerCase().includes(searchValue);
          case 'member':
            return log.member && 
                   `${log.member.firstName} ${log.member.lastName}`.toLowerCase().includes(searchValue);
          case 'group':
            return log.group && 
                   log.group.name.toLowerCase().includes(searchValue);
          case 'performed_by':
            return log.performed_by_username && 
                   log.performed_by_username.toLowerCase().includes(searchValue);
          default:
            return true;
        }
      }
      
      return true;
    });

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (type: 'all' | 'action' | 'member' | 'group' | 'performed_by', value: string = '') => {
    setFilterType(type);
    setFilterValue(value);
    applyFilters();
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setStartDate('');
    setEndDate('');
    setFilteredLogs(logs);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus size={16} className="text-green-600" />;
      case 'status_changed':
        return <Edit size={16} className="text-blue-600" />;
      case 'updated':
        return <Edit size={16} className="text-yellow-600" />;
      case 'deleted':
        return <Trash2 size={16} className="text-red-600" />;
      case 'bulk_created':
        return <Plus size={16} className="text-green-600" />;
      case 'restored':
        return <RotateCcw size={16} className="text-blue-600" />;
      case 'permanently_deleted':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return <FileText size={16} className="text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'created':
        return 'Payment Created';
      case 'status_changed':
        return 'Status Changed';
      case 'updated':
        return 'Payment Updated';
      case 'deleted':
        return 'Payment Deleted';
      case 'bulk_created':
        return 'Bulk Payment Created';
      case 'restored':
        return 'Payment Restored';
      case 'permanently_deleted':
        return 'Permanently Deleted';
      default:
        return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
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
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  if (!isAuthenticated || (user?.role !== 'administrator' && user?.role !== 'super_user')) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <AlertTriangle size={20} />
          <span>Access denied. Only administrators can view payment logs.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-row">
        <div className="header-content">
          <FileText size={24} />
          <h1>Payment Logs</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline-secondary"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RotateCcw size={16} />
            <span className="ms-1">Refresh</span>
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filter Section */}
      <div className="filter-container mb-3">
        <div className="filter-header">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span className="ms-1">Filters</span>
            {(filterType !== 'all' && filterValue) || startDate || endDate ? (
              <span className="badge badge-primary ms-2">Active</span>
            ) : null}
          </button>
          {(filterType !== 'all' && filterValue) || startDate || endDate ? (
            <button 
              className="btn btn-outline-danger btn-sm ms-2"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          ) : null}
        </div>

        {showFilters && (
          <div className="filter-content">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">Filter by:</label>
                <select 
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value as any)}
                  className="form-control form-control-sm"
                >
                  <option value="all">All Actions</option>
                  <option value="action">Action Type</option>
                  <option value="member">Member Name</option>
                  <option value="group">Group Name</option>
                  <option value="performed_by">Performed By</option>
                </select>
              </div>

              {filterType !== 'all' && (
                <div className="filter-group">
                  <label className="filter-label">Search:</label>
                  <div className="search-input-wrapper">
                    <Search size={16} className="search-icon" />
                    <input
                      type="text"
                      placeholder={
                        filterType === 'action' ? 'e.g., created, updated' :
                        filterType === 'member' ? 'e.g., John Smith' :
                        filterType === 'group' ? 'e.g., Group 01' :
                        filterType === 'performed_by' ? 'e.g., admin' :
                        'Enter search term...'
                      }
                      value={filterValue}
                      onChange={(e) => handleFilterChange(filterType, e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>
              )}

              <div className="filter-group">
                <label className="filter-label">Start Date:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    applyFilters();
                  }}
                  className="form-control form-control-sm"
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">End Date:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    applyFilters();
                  }}
                  className="form-control form-control-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center p-4">
          <div className="spinner"></div>
          <p>Loading payment logs...</p>
        </div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Member</th>
                <th>Group</th>
                <th>Payment Details</th>
                <th>Changes</th>
                <th>Performed By</th>
                <th>Timestamp</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <div className="d-flex align-center">
                      {getActionIcon(log.action)}
                      <span className="ms-2">{getActionLabel(log.action)}</span>
                    </div>
                  </td>
                  <td>
                    {log.member ? (
                      `${log.member.firstName} ${log.member.lastName}`
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    {log.group ? (
                      log.group.name
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    {log.payment ? (
                      <div>
                        <div>{formatCurrency(log.payment.amount)}</div>
                        <div className="text-sm text-muted">
                          {formatPaymentDate(log.payment.paymentDate)}
                        </div>
                        {getStatusBadge(log.payment.status)}
                      </div>
                    ) : log.bulk_payment_count ? (
                      <div>
                        <strong>{log.bulk_payment_count} payments</strong>
                      </div>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </td>
                  <td>
                    {log.action === 'status_changed' && log.old_status && log.new_status ? (
                      <div>
                        <div className="text-sm">
                          <span className="text-muted">From:</span> {getStatusBadge(log.old_status)}
                        </div>
                        <div className="text-sm">
                          <span className="text-muted">To:</span> {getStatusBadge(log.new_status)}
                        </div>
                      </div>
                    ) : log.action === 'updated' ? (
                      <div className="text-sm">
                        <div>Amount: {log.old_amount} → {log.new_amount}</div>
                        <div>Date: {log.old_payment_date} → {log.new_payment_date}</div>
                      </div>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {log.performed_by_username || 'System'}
                  </td>
                  <td>
                    <div className="text-sm">
                      {formatTimestamp(log.timestamp)}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      title="View Details"
                      onClick={() => {
                        // Show detailed information in a modal or expandable row
                        console.log('Log details:', log);
                      }}
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLogs.length === 0 && (
            <div className="text-center p-3">
              <FileText size={64} className="text-muted mb-3" />
              <h3>No Payment Logs Found</h3>
              <p>
                {filterType !== 'all' && filterValue 
                  ? 'No logs match your current filter criteria.'
                  : 'There are no payment logs to display.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentLogs; 