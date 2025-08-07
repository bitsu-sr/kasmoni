import React, { useEffect, useState } from 'react';
import { Archive, Search, Filter, RotateCcw, Undo2, Trash2 } from 'lucide-react';
import { paymentsApi } from '../services/api';
import { Payment } from '../types';
import { formatPaymentDate, formatMonthYear } from '../utils/dateUtils';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const ArchivedPayments: React.FC = () => {
  const [archivedPayments, setArchivedPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'paymentMonth' | 'memberName' | 'groupName' | 'status'>('all');
  const [filterValue, setFilterValue] = useState('');
  
  // Selection state
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
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

  const handleFilterChange = (type: 'all' | 'paymentMonth' | 'memberName' | 'groupName' | 'status', value: string = '') => {
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
    setFilteredPayments(archivedPayments);
    setCurrentPage(1); // Reset to first page when clearing filters
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

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Helper function to show success messages
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments(new Set());
    } else {
      const currentPageIds = currentPayments.map(p => p.id);
      setSelectedPayments(new Set(currentPageIds));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectPayment = (paymentId: number) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
    setSelectAll(newSelected.size === currentPayments.length);
  };

  // Archive management handlers
  const handleRestoreSelected = async () => {
    if (selectedPayments.size === 0) {
      setError('Please select payments to restore');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);

    if (window.confirm(`Are you sure you want to restore ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)})?\n\nThis will move the payments back to the active payments list.`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.bulkRestoreFromArchive(selectedPaymentIds);
        if (response.data.success) {
          setArchivedPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          setSelectedPayments(new Set());
          setSelectAll(false);
          showSuccessMessage(`Successfully restored ${selectedPayments.size} payment(s)! They are now available in the active payments list.`);
        } else {
          setError(response.data.error || 'Failed to restore payments');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error restoring payments';
        setError(errorMessage);
        console.error('Error restoring payments:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMoveToTrashboxSelected = async () => {
    if (selectedPayments.size === 0) {
      setError('Please select payments to move to trashbox');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);

    const deletionReason = prompt(`Please provide a reason for moving ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)}) to trashbox:\n\nThis will move the payments to the trashbox from the archive.`);

    if (deletionReason !== null) {
      if (window.confirm(`Are you sure you want to move ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)}) to trashbox?\n\nReason: ${deletionReason}\n\nThis action will move the payments to the trashbox.`)) {
        try {
          setLoading(true);
          const response = await paymentsApi.bulkMoveArchiveToTrashbox(selectedPaymentIds, deletionReason);
          if (response.data.success) {
            setArchivedPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
            setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
            setSelectedPayments(new Set());
            setSelectAll(false);
            showSuccessMessage(`Successfully moved ${selectedPayments.size} payment(s) to trashbox! You can view them in the Payments Trashbox page.`);
          } else {
            setError(response.data.error || 'Failed to move payments to trashbox');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error moving payments to trashbox';
          setError(errorMessage);
          console.error('Error moving payments to trashbox:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleRestoreSingle = async (payment: Payment) => {
    const memberName = payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'Unknown Member';
    
    if (window.confirm(`Are you sure you want to restore the payment for ${memberName} (Amount: SRD ${payment.amount.toFixed(2)})?\n\nThis will move the payment back to the active payments list.`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.restoreFromArchive(payment.id);
        if (response.data.success) {
          setArchivedPayments(prev => prev.filter(p => p.id !== payment.id));
          setFilteredPayments(prev => prev.filter(p => p.id !== payment.id));
          showSuccessMessage(`Successfully restored payment for ${memberName}! It is now available in the active payments list.`);
        } else {
          setError(response.data.error || 'Failed to restore payment');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error restoring payment';
        setError(errorMessage);
        console.error('Error restoring payment:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleMoveToTrashboxSingle = async (payment: Payment) => {
    const memberName = payment.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'Unknown Member';
    
    const deletionReason = prompt(`Please provide a reason for moving the payment for ${memberName} (Amount: SRD ${payment.amount.toFixed(2)}) to trashbox:\n\nThis will move the payment to the trashbox from the archive.`);

    if (deletionReason !== null) {
      if (window.confirm(`Are you sure you want to move the payment for ${memberName} (Amount: SRD ${payment.amount.toFixed(2)}) to trashbox?\n\nReason: ${deletionReason}\n\nThis action will move the payment to the trashbox.`)) {
        try {
          setLoading(true);
          const response = await paymentsApi.moveArchiveToTrashbox(payment.id, deletionReason);
          if (response.data.success) {
            setArchivedPayments(prev => prev.filter(p => p.id !== payment.id));
            setFilteredPayments(prev => prev.filter(p => p.id !== payment.id));
            showSuccessMessage(`Successfully moved payment for ${memberName} to trashbox! You can view it in the Payments Trashbox page.`);
          } else {
            setError(response.data.error || 'Failed to move payment to trashbox');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error moving payment to trashbox';
          setError(errorMessage);
          console.error('Error moving payment to trashbox:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  // Calculate pagination values
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  if (!user || (user.role !== 'administrator' && user.role !== 'super_user')) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <strong>Access Denied</strong> - Only administrators can view archived payments.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-row">
        <div className="header-content">
          <Archive size={24} />
          <h1>Archived Payments</h1>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline-secondary"
            onClick={fetchArchivedPayments}
            disabled={loading}
          >
            <RotateCcw size={16} />
            <span className="ms-1">Refresh</span>
          </button>
        </div>
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

      {/* Filters */}
      <div className="filter-controls mb-3">
        <div className="d-flex gap-2 align-items-center">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search archived payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-dropdown">
            <Filter size={16} />
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value as any, filterValue)}
              className="form-control"
            >
              <option value="all">All</option>
              <option value="paymentMonth">Payment Month</option>
              <option value="memberName">Member Name</option>
              <option value="groupName">Group Name</option>
              <option value="status">Status</option>
            </select>
          </div>
          
          {filterType !== 'all' && (
            <input
              type="text"
              placeholder={`Filter by ${filterType}...`}
              value={filterValue}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              className="form-control"
            />
          )}
          
          {(filterType !== 'all' || filterValue) && (
            <button 
              className="btn btn-outline-secondary"
              onClick={clearFilters}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {filteredPayments.length > 0 && (
        <div className="bulk-actions-section mb-3">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex gap-2 align-items-center">
              <span className="text-muted">
                {selectedPayments.size} of {currentPayments.length} selected
              </span>
              {selectedPayments.size > 0 && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setSelectedPayments(new Set());
                    setSelectAll(false);
                  }}
                >
                  Clear Selection
                </button>
              )}
            </div>
            <div className="d-flex gap-2">
              {selectedPayments.size > 0 && (
                <>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={handleRestoreSelected}
                    disabled={loading}
                    title={selectedPayments.size === 0 ? "Select payments first to restore" : "Restore selected payments"}
                    style={{
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Undo2 size={16} />
                    Restore ({selectedPayments.size})
                  </button>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={handleMoveToTrashboxSelected}
                    disabled={loading}
                    title={selectedPayments.size === 0 ? "Select payments first to move to trashbox" : "Move selected payments to trashbox"}
                    style={{
                      padding: '0.5rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Trash2 size={16} />
                    Move to Trashbox ({selectedPayments.size})
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archived Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3>Archived Payments ({filteredPayments.length})</h3>
        </div>
        <div className="table-container">
          {filteredPayments.length === 0 ? (
            <div className="empty-state">
              <div className="text-center p-4">
                <Archive size={64} className="text-muted mb-3" />
                <h4>No archived payments found</h4>
                <p className="text-muted">
                  {searchTerm || filterType !== 'all' 
                    ? 'No archived payments match your current filters.'
                    : 'Archived payments will appear here when you archive payments from the main Payments page.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={currentPayments.length === 0}
                    />
                  </th>
                  <th>Payment Date</th>
                  <th>Payment Month</th>
                  <th>Receive Month</th>
                  <th>Member Name</th>
                  <th>Group</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment Type</th>
                  <th>Archived Date</th>
                  <th>Archived By</th>
                  <th>Archive Reason</th>
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
                    <td>SRD {payment.amount.toFixed(2)}</td>
                    <td>{getStatusBadge(payment.status)}</td>
                    <td>{getPaymentTypeBadge(payment.paymentType)}</td>
                    <td>
                      {(payment as any).archived_at ? 
                        formatPaymentDate((payment as any).archived_at) : 
                        '-'
                      }
                    </td>
                    <td>
                      {(payment as any).archived_by_username || '-'}
                    </td>
                    <td>
                      {(payment as any).archive_reason || '-'}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleRestoreSingle(payment)}
                          disabled={loading}
                          title="Restore payment"
                          style={{
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Undo2 size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleMoveToTrashboxSingle(payment)}
                          disabled={loading}
                          title="Move to trashbox"
                          style={{
                            padding: '0.25rem 0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
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
        </div>
      </div>
    </div>
  );
};

export default ArchivedPayments; 