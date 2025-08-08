import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  currentStatus: string;
  paymentId: number;
  onStatusChange: (paymentId: number, newStatus: string) => Promise<void>;
  disabled?: boolean;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ 
  currentStatus, 
  paymentId, 
  onStatusChange, 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusOptions = [
    { value: 'not_paid', label: 'Not Paid', class: 'badge-secondary' },
    { value: 'pending', label: 'Pending', class: 'badge-warning' },
    { value: 'received', label: 'Received', class: 'badge-info' },
    { value: 'settled', label: 'Settled', class: 'badge-success' }
  ];

  const getStatusClass = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.class || 'badge-secondary';
  };

  const getStatusBackgroundColor = (status: string) => {
    switch (status) {
      case 'not_paid':
        return '#6c757d'; // Gray
      case 'pending':
        return '#ffc107'; // Yellow
      case 'received':
        return '#17a2b8'; // Blue
      case 'settled':
        return '#28a745'; // Green
      default:
        return '#6c757d'; // Gray
    }
  };

  const getStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option?.label || status.replace('_', ' ').toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus || disabled) return;
    
    // Add confirmation for important status changes
    if ((newStatus === 'received' || newStatus === 'settled') && currentStatus !== 'received' && currentStatus !== 'settled') {
      const confirmed = window.confirm(`Are you sure you want to mark this payment as ${newStatus === 'received' ? 'Received' : 'Settled'}?`);
      if (!confirmed) return;
    }
    
    setIsLoading(true);
    try {
      await onStatusChange(paymentId, newStatus);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="status-dropdown" ref={dropdownRef}>
      <button
        className={`status-badge ${disabled ? 'disabled' : ''}`}
        style={{ backgroundColor: getStatusBackgroundColor(currentStatus) }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isLoading}
        title={disabled ? 'Cannot change status' : 'Click to change status'}
      >
        {isLoading ? (
          <span className="loading-spinner">⏳</span>
        ) : (
          <>
            {getStatusLabel(currentStatus)}
            {!disabled && <ChevronDown size={12} className="chevron" />}
          </>
        )}
      </button>
      
      {isOpen && !disabled && (
        <div className="status-dropdown-menu">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              className={`status-option ${option.value === currentStatus ? 'active' : ''}`}
              onClick={() => handleStatusChange(option.value)}
              disabled={option.value === currentStatus || isLoading}
            >
              <span className={`badge ${option.class}`}>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StatusDropdown; 