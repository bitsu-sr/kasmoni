import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Users2, Phone, Building2, CreditCard } from 'lucide-react';
import { dashboardApi, membersApi } from '../services/api';
import { GroupWithCurrentRecipient, MemberSlot } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Payouts: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [groupsWithRecipients, setGroupsWithRecipients] = useState<GroupWithCurrentRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      
      // If user is a normal member, only fetch their own group data
      if (user?.userType === 'member' && user?.memberId) {
        // Get the member's slots to find their groups and receive months
        const slotsResponse = await membersApi.getSlots(user.memberId);
        if (slotsResponse.data.success && slotsResponse.data.data) {
          const memberSlots = slotsResponse.data.data as MemberSlot[];
          
          // Get current month in YYYY-MM format
          const currentDate = new Date();
          const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
          
          // Find slots where receive month matches current month
          const currentMonthSlots = memberSlots.filter(slot => slot.receiveMonth === currentMonth);
          
          if (currentMonthSlots.length > 0) {
            // Get all groups with current recipients to find the member's groups
            const allGroupsResponse = await dashboardApi.getGroupsWithCurrentRecipients();
            if (allGroupsResponse.data.success && allGroupsResponse.data.data) {
              const allGroups = allGroupsResponse.data.data;
              
              // Filter to only show groups where the member has a slot this month
              const memberGroups = allGroups.filter(group => 
                currentMonthSlots.some(slot => slot.groupId === group.id)
              );
              
              setGroupsWithRecipients(memberGroups);
              setError(null);
            } else {
              setError('Failed to load your group payout data');
            }
          } else {
            // Member has no slots for current month
            setGroupsWithRecipients([]);
            setError(null);
          }
        } else {
          setError('Failed to load your member information');
        }
      } else if (user?.role === 'administrator' || user?.role === 'super_user') {
        // Admins and super users can see all groups
        const response = await dashboardApi.getGroupsWithCurrentRecipients();
        setGroupsWithRecipients(response.data.data || []);
        setError(null);
      } else {
        setError('Access denied. You need appropriate permissions to view payouts.');
        setGroupsWithRecipients([]);
      }
    } catch (err) {
      setError('Failed to load payout data');
      console.error('Error fetching payout data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
  }, [user]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SRD',
    }).format(amount);
  };

  const handleTileClick = (groupId: number) => {
    navigate(`/payouts/${groupId}`);
  };

  const getStatusDisplay = (status: string | undefined, pendingCount?: number) => {
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

  if (error) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Error</h2>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchPayoutData}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-between align-center">
            <div>
              <h1 className="card-title">
                {user?.userType === 'member' ? 'My Payouts' : 'Payouts'}
              </h1>
              <p>
                {user?.userType === 'member' 
                  ? 'Your current month payout information.'
                  : 'Current month payout recipients for all groups.'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          {groupsWithRecipients.length > 0 ? (
            <div className="grid grid-3">
              {groupsWithRecipients.map((group) => (
                <div 
                  key={group.id} 
                  className="group-tile clickable"
                  onClick={() => handleTileClick(group.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="group-header">
                    <h4>{group.name}</h4>
                    <div className="group-amount">
                      <DollarSign size={20} />
                      <span>{formatCurrency(group.monthlyAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="group-status-row">
                    <span className={`badge ${getStatusDisplay(group.status, group.pendingCount).class}`}>
                      {getStatusDisplay(group.status, group.pendingCount).text}
                    </span>
                  </div>
                  
                  <div className="group-recipient">
                    {group.firstName && group.lastName ? (
                      <>
                        <div className="recipient-info">
                          <strong>Recipient:</strong> {group.firstName} {group.lastName}
                        </div>
                        {group.phoneNumber && (
                          <div className="recipient-contact">
                            <Phone size={16} />
                            <strong>Phone:</strong> {group.phoneNumber}
                          </div>
                        )}
                        {group.bankName && group.accountNumber && (
                          <div className="recipient-bank">
                            <Building2 size={16} />
                            <strong>Bank:</strong> {group.bankName}
                          </div>
                        )}
                        {group.accountNumber && (
                          <div className="recipient-account">
                            <CreditCard size={16} />
                            <strong>Account:</strong> {group.accountNumber}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="no-recipient">
                        <p>No recipient assigned for this month</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p>
                {user?.userType === 'member' 
                  ? 'You have no payouts scheduled for the current month.'
                  : 'No groups found or no recipients assigned for the current month.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payouts; 