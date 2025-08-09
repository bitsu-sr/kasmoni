import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { paymentsApi, groupsApi, banksApi } from '../services/api.js';
import { formatCurrency, formatDate, formatMonthYear, getDisplayName } from '../utils/validation.js';
import Pagination from '../components/Pagination.js';

const Payments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filterType, setFilterType] = useState('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    groupId: '',
    memberId: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMonth: new Date().toISOString().slice(0, 7),
    slot: '',
    paymentType: 'bank_transfer',
    senderBank: '',
    receiverBank: '',
    status: 'not_paid',
  });

  useEffect(() => {
    fetchPayments();
    fetchGroups();
    fetchBanks();
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentsApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: filterValue
      });
      
      if (response.data.success) {
        const paymentsData = response.data.data || [];
        setPayments(paymentsData);
        setFilteredPayments(paymentsData);
        setError(null);
      } else {
        setError('Failed to fetch payments');
      }
    } catch (err) {
      setError('Error loading payments');
      console.error('Error fetching payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsApi.getAll();
      if (response.data.success) {
        setGroups(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await banksApi.getAll();
      if (response.data.success) {
        setBanks(response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching banks:', err);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setFilterValue(term);
    setCurrentPage(1);
    
    if (!term) {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment => 
        payment.member?.firstName?.toLowerCase().includes(term.toLowerCase()) ||
        payment.member?.lastName?.toLowerCase().includes(term.toLowerCase()) ||
        payment.group?.name?.toLowerCase().includes(term.toLowerCase()) ||
        payment.paymentMonth?.includes(term) ||
        payment.status?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredPayments(filtered);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.groupId || !formData.memberId || !formData.amount || !formData.paymentDate) {
      return 'Please fill in all required fields';
    }
    
    if (parseFloat(formData.amount) <= 0) {
      return 'Amount must be greater than 0';
    }
    
    return null;
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        groupId: parseInt(formData.groupId),
        memberId: parseInt(formData.memberId)
      };
      
      const response = await paymentsApi.create(paymentData);
      
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          groupId: '',
          memberId: '',
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMonth: new Date().toISOString().slice(0, 7),
          slot: '',
          paymentType: 'bank_transfer',
          senderBank: '',
          receiverBank: '',
          status: 'not_paid',
        });
        fetchPayments();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to add payment');
      }
    } catch (err) {
      setError('Failed to add payment');
      console.error('Error adding payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPayment = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        ...formData,
        amount: parseFloat(formData.amount),
        groupId: parseInt(formData.groupId),
        memberId: parseInt(formData.memberId)
      };
      
      const response = await paymentsApi.update(editingPayment.id, paymentData);
      
      if (response.data.success) {
        setEditingPayment(null);
        setShowForm(false);
        setFormData({
          groupId: '',
          memberId: '',
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMonth: new Date().toISOString().slice(0, 7),
          slot: '',
          paymentType: 'bank_transfer',
          senderBank: '',
          receiverBank: '',
          status: 'not_paid',
        });
        fetchPayments();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update payment');
      }
    } catch (err) {
      setError('Failed to update payment');
      console.error('Error updating payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await paymentsApi.delete(id);
      
      if (response.data.success) {
        fetchPayments();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to delete payment');
      }
    } catch (err) {
      setError('Failed to delete payment');
      console.error('Error deleting payment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId, newStatus) => {
    try {
      const response = await paymentsApi.update(paymentId, { status: newStatus });
      if (response.data.success) {
        fetchPayments();
      } else {
        setError('Failed to update payment status');
      }
    } catch (err) {
      setError('Failed to update payment status');
      console.error('Error updating payment status:', err);
    }
  };

  const handleEditClick = (payment) => {
    setEditingPayment(payment);
    setFormData({
      groupId: payment.groupId?.toString() || '',
      memberId: payment.memberId?.toString() || '',
      amount: payment.amount?.toString() || '',
      paymentDate: payment.paymentDate || new Date().toISOString().split('T')[0],
      paymentMonth: payment.paymentMonth || new Date().toISOString().slice(0, 7),
      slot: payment.slot || '',
      paymentType: payment.paymentType || 'bank_transfer',
      senderBank: payment.senderBank || '',
      receiverBank: payment.receiverBank || '',
      status: payment.status || 'not_paid',
    });
    setShowForm(true);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'received':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'settled':
        return 'badge-info';
      case 'not_paid':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const getPaymentTypeDisplay = (type) => {
    switch (type) {
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'cash':
        return 'Cash';
      default:
        return type;
    }
  };

  if (loading && payments.length === 0) {
    return (
      <div className="payments">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payments">
      <div className="payments-header">
        <h1>Payments</h1>
        {(user?.role === 'administrator' || user?.role === 'super_user') && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingPayment(null);
              setFormData({
                groupId: '',
                memberId: '',
                amount: '',
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMonth: new Date().toISOString().slice(0, 7),
                slot: '',
                paymentType: 'bank_transfer',
                senderBank: '',
                receiverBank: '',
                status: 'not_paid',
              });
              setShowForm(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Add Payment
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="payments-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search payments..."
            value={filterValue}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fas fa-search"></i>
        </div>

        <button
          className="btn btn-secondary"
          onClick={() => setShowFilters(!showFilters)}
        >
          <i className="fas fa-filter"></i>
          Filters
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Filter by:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="status">Status</option>
              <option value="paymentMonth">Payment Month</option>
              <option value="paymentType">Payment Type</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-sm">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Payments Table */}
      <div className="payments-table-container">
        <table className="payments-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Group</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Payment Month</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>
                  <div className="member-name">
                    <span className="member-avatar">
                      {getDisplayName(payment.member?.firstName, payment.member?.lastName).charAt(0)}
                    </span>
                    <span>{getDisplayName(payment.member?.firstName, payment.member?.lastName)}</span>
                  </div>
                </td>
                <td>{payment.group?.name || '-'}</td>
                <td>{formatCurrency(payment.amount)}</td>
                <td>{formatDate(payment.paymentDate)}</td>
                <td>{formatMonthYear(payment.paymentMonth)}</td>
                <td>{getPaymentTypeDisplay(payment.paymentType)}</td>
                <td>
                  <span className={`badge ${getStatusBadgeClass(payment.status)}`}>
                    {payment.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => setSelectedPayment(payment)}
                      title="View Details"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    {(user?.role === 'administrator' || user?.role === 'super_user') && (
                      <>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleEditClick(payment)}
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeletePayment(payment.id)}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredPayments.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredPayments.length / itemsPerPage)}
          totalItems={filteredPayments.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Add/Edit Payment Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingPayment ? 'Edit Payment' : 'Add New Payment'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingPayment ? handleEditPayment : handleAddPayment} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="groupId">Group *</label>
                  <select
                    id="groupId"
                    name="groupId"
                    value={formData.groupId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Group</option>
                    {groups.map(group => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="memberId">Member *</label>
                  <select
                    id="memberId"
                    name="memberId"
                    value={formData.memberId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Member</option>
                    {/* This would need to be populated based on selected group */}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="amount">Amount (SRD) *</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="paymentDate">Payment Date *</label>
                  <input
                    type="date"
                    id="paymentDate"
                    name="paymentDate"
                    value={formData.paymentDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="paymentMonth">Payment Month *</label>
                  <input
                    type="month"
                    id="paymentMonth"
                    name="paymentMonth"
                    value={formData.paymentMonth}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="paymentType">Payment Type *</label>
                  <select
                    id="paymentType"
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senderBank">Sender Bank</label>
                  <select
                    id="senderBank"
                    name="senderBank"
                    value={formData.senderBank}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.bankName}>
                        {bank.bankName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="receiverBank">Receiver Bank</label>
                  <select
                    id="receiverBank"
                    name="receiverBank"
                    value={formData.receiverBank}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Bank</option>
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.bankName}>
                        {bank.bankName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingPayment ? 'Update Payment' : 'Add Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button onClick={() => setSelectedPayment(null)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-details">
                <div className="detail-row">
                  <strong>Member:</strong> {getDisplayName(selectedPayment.member?.firstName, selectedPayment.member?.lastName)}
                </div>
                <div className="detail-row">
                  <strong>Group:</strong> {selectedPayment.group?.name || '-'}
                </div>
                <div className="detail-row">
                  <strong>Amount:</strong> {formatCurrency(selectedPayment.amount)}
                </div>
                <div className="detail-row">
                  <strong>Payment Date:</strong> {formatDate(selectedPayment.paymentDate)}
                </div>
                <div className="detail-row">
                  <strong>Payment Month:</strong> {formatMonthYear(selectedPayment.paymentMonth)}
                </div>
                <div className="detail-row">
                  <strong>Payment Type:</strong> {getPaymentTypeDisplay(selectedPayment.paymentType)}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`badge ${getStatusBadgeClass(selectedPayment.status)}`}>
                    {selectedPayment.status?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {selectedPayment.senderBank && (
                  <div className="detail-row">
                    <strong>Sender Bank:</strong> {selectedPayment.senderBank}
                  </div>
                )}
                {selectedPayment.receiverBank && (
                  <div className="detail-row">
                    <strong>Receiver Bank:</strong> {selectedPayment.receiverBank}
                  </div>
                )}
                <div className="detail-row">
                  <strong>Created:</strong> {formatDate(selectedPayment.createdAt)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
