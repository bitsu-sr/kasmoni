import React, { useEffect, useState } from 'react';
import { Trash2, RotateCcw, Search, Filter, AlertTriangle, Calendar, User, DollarSign } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { TrashboxPayment } from '../types';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import { formatCurrency } from '../utils/validation';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const PaymentsTrashbox: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [trashboxPayments, setTrashboxPayments] = useState<TrashboxPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<TrashboxPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Multi-select state
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'memberName' | 'groupName' | 'deletedBy'>('all');
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

  const handleFilterChange = (type: 'all' | 'memberName' | 'groupName' | 'deletedBy', value: string = '') => {
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
    setCurrentPage(1); // Reset to first page when filters change
    clearSelections();
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setFilteredPayments(trashboxPayments);
    setCurrentPage(1); // Reset to first page when clearing filters
    clearSelections();
  };

  // Multi-select functions
  const handleSelectPayment = (paymentId: number) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments(new Set());
      setSelectAll(false);
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
      setSelectAll(true);
    }
  };

  const clearSelections = () => {
    setSelectedPayments(new Set());
    setSelectAll(false);
  };

  const handleRestorePayment = async (id: number) => {
    const payment = trashboxPayments.find(p => p.id === id);
    const memberName = payment?.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'this payment';
    const amount = payment?.amount ? `SRD ${payment.amount.toFixed(2)}` : 'this payment';
    
    if (window.confirm(`Are you sure you want to restore the payment for ${memberName} (${amount})?`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.restoreFromTrashbox(id);
        if (response.data.success) {
          // Remove from local state
          setTrashboxPayments(prev => prev.filter(p => p.id !== id));
          setFilteredPayments(prev => prev.filter(p => p.id !== id));
          alert('Payment restored successfully!');
        } else {
          setError('Failed to restore payment');
        }
      } catch (err) {
        setError('Error restoring payment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePermanentlyDelete = async (id: number) => {
    const payment = trashboxPayments.find(p => p.id === id);
    const memberName = payment?.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'this payment';
    const amount = payment?.amount ? `SRD ${payment.amount.toFixed(2)}` : 'this payment';
    
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE the payment for ${memberName} (${amount})? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.permanentlyDeleteFromTrashbox(id);
        if (response.data.success) {
          // Remove from local state
          setTrashboxPayments(prev => prev.filter(p => p.id !== id));
          setFilteredPayments(prev => prev.filter(p => p.id !== id));
          alert('Payment permanently deleted!');
        } else {
          setError('Failed to permanently delete payment');
        }
      } catch (err) {
        setError('Error permanently deleting payment');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkRestore = async () => {
    if (selectedPayments.size === 0) {
      alert('Please select at least one payment to restore.');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);
    
    if (window.confirm(`Are you sure you want to restore ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)})?`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.bulkRestoreFromTrashbox(selectedPaymentIds);
        if (response.data.success) {
          // Remove restored payments from local state
          setTrashboxPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          
          // Clear selections
          clearSelections();
          
          alert(`Successfully restored ${selectedPayments.size} payment(s)!`);
        } else {
          setError('Failed to restore payments');
        }
      } catch (err) {
        setError('Error restoring payments');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBulkPermanentlyDelete = async () => {
    if (selectedPayments.size === 0) {
      alert('Please select at least one payment to permanently delete.');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);
    
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)})? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.bulkPermanentlyDeleteFromTrashbox(selectedPaymentIds);
        if (response.data.success) {
          // Remove deleted payments from local state
          setTrashboxPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          
          // Clear selections
          clearSelections();
          
          alert(`Successfully permanently deleted ${selectedPayments.size} payment(s)!`);
        } else {
          setError('Failed to permanently delete payments');
        }
      } catch (err) {
        setError('Error permanently deleting payments');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDeletedDate = (dateString: string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate pagination values
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  // Check if user has access
  if (!isAuthenticated || !(user?.role === 'administrator' || user?.role === 'super_user')) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <AlertTriangle size={64} className="text-warning mb-3" />
            <h2>Access Denied</h2>
            <p>You need administrator privileges to access the Payments Trashbox.</p>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="container">
      <div className="header-row">
        <h1>
          <Trash2 size={32} />
          Payments Trashbox
        </h1>
        <div className="header-actions">
          <button className="btn btn-outline-secondary" onClick={fetchTrashboxPayments}>
            <RotateCcw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Multi-select controls */}
      <div className="multi-select-controls p-3 border-bottom">
        <div className="d-flex justify-between align-center">
          <div className="d-flex align-center gap-2">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              className="form-check-input"
              title="Select all payments"
            />
            <span className="text-muted">
              {selectedPayments.size > 0 
                ? `${selectedPayments.size} payment(s) selected`
                : 'Select payments to restore or permanently delete'
              }
            </span>
          </div>
          {selectedPayments.size > 0 && (
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={clearSelections}
              >
                Clear Selection
              </button>
              <button
                className="btn btn-sm btn-success"
                onClick={handleBulkRestore}
                disabled={loading}
              >
                <RotateCcw size={16} />
                Restore Selected ({selectedPayments.size})
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={handleBulkPermanentlyDelete}
                disabled={loading}
              >
                <Trash2 size={16} />
                Permanently Delete ({selectedPayments.size})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="filter-container mb-3">
        <div className="filter-header">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span className="ms-1">Filters</span>
            {filterType !== 'all' && filterValue && (
              <span className="badge badge-primary ms-2">Active</span>
            )}
          </button>
          {filterType !== 'all' && filterValue && (
            <button 
              className="btn btn-outline-danger btn-sm ms-2"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
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
                  <option value="all">All Payments</option>
                  <option value="memberName">Member Name</option>
                  <option value="groupName">Group Name</option>
                  <option value="deletedBy">Deleted By</option>
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
                        filterType === 'memberName' ? 'e.g., John Smith' :
                        filterType === 'groupName' ? 'e.g., Group 01' :
                        filterType === 'deletedBy' ? 'e.g., admin' :
                        'Enter search term...'
                      }
                      value={filterValue}
                      onChange={(e) => handleFilterChange(filterType, e.target.value)}
                      className="form-control form-control-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div>Loading trashbox payments...</div>
      ) : (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="form-check-input"
                    title="Select all payments"
                  />
                </th>
                <th>Payment Date</th>
                <th>Payment Month</th>
                <th>Receive Month</th>
                <th>Member Name</th>
                <th>Group</th>
                <th>Amount (SRD)</th>
                <th>Payment Type</th>
                <th>Status</th>
                <th>Deleted At</th>
                <th>Deleted By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPayments.has(payment.id)}
                      onChange={() => handleSelectPayment(payment.id)}
                      className="form-check-input"
                      title={`Select payment for ${payment.member?.firstName} ${payment.member?.lastName}`}
                    />
                  </td>
                  <td>{formatPaymentDate(payment.paymentDate)}</td>
                  <td>
                    {payment.paymentMonth ? 
                      formatMonthYear(payment.paymentMonth) : 
                      '-'
                    }
                  </td>
                  <td>
                    {payment.slot ? 
                      formatMonthYear(payment.slot) : 
                      '-'
                    }
                  </td>
                  <td>
                    {payment.member?.firstName} {payment.member?.lastName}
                  </td>
                  <td>{payment.group?.name}</td>
                  <td>{payment.amount.toFixed(2)}</td>
                  <td>
                    <span className={`badge ${payment.paymentType === 'cash' ? 'badge-success' : 'badge-info'}`}>
                      {payment.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      payment.status === 'received' ? 'badge-success' :
                      payment.status === 'pending' ? 'badge-warning' :
                      payment.status === 'settled' ? 'badge-info' :
                      'badge-danger'
                    }`}>
                      {payment.status === 'received' ? 'Received' :
                       payment.status === 'pending' ? 'Pending' :
                       payment.status === 'settled' ? 'Settled' :
                       'Not Paid'}
                    </span>
                  </td>
                  <td>{formatDeletedDate(payment.deleted_at)}</td>
                  <td>{payment.deleted_by_username || 'System'}</td>
                  <td>
                    <button 
                      className="btn btn-sm btn-success me-1" 
                      onClick={() => handleRestorePayment(payment.id)}
                      title="Restore Payment"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      className="btn btn-sm btn-danger" 
                      onClick={() => handlePermanentlyDelete(payment.id)}
                      title="Permanently Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
                      </table>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            )}
            
            {filteredPayments.length === 0 && (
              <div className="text-center p-3">
                <Trash2 size={64} className="text-muted mb-3" />
                <h3>No Payments in Trashbox</h3>
                <p>
                  {filterType !== 'all' && filterValue 
                    ? 'No payments match your current filter criteria.'
                    : 'There are no deleted payments in the trashbox.'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

export default PaymentsTrashbox; 