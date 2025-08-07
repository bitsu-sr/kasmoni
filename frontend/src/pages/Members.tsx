import React, { useEffect, useState } from 'react';
import { Search, SortAsc, Users } from 'lucide-react';
import { membersApi } from '../services/api';
import { Member } from '../types';
import { useAuth } from '../contexts/AuthContext';
import MemberDetail from '../components/MemberDetail';
import CsvImportModal from '../components/CsvImportModal';

interface MemberWithStatus extends Member {
  paymentStatus?: 'Not Paid' | 'Pending' | 'Paid';
}

const Members: React.FC = () => {
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<MemberWithStatus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [sortBy, setSortBy] = useState<'alphabetical' | 'status'>('alphabetical');
  const { user, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    birthplace: '',
    address: '',
    city: '',
    phoneNumber: '',
    email: '',
    nationalId: '',
    nationality: '',
    occupation: '',
    bankName: '',
    accountNumber: '',
    registrationDate: new Date().toISOString().split('T')[0],
  });

  // Check if user has administrator or super user role
  const isAdministrator = isAuthenticated && user && (user.role === 'administrator' || user.role === 'super_user');

  // Function to show access denied message
  const showAccessDenied = () => {
    alert('Access denied! Please contact the Sranan Kasmoni administrator to add new members');
  };

  useEffect(() => {
    fetchMembers();
  }, [user]);

  const calculateMemberStatus = (paymentStatuses: string[]): 'Not Paid' | 'Pending' | 'Paid' => {
    if (paymentStatuses.length === 0) return 'Not Paid';
    
    const hasPending = paymentStatuses.some(status => 
      status.toLowerCase() === 'pending'
    );
    const hasReceived = paymentStatuses.some(status => 
      status.toLowerCase() === 'received'
    );
    const allPaid = paymentStatuses.every(status => 
      status.toLowerCase() === 'received'
    );
    
    if (allPaid) return 'Paid';
    if (hasPending || hasReceived) return 'Pending';
    return 'Not Paid';
  };

  const getStatusBadgeClass = (status: 'Not Paid' | 'Pending' | 'Paid'): string => {
    switch (status) {
      case 'Paid':
        return 'badge-success';
      case 'Pending':
        return 'badge-warning';
      case 'Not Paid':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      
      // If user is a normal member, only fetch their own data
      if (user?.userType === 'member' && user?.memberId) {
        const response = await membersApi.getById(user.memberId);
        if (response.data.success && response.data.data) {
          const member = response.data.data;
          // For single member, we'll handle status calculation differently
          const memberWithStatus = { ...member, paymentStatus: 'Not Paid' } as MemberWithStatus;
          setMembers([memberWithStatus]);
          setFilteredMembers([memberWithStatus]);
          setError(null);
        } else {
          setError('Failed to fetch your member information');
        }
      } else if (user?.role === 'administrator' || user?.role === 'super_user') {
        // Admins and super users can see all members
        const response = await membersApi.getAll();
        if (response.data.success && response.data.data) {
          const membersWithStatus = await Promise.all(
            response.data.data.map(async (member: Member) => {
              try {
                const groupsResponse = await membersApi.getGroups(member.id);
                if (groupsResponse.data.success && groupsResponse.data.data) {
                  const paymentStatuses = groupsResponse.data.data.map(
                    (group: { paymentStatus: string }) => group.paymentStatus
                  );
                  const status = calculateMemberStatus(paymentStatuses);
                  return { ...member, paymentStatus: status } as MemberWithStatus;
                }
              } catch (err) {
                console.error(`Error fetching groups for member ${member.id}:`, err);
              }
              return { ...member, paymentStatus: 'Not Paid' as const } as MemberWithStatus;
            })
          );
          
          // Filter out any undefined values
          const validMembers = membersWithStatus.filter((member): member is MemberWithStatus => member !== undefined);
          
          setMembers(validMembers);
          const sortedMembers = sortMembers(validMembers);
          setFilteredMembers(sortedMembers);
          setError(null);
        } else {
          setError('Failed to fetch members');
        }
      } else {
        setError('Access denied. You need appropriate permissions to view members.');
        setMembers([]);
        setFilteredMembers([]);
      }
    } catch (err) {
      setError('Error loading members');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortMembers = (membersToSort: MemberWithStatus[]) => {
    return [...membersToSort].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      } else {
        // Sort by status: Not Paid (highest priority) -> Pending -> Paid (lowest priority)
        const statusPriority = {
          'Not Paid': 3,
          'Pending': 2,
          'Paid': 1
        };
        const priorityA = statusPriority[a.paymentStatus || 'Not Paid'];
        const priorityB = statusPriority[b.paymentStatus || 'Not Paid'];
        
        // First sort by status priority (higher priority first)
        if (priorityA !== priorityB) {
          return priorityB - priorityA;
        }
        
        // If same status, sort alphabetically within that status group
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
    });
  };

  const filterMembers = (searchTerm: string) => {
    let filtered = members;
    
    if (searchTerm.trim()) {
      filtered = members.filter(member => {
        const fullName = `${member.firstName} ${member.lastName}`.toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return fullName.includes(searchLower);
      });
    }

    const sortedMembers = sortMembers(filtered);
    setFilteredMembers(sortedMembers);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterMembers(value);
  };

  const handleSortChange = (newSortBy: 'alphabetical' | 'status') => {
    setSortBy(newSortBy);
    filterMembers(searchTerm);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Email validation
    if (name === 'email') {
      if (value === '') {
        setEmailValid(null);
      } else {
        setEmailValid(validateEmail(value));
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailValid) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      const response = await membersApi.create(formData);
      if (response.data.success && response.data.data) {
        const newMemberWithStatus = { ...response.data.data, paymentStatus: 'Not Paid' as const } as MemberWithStatus;
        const newMembers = [...members, newMemberWithStatus];
        setMembers(newMembers);
        setFilteredMembers(newMembers);
        setFormData({
          firstName: '',
          lastName: '',
          birthDate: '',
          birthplace: '',
          address: '',
          city: '',
          phoneNumber: '',
          email: '',
          nationalId: '',
          nationality: '',
          occupation: '',
          bankName: '',
          accountNumber: '',
          registrationDate: new Date().toISOString().split('T')[0],
        });
        setEmailValid(null);
        setShowForm(false);
        setError(null);
      } else {
        setError('Failed to add member');
      }
    } catch (err) {
      setError('Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
  };

  const handleCloseDetail = () => {
    setSelectedMember(null);
  };

  const handleMemberUpdate = (updatedMember: Member) => {
    const updatedMembers = members.map(member => 
      member.id === updatedMember.id ? { ...updatedMember, paymentStatus: member.paymentStatus } as MemberWithStatus : member
    );
    setMembers(updatedMembers);
    setFilteredMembers(updatedMembers);
  };

  const handleMemberDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to permanently delete this member? This action cannot be undone.')) {
      try {
        setLoading(true);
        const response = await membersApi.delete(id);
        if (response.data.success) {
          const updatedMembers = members.filter(member => member.id !== id);
          setMembers(updatedMembers);
          setFilteredMembers(updatedMembers);
          setSelectedMember(null);
        } else {
          setError('Failed to delete member');
        }
      } catch (err) {
        setError('Error deleting member');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCsvImport = async (csvMembers: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // Import members one by one with detailed error tracking
      const importedMembers: Member[] = [];
      const failedMembers: { member: any; error: string }[] = [];
      
      for (let i = 0; i < csvMembers.length; i++) {
        const memberData = csvMembers[i];
        try {
          const response = await membersApi.create(memberData);
          if (response.data.success && response.data.data) {
            importedMembers.push(response.data.data);
          } else {
            failedMembers.push({
              member: memberData,
              error: 'Failed to create member'
            });
          }
        } catch (err: any) {
          let errorMessage = 'Failed to create member';
          
          if (err.response?.data?.error) {
            errorMessage = err.response.data.error;
          } else if (err.message) {
            errorMessage = err.message;
          }
          
          failedMembers.push({
            member: memberData,
            error: errorMessage
          });
        }
      }
      
      // Add successfully imported members to the list
      if (importedMembers.length > 0) {
        const newMembersWithStatus = importedMembers.map(member => ({ ...member, paymentStatus: 'Not Paid' as const } as MemberWithStatus));
        const newMembers = [...members, ...newMembersWithStatus];
        setMembers(newMembers);
        setFilteredMembers(newMembers);
      }
      
      // Show results
      if (failedMembers.length === 0) {
        setError(null);
      } else if (importedMembers.length === 0) {
        // All failed
        const errorDetails = failedMembers.map((f, index) => 
          `Row ${index + 1} (${f.member.firstName} ${f.member.lastName}): ${f.error}`
        ).join('\n');
        setError(`Failed to import all members:\n${errorDetails}`);
      } else {
        // Partial success
        const successCount = importedMembers.length;
        const failCount = failedMembers.length;
        const errorDetails = failedMembers.map((f, index) => 
          `Row ${index + 1} (${f.member.firstName} ${f.member.lastName}): ${f.error}`
        ).join('\n');
        setError(`Partially imported: ${successCount} successful, ${failCount} failed:\n${errorDetails}`);
      }
    } catch (err: any) {
      let errorMessage = 'Error importing members from CSV';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (selectedMember) {
    return (
      <MemberDetail 
        member={selectedMember} 
        onClose={handleCloseDetail}
        onUpdate={handleMemberUpdate}
        onDelete={handleMemberDelete}
      />
    );
  }

  return (
    <div className="container">
      <div className="header-row">
        <h1>
          {user?.userType === 'member' ? 'My Profile' : 'Members'}
        </h1>
        {isAdministrator && (
          <div className="header-actions">
            <button 
              className="btn btn-secondary" 
              onClick={() => setShowImportModal(true)}
            >
              Import CSV
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Hide Form' : 'Add New Member'}
            </button>
          </div>
        )}
      </div>

      {/* Search and Sort Bar - Only show for admins and super users */}
      {isAdministrator && (
        <div className="search-sort-container mb-3">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search members by name..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
          
          <div className="sort-toggle">
            <span className="sort-label">Sort by:</span>
            <div className="sort-buttons">
              <button
                className={`sort-btn ${sortBy === 'alphabetical' ? 'active' : ''}`}
                onClick={() => handleSortChange('alphabetical')}
                title="Sort alphabetically"
              >
                <SortAsc size={16} />
                <span>Name</span>
              </button>
              <button
                className={`sort-btn ${sortBy === 'status' ? 'active' : ''}`}
                onClick={() => handleSortChange('status')}
                title="Sort by payment status"
              >
                <Users size={16} />
                <span>Status</span>
              </button>
            </div>
          </div>
          
          {searchTerm && (
            <div className="search-results-info">
              Showing {filteredMembers.length} of {members.length} members
            </div>
          )}
        </div>
      )}

      {showForm && (
        <form className="card mb-3" onSubmit={handleAddMember}>
          <h3>Add New Member</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Birth Date *</label>
              <input 
                type="date" 
                name="birthDate" 
                value={formData.birthDate} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Birthplace *</label>
              <input 
                type="text" 
                name="birthplace" 
                value={formData.birthplace} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Address *</label>
              <input 
                type="text" 
                name="address" 
                value={formData.address} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">City *</label>
              <input 
                type="text" 
                name="city" 
                value={formData.city} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input 
                type="tel" 
                name="phoneNumber" 
                value={formData.phoneNumber} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <div className="email-input-container">
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className={`form-control ${emailValid === true ? 'valid' : emailValid === false ? 'invalid' : ''}`}
                  required 
                />
                {emailValid === true && (
                  <span className="email-status valid">✓</span>
                )}
                {emailValid === false && (
                  <span className="email-status invalid">✗</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">National ID *</label>
              <input 
                type="text" 
                name="nationalId" 
                value={formData.nationalId} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nationality *</label>
              <input 
                type="text" 
                name="nationality" 
                value={formData.nationality} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Occupation *</label>
              <input 
                type="text" 
                name="occupation" 
                value={formData.occupation} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Bank Name *</label>
              <input 
                type="text" 
                name="bankName" 
                value={formData.bankName} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Account Number *</label>
              <input 
                type="text" 
                name="accountNumber" 
                value={formData.accountNumber} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Registration Date</label>
              <input 
                type="date" 
                name="registrationDate" 
                value={formData.registrationDate} 
                onChange={handleInputChange} 
                className="form-control" 
              />
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={loading || emailValid === false}
            >
              {loading ? 'Adding...' : 'Add Member'}
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

             {error && (
         <div className="alert alert-danger">
           {error.split('\n').map((line, index) => (
             <div key={index}>{line}</div>
           ))}
         </div>
       )}

             {loading && !showForm ? (
         <div className="loading">Loading members...</div>
       ) : (
         <div className="members-container">
           {sortBy === 'status' ? (
             // Group by status when sorting by status
             (() => {
               const groupedMembers = filteredMembers.reduce((groups, member) => {
                 const status = member.paymentStatus || 'Not Paid';
                 if (!groups[status]) {
                   groups[status] = [];
                 }
                 groups[status].push(member);
                 return groups;
               }, {} as Record<string, MemberWithStatus[]>);

               const statusOrder = ['Not Paid', 'Pending', 'Paid'];
               
               return (
                 <>
                   {statusOrder.map(status => {
                     const membersInGroup = groupedMembers[status] || [];
                     if (membersInGroup.length === 0) return null;
                     
                     return (
                       <div key={status} className="status-group">
                         <div className="status-group-header">
                           <h3>{status} Members ({membersInGroup.length})</h3>
                         </div>
                         <div className="members-grid">
                           {membersInGroup.map((member) => (
                             <div 
                               key={member.id} 
                               className="member-tile"
                               onClick={() => handleMemberClick(member)}
                             >
                               <div className="member-info">
                                 <div className="member-header">
                                   <h3>{member.firstName} {member.lastName}</h3>
                                   {member.paymentStatus && (
                                     <span className={`badge ${getStatusBadgeClass(member.paymentStatus)}`}>
                                       {member.paymentStatus}
                                     </span>
                                   )}
                                 </div>
                                 <p><strong>National ID:</strong> {member.nationalId}</p>
                                 <p><strong>Phone:</strong> {member.phoneNumber}</p>
                                 <p><strong>Bank:</strong> {member.bankName}</p>
                                 <p><strong>Account:</strong> {member.accountNumber}</p>
                               </div>
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })}
                 </>
               );
             })()
           ) : (
             // Regular grid when sorting alphabetically
             <div className="members-grid">
               {filteredMembers.map((member) => (
                 <div 
                   key={member.id} 
                   className="member-tile"
                   onClick={() => handleMemberClick(member)}
                 >
                   <div className="member-info">
                     <div className="member-header">
                       <h3>{member.firstName} {member.lastName}</h3>
                       {member.paymentStatus && (
                         <span className={`badge ${getStatusBadgeClass(member.paymentStatus)}`}>
                           {member.paymentStatus}
                         </span>
                       )}
                     </div>
                     <p><strong>National ID:</strong> {member.nationalId}</p>
                     <p><strong>Phone:</strong> {member.phoneNumber}</p>
                     <p><strong>Bank:</strong> {member.bankName}</p>
                     <p><strong>Account:</strong> {member.accountNumber}</p>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </div>
       )}

      {members.length === 0 && !loading && !showForm && (
        <div className="empty-state">
          <p>
            {user?.userType === 'member' 
              ? 'Your member information could not be loaded. Please contact an administrator.'
              : 'No members found. Click "Add New Member" to get started or "Import CSV" to bulk import members.'
            }
          </p>
        </div>
      )}

      <CsvImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleCsvImport}
      />
    </div>
  );
};

export default Members; 