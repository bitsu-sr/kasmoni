import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Plus, X, Save } from 'lucide-react';
import { banksApi } from '../services/api';
import { Bank } from '../types';
import { formatPaymentDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';

const Banks: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<Bank | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    shortName: '',
    bankAddress: '',
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await banksApi.getAll();
      if (response.data.success && response.data.data) {
        setBanks(response.data.data);
      } else {
        setError('Failed to fetch banks');
      }
    } catch (err) {
      setError('Error loading banks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bankName.trim() || !formData.shortName.trim() || !formData.bankAddress.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to create bank with data:', formData);
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      console.log('Is authenticated:', isAuthenticated);
      
      const response = await banksApi.create(formData);
      console.log('Bank creation response:', response);
      
      if (response.data.success && response.data.data) {
        setBanks([...banks, response.data.data]);
        setFormData({
          bankName: '',
          shortName: '',
          bankAddress: '',
        });
        setShowForm(false);
        setError(null);
      } else {
        console.error('Bank creation failed:', response.data);
        setError(response.data.error || 'Failed to add bank');
      }
    } catch (err: any) {
      console.error('Error adding bank:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
        setError(err.response.data.error || 'Error adding bank');
      } else {
        setError('Error adding bank');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditBank = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingBank || !formData.bankName.trim() || !formData.shortName.trim() || !formData.bankAddress.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await banksApi.update(editingBank.id, formData);
      if (response.data.success && response.data.data) {
        setBanks(banks.map(bank => 
          bank.id === editingBank.id ? response.data.data! : bank
        ));
        setEditingBank(null);
        setFormData({
          bankName: '',
          shortName: '',
          bankAddress: '',
        });
        setError(null);
      } else {
        setError('Failed to update bank');
      }
    } catch (err: any) {
      setError('Error updating bank');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!id) {
      console.error('Bank ID is undefined in handleDeleteBank');
      return;
    }
    
    if (!window.confirm('Are you sure you want to permanently delete this bank?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await banksApi.delete(id);
      if (response.data.success) {
        setBanks(banks.filter(bank => bank.id !== id));
        setError(null);
      } else {
        setError('Failed to delete bank');
      }
    } catch (err: any) {
      setError('Error deleting bank');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (bank: Bank) => {
    if (!bank) {
      console.error('Bank is undefined in handleEditClick');
      return;
    }
    
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName || '',
      shortName: bank.shortName || '',
      bankAddress: bank.bankAddress || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingBank(null);
    setFormData({
      bankName: '',
      shortName: '',
      bankAddress: '',
    });
  };

  const handleCancelAdd = () => {
    setShowForm(false);
    setFormData({
      bankName: '',
      shortName: '',
      bankAddress: '',
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading banks...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header-row">
        <h1>Bank Management</h1>
        <div className="header-actions">
          {!showForm && !editingBank && (user?.role === 'administrator' || user?.role === 'super_user') && (
            <button
              onClick={() => setShowForm(true)}
              className="btn btn-primary"
            >
              <Plus size={16} />
              Add Bank
            </button>
          )}
        </div>
      </div>
      
      {/* Show different message for non-admin users */}
      {isAuthenticated && user && user.role !== 'administrator' && user.role !== 'super_user' && (
        <div className="mb-3">
          <div className="alert alert-info">
            <strong>View only.</strong> Only administrators and super users can add, edit, or delete banks.
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(showForm || editingBank) && (user?.role === 'administrator' || user?.role === 'super_user') && (
        <form className="card mb-3" onSubmit={editingBank ? handleEditBank : handleAddBank}>
          <h3>{editingBank ? 'Edit Bank' : 'Add New Bank'}</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter bank name"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Short Name *</label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter short name"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Bank Address *</label>
              <input
                type="text"
                name="bankAddress"
                value={formData.bankAddress}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Enter bank address"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-success"
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : (editingBank ? 'Update Bank' : 'Add Bank')}
            </button>
            <button
              type="button"
              onClick={editingBank ? handleCancelEdit : handleCancelAdd}
              className="btn btn-secondary"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Banks Table */}
      {loading ? (
        <div className="loading">Loading banks...</div>
      ) : (
        <div className="card">
          <div className="card-header">
            <h3>Banks</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bank Name</th>
                  <th>Short Name</th>
                  <th>Bank Address</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {banks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center">
                      <div className="empty-state">
                        <div className="text-4xl mb-4">🏦</div>
                        <p className="text-lg font-medium mb-2">No banks found</p>
                        <p>Get started by adding your first bank</p>
                        {!showForm && (user?.role === 'administrator' || user?.role === 'super_user') && (
                          <button
                            onClick={() => setShowForm(true)}
                            className="btn btn-primary mt-3"
                          >
                            <Plus size={16} />
                            Add Bank
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  banks.map((bank) => {
                    if (!bank) {
                      return null; // Skip undefined banks
                    }
                    
                    return (
                      <tr key={bank.id}>
                        <td>
                          <strong>{bank.bankName || 'N/A'}</strong>
                        </td>
                        <td>{bank.shortName || 'N/A'}</td>
                        <td>{bank.bankAddress || 'N/A'}</td>
                        <td>{bank.createdAt ? formatPaymentDate(bank.createdAt) : 'N/A'}</td>
                        <td>
                          {(user?.role === 'administrator' || user?.role === 'super_user') ? (
                            <div className="d-flex">
                                                        <button
                            onClick={() => handleEditClick(bank)}
                            className="btn btn-sm btn-primary"
                            title="Edit bank"
                            style={{ 
                              padding: '0.5rem', 
                              minWidth: '2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBank(bank.id)}
                            className="btn btn-sm btn-danger"
                            title="Delete bank"
                            style={{ 
                              padding: '0.5rem', 
                              minWidth: '2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                            </div>
                          ) : (
                            <span className="text-muted">View only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banks; 