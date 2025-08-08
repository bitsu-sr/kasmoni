import React, { useEffect, useState } from 'react';
import { Search, Edit, Trash2 } from 'lucide-react';
import { groupsApi } from '../services/api';
import { Group, GroupStatus } from '../types';
import GroupDetail from '../components/GroupDetail';
import { useAuth } from '../contexts/AuthContext';

interface GroupWithMemberCount extends Group {
  memberCount: number;
  status?: GroupStatus;
  pendingCount?: number;
  memberNames?: string;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupWithMemberCount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
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

  // Function to determine if a group is active or inactive
  const isGroupActive = (group: GroupWithMemberCount): boolean => {
    if (!group.endMonth) return true; // If no end month, consider active
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11
    
    const [endYear, endMonth] = group.endMonth.split('-').map(Number);
    
    // Group is active if current date is before or equal to end month
    if (currentYear < endYear) return true;
    if (currentYear > endYear) return false;
    return currentMonth <= endMonth;
  };

  // Separate groups into active and inactive
  const activeGroups = filteredGroups.filter(group => isGroupActive(group));
  const inactiveGroups = filteredGroups.filter(group => !isGroupActive(group));

  useEffect(() => {
    fetchGroups();
  }, [user]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await groupsApi.getAll();
      if (response.data.success && response.data.data) {
        // The backend now provides memberCount, status, pendingCount, and memberNames directly
        const groupsWithMemberCount = response.data.data
          .filter((group: any) => group.id && group.name && group.monthlyAmount !== undefined)
          .map((group: any) => ({
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
          })) as GroupWithMemberCount[];
        

        
        // Sort groups alphabetically by name
        const sortedGroups = groupsWithMemberCount.sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setGroups(sortedGroups);
        setFilteredGroups(sortedGroups);
      } else {
        setError('Failed to fetch groups');
      }
    } catch (err) {
      setError('Error loading groups');
    } finally {
      setLoading(false);
    }
  };

  const filterGroups = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredGroups(groups);
      return;
    }

    const filtered = groups.filter(group => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by group name
      if (group.name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by member names
      if (group.memberNames && group.memberNames.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });

    setFilteredGroups(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterGroups(value);
  };

  const calculateEndMonth = (startMonth: string, duration: number): string => {
    if (!startMonth || !duration) return '';
    
    const [year, month] = startMonth.split('-').map(Number);
    const endMonth = month + duration - 1;
    const endYear = year + Math.floor((endMonth - 1) / 12);
    const finalMonth = ((endMonth - 1) % 12) + 1;
    
    return `${endYear}-${finalMonth.toString().padStart(2, '0')}`;
  };

  const formatMonthYear = (monthYear: string): string => {
    if (!monthYear) return '';
    const [year, month] = monthYear.split('-').map(Number);
    const date = new Date(year, month - 1); // month is 0-indexed in Date constructor
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusDisplay = (status: GroupStatus | undefined, pendingCount?: number) => {
    // Always prioritize backend status first
    switch (status) {
      case 'fully_paid':
        return { text: 'Fully Paid', class: 'badge-success' };
      case 'not_paid':
        return { text: 'Not Paid', class: 'badge-danger' };
      case 'pending':
        // Only show "Pending: X" when backend status is "pending"
        if (pendingCount && pendingCount > 0) {
          return { text: `Pending: ${pendingCount}`, class: 'badge-warning' };
        }
        return { text: 'Pending', class: 'badge-warning' };
      default:
        return { text: 'Unknown', class: 'badge-secondary' };
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Update startMonth when year or month changes
      if (name === 'startYear' || name === 'startMonthValue') {
        updated.startMonth = `${updated.startYear}-${updated.startMonthValue}`;
      }
      
      return updated;
    });
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const groupData = {
        name: formData.name,
        monthlyAmount: parseFloat(formData.monthlyAmount),
        maxMembers: parseInt(formData.maxMembers),
        duration: parseInt(formData.duration),
        startMonth: formData.startMonth,
      };

      const response = await groupsApi.create(groupData);
      if (response.data.success && response.data.data) {
        const newGroup: GroupWithMemberCount = { 
          ...response.data.data, 
          memberCount: 0, 
          status: 'not_paid' as GroupStatus,
          memberNames: ''
        };
        const newGroups = [...groups, newGroup];
        setGroups(newGroups);
        setFilteredGroups(newGroups);
        setFormData({
          name: '',
          monthlyAmount: '',
          maxMembers: '',
          duration: '',
          startMonth: '',
          startYear: new Date().getFullYear().toString(),
          startMonthValue: (new Date().getMonth() + 1).toString().padStart(2, '0'),
        });
        setShowForm(false);
        setError(null);
      } else {
        setError('Failed to add group');
      }
    } catch (err) {
      setError('Error adding group');
    } finally {
      setLoading(false);
    }
  };

  const handleGroupClick = (group: Group) => {
    setSelectedGroup(group);
  };

  const handleCloseDetail = () => {
    setSelectedGroup(null);
  };

  const handleGroupUpdate = (updatedGroup: Group) => {
    const updatedGroups = groups.map(group => 
      group.id === updatedGroup.id ? { ...group, ...updatedGroup } : group
    );
    setGroups(updatedGroups);
    setFilteredGroups(updatedGroups);
  };

  const handleGroupDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this group? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await groupsApi.delete(id);
        if (response.data.success) {
          const updatedGroups = groups.filter(group => group.id !== id);
          setGroups(updatedGroups);
          setFilteredGroups(updatedGroups);
          setSelectedGroup(null);
        } else {
          setError('Failed to delete group');
        }
      } catch (err) {
        setError('Error deleting group');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditGroup = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setSelectedGroup(group);
  };

  const handleDeleteGroup = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    handleGroupDelete(id);
  };

  if (selectedGroup) {
    return (
      <GroupDetail 
        group={selectedGroup} 
        onClose={handleCloseDetail}
        onUpdate={handleGroupUpdate}
        onDelete={handleGroupDelete}
      />
    );
  }

  return (
    <div className="container">
      <div className="header-row">
        <h1>Groups</h1>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide Form' : 'Add New Group'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-container mb-3">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Search groups by name or member names..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        {searchTerm && (
          <div className="search-results-info">
            Showing {filteredGroups.length} of {groups.length} groups
          </div>
        )}
      </div>

      {showForm && (
        <form className="card mb-3" onSubmit={handleAddGroup}>
          <h3>Add New Group</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Group Name *</label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Amount (SRD) *</label>
              <input 
                type="number" 
                name="monthlyAmount" 
                value={formData.monthlyAmount} 
                onChange={handleInputChange} 
                className="form-control" 
                min="0"
                step="0.01"
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Maximum Members *</label>
              <input 
                type="number" 
                name="maxMembers" 
                value={formData.maxMembers} 
                onChange={handleInputChange} 
                className="form-control" 
                min="1"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (months) *</label>
              <input 
                type="number" 
                name="duration" 
                value={formData.duration} 
                onChange={handleInputChange} 
                className="form-control" 
                min="1"
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Start Month *</label>
              <div className="month-year-selector">
                <select 
                  name="startMonthValue" 
                  value={formData.startMonthValue} 
                  onChange={handleInputChange} 
                  className="form-control" 
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
                                 <select 
                   name="startYear" 
                   value={formData.startYear} 
                   onChange={handleInputChange} 
                   className="form-control" 
                   required 
                 >
                   {Array.from({ length: 10 }, (_, i) => {
                     const year = 2021 + i;
                     return (
                       <option key={year} value={year.toString()}>
                         {year}
                       </option>
                     );
                   })}
                 </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">End Month (Calculated)</label>
              <input 
                type="month" 
                value={calculateEndMonth(formData.startMonth, parseInt(formData.duration))} 
                className="form-control" 
                disabled 
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Group'}
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {loading && !showForm ? (
        <div className="loading">Loading groups...</div>
      ) : (
        <>
          {activeGroups.length > 0 && (
            <div className="mb-4">
              <h2>Active Groups</h2>
              <div className="groups-grid">
                {activeGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className="group-tile"
                    onClick={() => handleGroupClick(group)}
                  >
                    <div className="group-header">
                      <h3>{group.name}</h3>
                      <div className="group-actions">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={(e) => handleEditGroup(e, group)}
                          title="Edit Group"
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
                          className="btn btn-sm btn-danger"
                          onClick={(e) => handleDeleteGroup(e, group.id)}
                          title="Delete Group"
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
                    </div>
                    <div className="group-info">
                      <div className="group-status-row">
                        <p><strong>Monthly Amount:</strong> SRD {group.monthlyAmount}</p>
                        <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                          {getStatusDisplay(group.status, group.pendingCount).text}
                        </span>
                      </div>
                      <p><strong>Members:</strong> {group.memberCount} / {group.maxMembers}</p>
                      <p><strong>Duration:</strong> {group.duration} months</p>
                      <p><strong>Period:</strong> {formatMonthYear(group.startMonth)} - {formatMonthYear(group.endMonth)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {inactiveGroups.length > 0 && (
            <div className="mb-4">
              <h2>Inactive Groups</h2>
              <div className="groups-grid">
                {inactiveGroups.map((group) => (
                  <div 
                    key={group.id} 
                    className="group-tile inactive-group"
                    onClick={() => handleGroupClick(group)}
                  >
                    <div className="group-header">
                      <h3>{group.name}</h3>
                      <div className="group-actions">
                        <button 
                          className="btn btn-sm btn-primary"
                          onClick={(e) => handleEditGroup(e, group)}
                          title="Edit Group"
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
                          className="btn btn-sm btn-danger"
                          onClick={(e) => handleDeleteGroup(e, group.id)}
                          title="Delete Group"
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
                    </div>
                    <div className="group-info">
                      <div className="group-status-row">
                        <p><strong>Monthly Amount:</strong> SRD {group.monthlyAmount}</p>
                        <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                          {getStatusDisplay(group.status, group.pendingCount).text}
                        </span>
                      </div>
                      <p><strong>Members:</strong> {group.memberCount} / {group.maxMembers}</p>
                      <p><strong>Duration:</strong> {group.duration} months</p>
                      <p><strong>Period:</strong> {formatMonthYear(group.startMonth)} - {formatMonthYear(group.endMonth)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredGroups.length === 0 && !loading && !showForm && (
            <div className="empty-state">
              <p>
                {searchTerm 
                  ? `No groups found matching "${searchTerm}". Try a different search term.`
                  : 'No groups found. Click "Add New Group" to get started.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Groups; 