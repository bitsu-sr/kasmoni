import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { membersApi } from '../services/api';
import { Member } from '../types';
import { useAuth } from '../contexts/AuthContext';
import MemberDetail from '../components/MemberDetail';

const MemberDetailPage: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (memberId) {
      fetchMember();
    }
  }, [memberId]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      const response = await membersApi.getById(parseInt(memberId!));
      if (response.data.success && response.data.data) {
        setMember(response.data.data);
      } else {
        setError('Member not found');
      }
    } catch (error) {
      console.error('Error fetching member:', error);
      setError('Failed to load member details');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/members');
  };

  const handleUpdate = (updatedMember: Member) => {
    setMember(updatedMember);
    // You can add a success message here if needed
  };

  const handleDelete = async (id: number) => {
    try {
      await membersApi.delete(id);
      navigate('/members');
    } catch (error) {
      console.error('Error deleting member:', error);
      alert('Failed to delete member');
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

  if (error || !member) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Error</h2>
            <p>{error || 'Member not found'}</p>
            <button className="btn btn-primary" onClick={() => navigate('/members')}>
              <ArrowLeft size={16} />
              Back to Members
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user has permission to view this member
  if (user?.userType === 'member' && user?.memberId !== member.id) {
    return (
      <div className="container">
        <div className="card">
          <div className="text-center">
            <h2>Access Denied</h2>
            <p>You can only view your own member details.</p>
            <button className="btn btn-primary" onClick={() => navigate('/members')}>
              <ArrowLeft size={16} />
              Back to Members
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
              <h1 className="card-title">Member Details</h1>
              <p>View and manage member information</p>
            </div>
            <button className="btn btn-secondary" onClick={handleClose}>
              <ArrowLeft size={16} />
              Back to Members
            </button>
          </div>
        </div>
      </div>
      
      <MemberDetail 
        member={member} 
        onClose={handleClose}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default MemberDetailPage; 