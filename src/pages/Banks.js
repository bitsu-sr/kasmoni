import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { banksApi } from '../services/api';
import '../styles/Banks.css';

const Banks = () => {
  const { user } = useAuth();
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    accountNumber: '',
    accountHolder: '',
    bankCode: '',
    status: 'active'
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await banksApi.getAll();
      if (response.data && response.data.success) {
        setBanks(response.data.data);
      } else {
        setBanks([]);
      }
      setError(null);
    } catch (err) {
      setError('Failed to fetch banks');
      console.error('Banks error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBank) {
        await banksApi.update(editingBank.id, formData);
      } else {
        await banksApi.create(formData);
      }
      setShowModal(false);
      setEditingBank(null);
      resetForm();
      fetchBanks();
    } catch (err) {
      setError('Failed to save bank');
      console.error('Save bank error:', err);
    }
  };

  const handleEdit = (bank) => {
    setEditingBank(bank);
    setFormData({
      name: bank.name,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
      bankCode: bank.bankCode,
      status: bank.status
    });
    setShowModal(true);
  };

  const handleDelete = async (bankId) => {
    if (window.confirm('Are you sure you want to delete this bank?')) {
      try {
        await banksApi.delete(bankId);
        fetchBanks();
      } catch (err) {
        setError('Failed to delete bank');
        console.error('Delete bank error:', err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      accountNumber: '',
      accountHolder: '',
      bankCode: '',
      status: 'active'
    });
  };

  const openNewBankModal = () => {
    setEditingBank(null);
    resetForm();
    setShowModal(true);
  };

  const filteredBanks = banks.filter(bank => {
    const matchesSearch = bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bank.accountHolder.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bank.accountNumber.includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || bank.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="banks-container">
        <div className="loading-spinner">Loading banks...</div>
      </div>
    );
  }

  return (
    <div className="banks-container">
      <div className="banks-header">
        <h1>Bank Management</h1>
        <button onClick={openNewBankModal} className="add-bank-btn">
          + Add New Bank
        </button>
      </div>

      {/* Search and Filter */}
      <div className="banks-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search banks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Banks List */}
      <div className="banks-list">
        {filteredBanks.length === 0 ? (
          <div className="no-banks">
            {searchTerm || filterStatus !== 'all' ? 'No banks match your search criteria' : 'No banks found'}
          </div>
        ) : (
          filteredBanks.map(bank => (
            <div key={bank.id} className={`bank-card ${bank.status}`}>
              <div className="bank-info">
                <div className="bank-name">{bank.name}</div>
                <div className="bank-details">
                  <span className="account-holder">Account: {bank.accountHolder}</span>
                  <span className="account-number">#{bank.accountNumber}</span>
                  <span className="bank-code">Code: {bank.bankCode}</span>
                </div>
                <div className="bank-status">
                  <span className={`status-badge ${bank.status}`}>
                    {bank.status}
                  </span>
                </div>
              </div>
              <div className="bank-actions">
                <button onClick={() => handleEdit(bank)} className="edit-btn">
                  Edit
                </button>
                <button onClick={() => handleDelete(bank.id)} className="delete-btn">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {/* Add/Edit Bank Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingBank ? 'Edit Bank' : 'Add New Bank'}</h2>
              <button onClick={() => setShowModal(false)} className="close-modal">×</button>
            </div>
            <form onSubmit={handleSubmit} className="bank-form">
              <div className="form-group">
                <label>Bank Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Account Holder *</label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                  required
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Bank Code</label>
                <input
                  type="text"
                  value={formData.bankCode}
                  onChange={(e) => setFormData({...formData, bankCode: e.target.value})}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingBank ? 'Update' : 'Create'} Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banks;
