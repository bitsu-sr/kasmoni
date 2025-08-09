import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { groupsApi } from '../services/api.js';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/validation.js';
import Pagination from '../components/Pagination.js';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [editingGroup, setEditingGroup] = useState(null);
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    monthlyAmount: '',
    maxMembers: '',
    duration: '',
    startMonth: '',
    startYear: new Date().getFullYear().toString(),
    startMonthValue: (new Date().getMonth() + 1).toString().padStart(2, '0'),
  });

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getAll({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm
      });
      
      if (response.data.success) {
        const groupsData = response.data.data || [];
        const groupsWithMemberCount = groupsData
          .filter(group => group.id && group.name && group.monthlyAmount !== undefined)
          .map(group => ({
            id: group.id,
            name: group.name,
            monthlyAmount: group.monthlyAmount,
            maxMembers: group.maxMembers,
            duration: group.duration,
            startMonth: group.startMonth,
            endMonth: group.endMonth,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            memberCount: group.memberCount || 0,
            status: group.status,
            pendingCount: group.pendingCount || 0,
            memberNames: group.memberNames || ''
          }));
        
        // Sort groups alphabetically by name
        const sortedGroups = groupsWithMemberCount.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setGroups(sortedGroups);
        setFilteredGroups(sortedGroups);
        setError(null);
      } else {
        setError('Failed to fetch groups');
      }
    } catch (err) {
      setError('Error loading groups');
      console.error('Error fetching groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const isGroupActive = (group) => {
    if (!group.endMonth) return true;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const [endYear, endMonth] = group.endMonth.split('-').map(Number);
    
    if (currentYear < endYear) return true;
    if (currentYear > endYear) return false;
    return currentMonth <= endMonth;
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setCurrentPage(1);
    
    if (!term) {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(group => 
        group.name?.toLowerCase().includes(term.toLowerCase()) ||
        group.memberNames?.toLowerCase().includes(term.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  };

  const calculateEndMonth = (startMonth, duration) => {
    if (!startMonth || !duration) return '';
    
    const [year, month] = startMonth.split('-').map(Number);
    const endDate = new Date(year, month - 1 + duration, 0);
    const endYear = endDate.getFullYear();
    const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
    
    return `${endYear}-${endMonth}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.monthlyAmount || !formData.maxMembers || !formData.duration) {
      return 'Please fill in all required fields';
    }
    
    if (parseFloat(formData.monthlyAmount) <= 0) {
      return 'Monthly amount must be greater than 0';
    }
    
    if (parseInt(formData.maxMembers) <= 0) {
      return 'Maximum members must be greater than 0';
    }
    
    if (parseInt(formData.duration) <= 0) {
      return 'Duration must be greater than 0';
    }
    
    return null;
  };

  const handleAddGroup = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const startMonth = `${formData.startYear}-${formData.startMonthValue}`;
      const endMonth = calculateEndMonth(startMonth, parseInt(formData.duration));
      
      const groupData = {
        name: formData.name,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        maxMembers: parseInt(formData.maxMembers),
        duration: parseInt(formData.duration),
        startMonth: startMonth,
        endMonth: endMonth
      };
      
      const response = await groupsApi.create(groupData);
      
      if (response.data.success) {
        setShowForm(false);
        setFormData({
          name: '',
          monthlyAmount: '',
          maxMembers: '',
          duration: '',
          startMonth: '',
          startYear: new Date().getFullYear().toString(),
          startMonthValue: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        });
        fetchGroups();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to add group');
      }
    } catch (err) {
      setError('Failed to add group');
      console.error('Error adding group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async (e) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const startMonth = `${formData.startYear}-${formData.startMonthValue}`;
      const endMonth = calculateEndMonth(startMonth, parseInt(formData.duration));
      
      const groupData = {
        name: formData.name,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        maxMembers: parseInt(formData.maxMembers),
        duration: parseInt(formData.duration),
        startMonth: startMonth,
        endMonth: endMonth
      };
      
      const response = await groupsApi.update(editingGroup.id, groupData);
      
      if (response.data.success) {
        setEditingGroup(null);
        setShowForm(false);
        setFormData({
          name: '',
          monthlyAmount: '',
          maxMembers: '',
          duration: '',
          startMonth: '',
          startYear: new Date().getFullYear().toString(),
          startMonthValue: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        });
        fetchGroups();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to update group');
      }
    } catch (err) {
      setError('Failed to update group');
      console.error('Error updating group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await groupsApi.delete(id);
      
      if (response.data.success) {
        fetchGroups();
        setError(null);
      } else {
        setError(response.data.error || 'Failed to delete group');
      }
    } catch (err) {
      setError('Failed to delete group');
      console.error('Error deleting group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (group) => {
    setEditingGroup(group);
    const [startYear, startMonth] = group.startMonth ? group.startMonth.split('-') : [new Date().getFullYear().toString(), '01'];
    setFormData({
      name: group.name || '',
      monthlyAmount: group.monthlyAmount?.toString() || '',
      maxMembers: group.maxMembers?.toString() || '',
      duration: group.duration?.toString() || '',
      startMonth: '',
      startYear: startYear,
      startMonthValue: startMonth,
    });
    setShowForm(true);
  };

  const getStatusDisplay = (status, pendingCount) => {
    switch (status) {
      case 'fully_paid':
        return { text: 'Fully Paid', class: 'badge-success' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      case 'pending':
        if (pendingCount && pendingCount > 0) {
          return { text: `Pending: ${pendingCount}`, class: 'badge-warning' };
        }
        return { text: 'Pending', class: 'badge-warning' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  const activeGroups = filteredGroups.filter(group => isGroupActive(group));
  const inactiveGroups = filteredGroups.filter(group => !isGroupActive(group));

  if (loading && groups.length === 0) {
    return (
      <div className="groups">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="groups">
      <div className="groups-header">
        <h1>Groups</h1>
        {(user?.role === 'administrator' || user?.role === 'super_user') && (
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingGroup(null);
              setFormData({
                name: '',
                monthlyAmount: '',
                maxMembers: '',
                duration: '',
                startMonth: '',
                startYear: new Date().getFullYear().toString(),
                startMonthValue: (new Date().getMonth() + 1).toString().padStart(2, '0'),
              });
              setShowForm(true);
            }}
          >
            <i className="fas fa-plus"></i>
            Create Group
          </button>
        )}
      </div>

      {/* Search */}
      <div className="groups-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search groups..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <i className="fas fa-search"></i>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="btn btn-sm">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Active Groups */}
      {activeGroups.length > 0 && (
        <div className="groups-section">
          <h2>Active Groups</h2>
          <div className="groups-grid">
            {activeGroups.map((group) => (
              <div key={group.id} className="group-card active">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                    {getStatusDisplay(group.status, group.pendingCount).text}
                  </span>
                </div>
                <div className="group-details">
                  <p><strong>Monthly Amount:</strong> {formatCurrency(group.monthlyAmount)}</p>
                  <p><strong>Members:</strong> {group.memberCount} / {group.maxMembers}</p>
                  <p><strong>Duration:</strong> {group.duration} months</p>
                  <p><strong>Start Month:</strong> {formatMonthYear(group.startMonth)}</p>
                  <p><strong>End Month:</strong> {formatMonthYear(group.endMonth)}</p>
                  {group.memberNames && (
                    <p><strong>Members:</strong> {group.memberNames}</p>
                  )}
                </div>
                <div className="group-actions">
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                  {(user?.role === 'administrator' || user?.role === 'super_user') && (
                    <>
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleEditClick(group)}
                      >
                        <i className="fas fa-edit"></i>
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Inactive Groups */}
      {inactiveGroups.length > 0 && (
        <div className="groups-section">
          <h2>Inactive Groups</h2>
          <div className="groups-grid">
            {inactiveGroups.map((group) => (
              <div key={group.id} className="group-card inactive">
                <div className="group-header">
                  <h3>{group.name}</h3>
                  <span className="badge badge-secondary">Inactive</span>
                </div>
                <div className="group-details">
                  <p><strong>Monthly Amount:</strong> {formatCurrency(group.monthlyAmount)}</p>
                  <p><strong>Members:</strong> {group.memberCount} / {group.maxMembers}</p>
                  <p><strong>Duration:</strong> {group.duration} months</p>
                  <p><strong>Start Month:</strong> {formatMonthYear(group.startMonth)}</p>
                  <p><strong>End Month:</strong> {formatMonthYear(group.endMonth)}</p>
                </div>
                <div className="group-actions">
                  <button
                    className="btn btn-sm btn-info"
                    onClick={() => setSelectedGroup(group)}
                  >
                    <i className="fas fa-eye"></i>
                    View Details
                  </button>
                  {(user?.role === 'administrator' || user?.role === 'super_user') && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteGroup(group.id)}
                    >
                      <i className="fas fa-trash"></i>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredGroups.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredGroups.length / itemsPerPage)}
          totalItems={filteredGroups.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      )}

      {/* Add/Edit Group Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingGroup ? 'Edit Group' : 'Create New Group'}</h2>
              <button onClick={() => setShowForm(false)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <form onSubmit={editingGroup ? handleEditGroup : handleAddGroup} className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Group Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="monthlyAmount">Monthly Amount (SRD) *</label>
                  <input
                    type="number"
                    id="monthlyAmount"
                    name="monthlyAmount"
                    value={formData.monthlyAmount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="maxMembers">Maximum Members *</label>
                  <input
                    type="number"
                    id="maxMembers"
                    name="maxMembers"
                    value={formData.maxMembers}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="duration">Duration (months) *</label>
                  <input
                    type="number"
                    id="duration"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startMonthValue">Start Month *</label>
                  <select
                    id="startMonthValue"
                    name="startMonthValue"
                    value={formData.startMonthValue}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="01">January</option>
                    <option value="02">February</option>
                    <option value="03">March</option>
                    <option value="04">April</option>
                    <option value="05">May</option>
                    <option value="06">June</option>
                    <option value="07">July</option>
                    <option value="08">August</option>
                    <option value="09">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="startYear">Start Year *</label>
                <input
                  type="number"
                  id="startYear"
                  name="startYear"
                  value={formData.startYear}
                  onChange={handleInputChange}
                  min={new Date().getFullYear()}
                  max={new Date().getFullYear() + 10}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : (editingGroup ? 'Update Group' : 'Create Group')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Group Details</h2>
              <button onClick={() => setSelectedGroup(null)} className="modal-close">
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="group-details-full">
                <div className="detail-row">
                  <strong>Name:</strong> {selectedGroup.name}
                </div>
                <div className="detail-row">
                  <strong>Monthly Amount:</strong> {formatCurrency(selectedGroup.monthlyAmount)}
                </div>
                <div className="detail-row">
                  <strong>Members:</strong> {selectedGroup.memberCount} / {selectedGroup.maxMembers}
                </div>
                <div className="detail-row">
                  <strong>Duration:</strong> {selectedGroup.duration} months
                </div>
                <div className="detail-row">
                  <strong>Start Month:</strong> {formatMonthYear(selectedGroup.startMonth)}
                </div>
                <div className="detail-row">
                  <strong>End Month:</strong> {formatMonthYear(selectedGroup.endMonth)}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`badge ${getStatusDisplay(selectedGroup.status, selectedGroup.pendingCount).class}`}>
                    {getStatusDisplay(selectedGroup.status, selectedGroup.pendingCount).text}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Created:</strong> {formatDate(selectedGroup.createdAt)}
                </div>
                {selectedGroup.memberNames && (
                  <div className="detail-row">
                    <strong>Members:</strong> {selectedGroup.memberNames}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Groups;
