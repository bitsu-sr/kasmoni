import React, { useEffect, useState } from 'react';
import { Filter, Search, Plus, Edit, Trash2 } from 'lucide-react';
import { paymentsApi, groupsApi, banksApi } from '../services/api';
import { Payment, Group, GroupMember, Bank } from '../types';
import { formatPaymentDate, formatMonthYear, getCurrentDateString, getCurrentMonthString } from '../utils/dateUtils';
import StatusDropdown from '../components/StatusDropdown';
import BulkPaymentModal from '../components/BulkPaymentModal';
import MonthYearPicker from '../components/MonthYearPicker';
import PaymentDetailsModal from '../components/PaymentDetailsModal';
import Pagination from '../components/Pagination';
import { useAuth } from '../contexts/AuthContext';

const Payments: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [groupMembersWithPaymentStatus, setGroupMembersWithPaymentStatus] = useState<{memberId: number, firstName: string, lastName: string, totalSlots: number, paidSlots: number, isFullyPaid: boolean}[]>([]);
  const [availableSlots, setAvailableSlots] = useState<{value: string, label: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  
  // Multi-select state
  const [selectedPayments, setSelectedPayments] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Payment Details Modal state
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  
  // Filter state
  const [filterType, setFilterType] = useState<'all' | 'paymentMonth' | 'memberName' | 'groupName' | 'status'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showGroupDropdown, setShowGroupDropdown] = useState(false);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Generate month options for the dropdown (current year and next year)
  const generateMonthOptions = () => {
    const options = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    // Add current year months
    for (let month = 0; month < 12; month++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear}-${monthStr}`;
      const monthName = new Date(currentYear, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: yearMonth, label: monthName });
    }
    
    // Add next year months
    for (let month = 0; month < 12; month++) {
      const monthStr = (month + 1).toString().padStart(2, '0');
      const yearMonth = `${currentYear + 1}-${monthStr}`;
      const monthName = new Date(currentYear + 1, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: yearMonth, label: monthName });
    }
    
    return options;
  };
  const [formData, setFormData] = useState({
    groupId: '',
    memberId: '',
    amount: '',
    paymentDate: getCurrentDateString(), // Default to today's date using local timezone
    paymentMonth: getCurrentMonthString(), // Default to current month (YYYY-MM)
    slot: '', // The specific slot/month this payment is for
    paymentType: 'bank_transfer',
    senderBank: '',
    receiverBank: '',
    status: 'not_paid',
  });
  const [isSettingUpEdit, setIsSettingUpEdit] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchGroups();
    fetchBanks();
  }, [user]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowGroupDropdown(false);
      }
    };

    if (showGroupDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupDropdown]);

  // Set default value for payment month filter when filter type changes
  useEffect(() => {
    if (filterType === 'paymentMonth' && !filterValue) {
      setFilterValue(getCurrentMonthString());
      handleFilterChange('paymentMonth', getCurrentMonthString());
    }
  }, [filterType]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      let response;
      
      // Role-based access control
      if (user?.userType === 'member' && user?.memberId) {
        // Members can only see their own payments
        response = await paymentsApi.getByMemberId(user.memberId);
      } else if (user?.role === 'administrator' || user?.role === 'super_user') {
        // Admins and super users can see all payments
        response = await paymentsApi.getAll();
      } else {
        // For other users or unauthenticated users, show empty or error
        setError('Access denied. You need appropriate permissions to view payments.');
        setPayments([]);
        setFilteredPayments([]);
        return;
      }
      
      if (response.data.success && response.data.data) {
        setPayments(response.data.data);
        setFilteredPayments(response.data.data);
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

  const applyFilters = () => {
    if (filterType === 'all' || !filterValue.trim()) {
      setFilteredPayments(payments);
    } else {
      const filtered = payments.filter(payment => {
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
    }
    
    // Reset to first page when filters change
    setCurrentPage(1);
    // Clear selections when filters change
    clearSelections();
  };

  const handleFilterChange = (type: 'all' | 'paymentMonth' | 'memberName' | 'groupName' | 'status', value: string = '') => {
    setFilterType(type);
    
    // Set default value for payment month filter
    if (type === 'paymentMonth' && !value) {
      value = getCurrentMonthString();
    }
    
    setFilterValue(value);
    
    if (type === 'all' || !value.trim()) {
      setFilteredPayments(payments);
    } else {
      // Apply filter immediately
      const filtered = payments.filter(payment => {
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
    // Clear selections when filters change
    clearSelections();
  };

  const clearFilters = () => {
    setFilterType('all');
    setFilterValue('');
    setFilteredPayments(payments);
    setShowGroupDropdown(false);
    setGroupSearchTerm('');
    // Clear selections when filters are cleared
    clearSelections();
  };

  const getFilteredGroups = () => {
    if (!groupSearchTerm.trim()) {
      return groups;
    }
    
    return groups.filter(group => 
      group.name.toLowerCase().includes(groupSearchTerm.toLowerCase())
    );
  };

  const handleGroupSelect = (groupName: string) => {
    setFilterValue(groupName);
    setShowGroupDropdown(false);
    setGroupSearchTerm('');
    handleFilterChange('groupName', groupName);
  };

  const fetchGroups = async () => {
    try {
      const response = await groupsApi.getAll();
      if (response.data.success && response.data.data) {
        setGroups(response.data.data);
      }
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await banksApi.getAll();
      if (response.data.success && response.data.data) {
        setBanks(response.data.data);
      }
    } catch (err) {
      console.error('Error loading banks:', err);
    }
  };

  // Function to get bank short name from full name
  const getBankShortName = (fullBankName: string | undefined): string => {
    if (!fullBankName || !banks.length) return fullBankName || '-';
    
    const bank = banks.find(b => b.bankName === fullBankName);
    return bank ? bank.shortName : fullBankName;
  };

  const fetchGroupMembers = async (groupId: number) => {
    console.log('fetchGroupMembers called with groupId:', groupId);
    try {
      // Fetch group members with payment status
      const paymentStatusResponse = await paymentsApi.getGroupMembers(groupId);
      if (paymentStatusResponse.data.success && paymentStatusResponse.data.data) {
        console.log('Setting groupMembersWithPaymentStatus:', paymentStatusResponse.data.data);
        setGroupMembersWithPaymentStatus(paymentStatusResponse.data.data);
      }
      
      // Also fetch regular group members for backward compatibility
      const response = await groupsApi.getById(groupId);
      if (response.data.success && response.data.data) {
        console.log('Setting groupMembers:', response.data.data.members || []);
        setGroupMembers(response.data.data.members || []);
      }
    } catch (err) {
      console.error('Error loading group members:', err);
    }
  };

  const fetchAvailableSlots = async (groupId: number, memberId: number) => {
    console.log('fetchAvailableSlots called with groupId:', groupId, 'memberId:', memberId);
    try {
      const response = await paymentsApi.getSlots(groupId, memberId);
      if (response.data.success && response.data.data) {
        console.log('Setting availableSlots:', response.data.data);
        setAvailableSlots(response.data.data);
      }
    } catch (err) {
      console.error('Error loading available slots:', err);
      setAvailableSlots([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('handleInputChange called:', { name, value, editingPayment: !!editingPayment, isSettingUpEdit });
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If we're setting up the edit form, don't trigger additional logic
    if (isSettingUpEdit) {
      console.log('Setting up edit form, skipping additional logic');
      return;
    }

    // If group is selected, fetch its members and set default amount
    if (name === 'groupId' && value) {
      console.log('Group selected, fetching members for groupId:', value);
      fetchGroupMembers(parseInt(value));
      
      // Only reset member and slot if we're not editing (to preserve edit data)
      if (!editingPayment) {
        console.log('Not editing, resetting member and slot');
        setFormData((prev) => ({ ...prev, memberId: '', slot: '' }));
        setAvailableSlots([]);
        setGroupMembersWithPaymentStatus([]);
      } else {
        console.log('Editing payment, preserving member and slot data');
      }
      
      // Set the amount to the group's monthly amount as default (only if not editing)
      if (!editingPayment) {
        const selectedGroup = groups.find(group => group.id === parseInt(value));
        if (selectedGroup) {
          console.log('Setting amount to group monthly amount:', selectedGroup.monthlyAmount);
          setFormData((prev) => ({ ...prev, amount: selectedGroup.monthlyAmount.toString() }));
        }
      }
    }

    // If member is selected, fetch available slots for this member in this group
    if (name === 'memberId' && value && formData.groupId) {
      console.log('Member selected, fetching slots for memberId:', value);
      fetchAvailableSlots(parseInt(formData.groupId), parseInt(value));
      // Only reset slot if we're not editing
      if (!editingPayment) {
        console.log('Not editing, resetting slot');
        setFormData((prev) => ({ ...prev, slot: '' }));
      } else {
        console.log('Editing payment, preserving slot data');
      }
    }
  };

  const handleTogglePaymentType = () => {
    setFormData((prev) => ({
      ...prev,
      paymentType: prev.paymentType === 'cash' ? 'bank_transfer' : 'cash',
      senderBank: '',
      receiverBank: '',
    }));
  };

    const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.groupId || !formData.memberId) {
      setError('Please select both a group and a member');
      return;
    }

    try {
      setLoading(true);
      const paymentData = {
        groupId: parseInt(formData.groupId),
        memberId: parseInt(formData.memberId),
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMonth: formData.paymentMonth,
        slot: formData.slot, // Add the slot field
        paymentType: formData.paymentType as 'cash' | 'bank_transfer',
        senderBank: formData.senderBank || undefined,
        receiverBank: formData.receiverBank || undefined,
        status: formData.status as Payment['status'],
      };

      if (editingPayment) {
        // Update existing payment
        const response = await paymentsApi.update(editingPayment.id, paymentData);
        if (response.data.success) {
          setEditingPayment(null);
          setIsSettingUpEdit(false); // Reset flag when edit is successful
          setFormData({
            groupId: '',
            memberId: '',
            amount: '',
            paymentDate: getCurrentDateString(),
            paymentMonth: getCurrentMonthString(),
            slot: '',
            paymentType: 'bank_transfer',
            senderBank: '',
            receiverBank: '',
            status: 'not_paid',
          });
          setGroupMembers([]);
          setGroupMembersWithPaymentStatus([]);
          setAvailableSlots([]);
          setShowForm(false);
          setError(null);
          fetchPayments();
        } else {
          setError('Failed to update payment');
        }
      } else {
        // Create new payment
        const response = await paymentsApi.create(paymentData);
        if (response.data.success && response.data.data) {
          const newPayments = [...payments, response.data.data];
          setPayments(newPayments);
          setFilteredPayments(newPayments);
          setFormData({
            groupId: '',
            memberId: '',
            amount: '',
            paymentDate: getCurrentDateString(), // Reset to today's date
            paymentMonth: getCurrentMonthString(), // Reset to current month
            slot: '',
            paymentType: 'bank_transfer',
            senderBank: '',
            receiverBank: '',
            status: 'not_paid',
          });
          setGroupMembers([]);
          setGroupMembersWithPaymentStatus([]);
          setAvailableSlots([]);
          setShowForm(false);
          setError(null);
          fetchPayments(); // Refresh the payments list
        } else {
          setError('Failed to add payment');
        }
      }
    } catch (err) {
      setError(editingPayment ? 'Error updating payment' : 'Error adding payment');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (payment: Payment) => {
    console.log('handleEdit called with payment:', payment);
    setEditingPayment(payment);
    setIsSettingUpEdit(true); // Set flag to true when setting up edit form
    const formDataToSet = {
      groupId: payment.groupId.toString(),
      memberId: payment.memberId.toString(),
      amount: payment.amount.toString(),
      paymentDate: payment.paymentDate,
      paymentMonth: payment.paymentMonth,
      slot: payment.slot || '',
      paymentType: payment.paymentType,
      senderBank: payment.senderBank || '',
      receiverBank: payment.receiverBank || '',
      status: payment.status,
    };
    console.log('Setting form data to:', formDataToSet);
    setFormData(formDataToSet);
    
    // Fetch group members for the selected group
    fetchGroupMembers(payment.groupId);
    // Fetch available slots for the selected member
    fetchAvailableSlots(payment.groupId, payment.memberId);
    setShowForm(true);
    
    // Reset the flag after a short delay to allow the form to be set up
    setTimeout(() => {
      console.log('Resetting isSettingUpEdit flag');
      setIsSettingUpEdit(false);
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setIsSettingUpEdit(false); // Reset flag when cancelling edit
    setFormData({
      groupId: '',
      memberId: '',
      amount: '',
      paymentDate: getCurrentDateString(),
      paymentMonth: getCurrentMonthString(),
      slot: '',
      paymentType: 'bank_transfer',
      senderBank: '',
      receiverBank: '',
      status: 'not_paid',
    });
    setGroupMembers([]);
    setGroupMembersWithPaymentStatus([]);
    setAvailableSlots([]);
    setShowForm(false);
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const payment = payments.find(p => p.id === id);
    const memberName = payment?.member ? `${payment.member.firstName} ${payment.member.lastName}` : 'this payment';
    const amount = payment?.amount ? `SRD ${payment.amount.toFixed(2)}` : 'this payment';
    
    if (window.confirm(`Are you sure you want to move the payment for ${memberName} (${amount}) to the trashbox? You can restore it later from the Payments Trashbox.`)) {
      try {
        setLoading(true);
        const response = await paymentsApi.delete(id);
        if (response.data.success) {
          const updatedPayments = payments.filter(p => p.id !== id);
          setPayments(updatedPayments);
          setFilteredPayments(updatedPayments);
          showSuccessMessage('Payment moved to trashbox successfully! You can restore it from the Payments Trashbox.');
        } else {
          setError('Failed to move payment to trashbox');
        }
      } catch (err) {
        setError('Error moving payment to trashbox');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (paymentId: number, newStatus: string) => {
    try {
      const response = await paymentsApi.updateStatus(paymentId, newStatus as Payment['status']);
      if (response.data.success && response.data.data) {
        // Update the payment in both arrays
        const updatedPayment = response.data.data;
        setPayments(prev => prev.map(payment => 
          payment.id === paymentId ? updatedPayment : payment
        ));
        setFilteredPayments(prev => prev.map(payment => 
          payment.id === paymentId ? updatedPayment : payment
        ));
      } else {
        setError('Failed to update payment status');
      }
    } catch (err) {
      setError('Error updating payment status');
      throw err; // Re-throw to let the component handle the error
    }
  };

  const handleBulkPaymentSuccess = (newPayments: Payment[]) => {
    // Add the new payments to both arrays
    setPayments(prev => [...newPayments, ...prev]);
    setFilteredPayments(prev => [...newPayments, ...prev]);
    
    // Show success message
    showSuccessMessage(`Successfully created ${newPayments.length} payments!`);
  };

  // Multi-select functions
  const handleSelectPayment = (paymentId: number) => {
    setSelectedPayments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPayments(new Set());
      setSelectAll(false);
    } else {
      setSelectedPayments(new Set(filteredPayments.map(p => p.id)));
      setSelectAll(true);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPayments.size === 0) {
      alert('Please select at least one payment to move to trashbox.');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);
    
    if (window.confirm(`Are you sure you want to move ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)}) to the trashbox? You can restore them later from the Payments Trashbox.`)) {
      try {
        setLoading(true);
        
        // Move payments to trashbox one by one
        const deletePromises = selectedPaymentIds.map(id => paymentsApi.delete(id));
        const results = await Promise.all(deletePromises);
        
        // Check if all moves were successful
        const allSuccessful = results.every(result => result.data.success);
        
        if (allSuccessful) {
          // Remove moved payments from both arrays
          setPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
          
          // Clear selections
          setSelectedPayments(new Set());
          setSelectAll(false);
          
          showSuccessMessage(`Successfully moved ${selectedPayments.size} payment(s) to trashbox! You can restore them from the Payments Trashbox.`);
        } else {
          setError('Some payments could not be moved to trashbox');
        }
      } catch (err) {
        setError('Error moving payments to trashbox');
        console.error('Error moving payments to trashbox:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleArchiveSelected = async () => {
    if (selectedPayments.size === 0) {
      alert('Please select at least one payment to archive.');
      return;
    }

    const selectedPaymentIds = Array.from(selectedPayments);
    const selectedPaymentDetails = filteredPayments.filter(p => selectedPaymentIds.includes(p.id));
    
    const memberNames = selectedPaymentDetails.map(p => 
      p.member ? `${p.member.firstName} ${p.member.lastName}` : 'Unknown Member'
    ).join(', ');
    
    const totalAmount = selectedPaymentDetails.reduce((sum, p) => sum + p.amount, 0);
    
    // Ask for archive reason
    const archiveReason = prompt(`Please provide a reason for archiving ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)}):\n\nThis will move the payments to the archive for long-term storage.`);
    
    if (archiveReason !== null) {
      if (window.confirm(`Are you sure you want to archive ${selectedPayments.size} payment(s) for ${memberNames} (Total: SRD ${totalAmount.toFixed(2)})?\n\nReason: ${archiveReason}\n\nThis action will move the payments to the archive for long-term storage.`)) {
        try {
          setLoading(true);
          
          // Archive payments in bulk
          const response = await paymentsApi.bulkArchive(selectedPaymentIds, archiveReason);
          
          if (response.data.success) {
            // Remove archived payments from both arrays
            setPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
            setFilteredPayments(prev => prev.filter(p => !selectedPaymentIds.includes(p.id)));
            
            // Clear selections
            setSelectedPayments(new Set());
            setSelectAll(false);
            
            showSuccessMessage(`Successfully archived ${selectedPayments.size} payment(s)! You can view them in the Archived Payments page.`);
          } else {
            setError(response.data.error || 'Failed to archive payments');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Error archiving payments';
          setError(errorMessage);
          console.error('Error archiving payments:', err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const clearSelections = () => {
    setSelectedPayments(new Set());
    setSelectAll(false);
  };

  // Function to show success message with auto-dismiss
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 10000); // 10 seconds
  };

  const handleRowClick = (payment: Payment) => {
    setSelectedPayment(payment);
  };

  const handleClosePaymentDetails = () => {
    setSelectedPayment(null);
  };

  const handlePaymentUpdated = () => {
    fetchPayments();
    showSuccessMessage('Payment updated successfully!');
  };

  const handlePaymentDeleted = () => {
    fetchPayments();
    showSuccessMessage('Payment deleted successfully!');
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Calculate pagination values
  const totalItems = filteredPayments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPayments = filteredPayments.slice(startIndex, endIndex);

  return (
    <div className="container">
      <h1>Payments</h1>
      {/* Role-based action buttons */}
      {(user?.role === 'administrator' || user?.role === 'super_user') && (
        <div className="mb-3 d-flex gap-2">
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Hide Form' : (editingPayment ? 'Cancel Edit' : 'Add Payment')}
          </button>
          <button className="btn btn-success" onClick={() => setShowBulkModal(true)}>
            <Plus size={16} className="me-2" />
            Bulk Payment
          </button>
        </div>
      )}
      
      {/* Show different message for members */}
      {user?.userType === 'member' && (
        <div className="mb-3">
          <div className="alert alert-info">
            <strong>Viewing your payments only.</strong> You can see all payments registered in your name.
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="filter-container mb-3">
        <div className="filter-header">
          <button 
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            <span className="ms-1">Filters</span>
            {filterType !== 'all' && filterValue && (
              <span className="badge badge-primary ms-2">Active</span>
            )}
          </button>
          {filterType !== 'all' && filterValue && (
            <button 
              className="btn btn-outline-danger btn-sm ms-2"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="filter-content">
            <div className="filter-row">
              <div className="filter-group">
                <label className="filter-label">Filter by:</label>
                <select 
                  value={filterType}
                  onChange={(e) => handleFilterChange(e.target.value as any)}
                  className="form-control form-control-sm"
                >
                  <option value="all">All Payments</option>
                  <option value="paymentMonth">Payment Month</option>
                  <option value="memberName">Member Name</option>
                  <option value="groupName">Group Name</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {filterType !== 'all' && (
                <div className="filter-group">
                  <label className="filter-label">Search:</label>
                  {filterType === 'status' ? (
                    <select
                      value={filterValue}
                      onChange={(e) => handleFilterChange(filterType, e.target.value)}
                      className="form-control form-control-sm"
                    >
                      <option value="">Select status...</option>
                      <option value="not_paid">Not Paid</option>
                      <option value="pending">Pending</option>
                      <option value="received">Received</option>
                      <option value="settled">Settled</option>
                    </select>
                  ) : filterType === 'groupName' ? (
                    <div className="dropdown-container">
                      <div className="search-input-wrapper">
                        <Search size={16} className="search-icon" />
                        <input
                          type="text"
                          placeholder="Search or select group..."
                          value={filterValue}
                          onChange={(e) => {
                            setFilterValue(e.target.value);
                            setGroupSearchTerm(e.target.value);
                            handleFilterChange(filterType, e.target.value);
                          }}
                          onFocus={() => setShowGroupDropdown(true)}
                          className="form-control form-control-sm"
                        />
                      </div>
                      {showGroupDropdown && (
                        <div className="dropdown-menu">
                          <div className="dropdown-header">
                            <input
                              type="text"
                              placeholder="Search groups..."
                              value={groupSearchTerm}
                              onChange={(e) => setGroupSearchTerm(e.target.value)}
                              className="form-control form-control-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <div className="dropdown-items">
                            {getFilteredGroups().map((group) => (
                              <div
                                key={group.id}
                                className="dropdown-item"
                                onClick={() => handleGroupSelect(group.name)}
                              >
                                {group.name}
                              </div>
                            ))}
                            {getFilteredGroups().length === 0 && (
                              <div className="dropdown-item disabled">
                                No groups found
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : filterType === 'paymentMonth' ? (
                    <MonthYearPicker
                      value={filterValue}
                      onChange={(value) => handleFilterChange(filterType, value)}
                      placeholder="Select month..."
                      className="form-control-sm"
                    />
                  ) : (
                    <div className="search-input-wrapper">
                      <Search size={16} className="search-icon" />
                      <input
                        type="text"
                        placeholder={
                          filterType === 'memberName' ? 'e.g., John Smith' :
                          'Enter search term...'
                        }
                        value={filterValue}
                        onChange={(e) => handleFilterChange(filterType, e.target.value)}
                        className="form-control form-control-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {filterType !== 'all' && filterValue && (
              <div className="filter-results-info">
                Showing {filteredPayments.length} of {payments.length} payments
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <form className="card mb-3" onSubmit={handleAddPayment}>
          <div className="card-header">
            <h3>{editingPayment ? 'Edit Payment' : 'Add New Payment'}</h3>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Group *</label>
              <select 
                name="groupId" 
                value={formData.groupId} 
                onChange={handleInputChange} 
                className="form-control" 
                required
              >
                <option value="">Select a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} - SRD {group.monthlyAmount}/month
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Member *</label>
              <select 
                name="memberId" 
                value={formData.memberId} 
                onChange={handleInputChange} 
                className="form-control" 
                required
                disabled={!formData.groupId}
              >
                <option value="">
                  {formData.groupId ? 'Select a member...' : 'Select a group first...'}
                </option>
                {groupMembersWithPaymentStatus
                  .filter(member => {
                    // Show members who have unpaid slots OR if we're editing and this is the current member
                    return !member.isFullyPaid || (editingPayment && member.memberId === editingPayment.memberId);
                  })
                  .map((member) => (
                    <option key={member.memberId} value={member.memberId}>
                      {member.firstName} {member.lastName} ({member.paidSlots}/{member.totalSlots} paid)
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Receive Month *</label>
              <select 
                name="slot" 
                value={formData.slot} 
                onChange={handleInputChange} 
                className="form-control" 
                required
                disabled={!formData.memberId}
              >
                <option value="">
                  {formData.memberId ? 'Select a receive month...' : 'Select a member first...'}
                </option>
                {availableSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount (SRD) *</label>
              <input 
                type="number" 
                name="amount" 
                value={formData.amount} 
                onChange={handleInputChange} 
                className="form-control" 
                step="0.01"
                min="0"
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input 
                type="date" 
                name="paymentDate" 
                value={formData.paymentDate} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              />
            </div>
            <div className="form-group">
              <label className="form-label">Payment Month *</label>
              <select 
                name="paymentMonth" 
                value={formData.paymentMonth} 
                onChange={handleInputChange} 
                className="form-control" 
                required 
              >
                <option value="">Select a month...</option>
                {generateMonthOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-row align-center mb-2">
            <label className="form-label">Payment Type:</label>
            <label style={{ marginLeft: 8 }}>
              <input 
                type="checkbox" 
                checked={formData.paymentType === 'cash'} 
                onChange={handleTogglePaymentType} 
              />
              <span style={{ marginLeft: 4 }}>
                {formData.paymentType === 'cash' ? 'Cash' : 'Bank Transfer'}
              </span>
            </label>
          </div>
          
          {formData.paymentType === 'bank_transfer' && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Sender's Bank</label>
                <select 
                  name="senderBank" 
                  value={formData.senderBank} 
                  onChange={handleInputChange} 
                  className="form-control" 
                >
                  <option value="">Select sender's bank...</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.bankName}>
                      {bank.bankName} ({bank.shortName})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Receiver's Bank</label>
                <select 
                  name="receiverBank" 
                  value={formData.receiverBank} 
                  onChange={handleInputChange} 
                  className="form-control" 
                >
                  <option value="">Select receiver's bank...</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.bankName}>
                      {bank.bankName} ({bank.shortName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange} 
                className="form-control"
              >
                <option value="not_paid">Not Paid</option>
                <option value="pending">Pending</option>
                <option value="received">Received</option>
                <option value="settled">Settled</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <button className="btn btn-success" type="submit" disabled={loading}>
              {loading ? (editingPayment ? 'Updating...' : 'Adding...') : (editingPayment ? 'Update Payment' : 'Add Payment')}
            </button>
            {editingPayment && (
              <button 
                type="button" 
                className="btn btn-secondary ms-2" 
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {successMessage && (
        <div className="alert alert-success mb-3">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div>Loading payments...</div>
      ) : (
        <div className="card">
          {/* Multi-select controls for admins */}
          {(user?.role === 'administrator' || user?.role === 'super_user') && (
            <div className="multi-select-controls p-3 border-bottom">
              <div className="d-flex justify-between align-center">
                <div className="d-flex align-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="form-check-input"
                    title="Select all payments"
                  />
                  <span className="text-muted">
                    {selectedPayments.size > 0 
                      ? `${selectedPayments.size} payment(s) selected`
                      : 'Select payments to delete'
                    }
                  </span>
                </div>
                <div className="d-flex gap-2">
                  {selectedPayments.size > 0 && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={clearSelections}
                    >
                      Clear Selection
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={handleDeleteSelected}
                    disabled={loading || selectedPayments.size === 0}
                    title={selectedPayments.size === 0 ? "Select payments first to move to trashbox" : "Move selected payments to trashbox"}
                  >
                    🗑️ Move to Trashbox ({selectedPayments.size})
                  </button>
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={handleArchiveSelected}
                    disabled={loading || selectedPayments.size === 0}
                    title={selectedPayments.size === 0 ? "Select payments first to archive" : "Archive selected payments"}
                    style={{ 
                      padding: '0.5rem 1rem', 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    📦 Archive ({selectedPayments.size})
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <table className="table">
            <thead>
              <tr>
                {(user?.role === 'administrator' || user?.role === 'super_user') && (
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="form-check-input"
                      title="Select all payments"
                    />
                  </th>
                )}
                <th>Payment Date</th>
                <th>Payment Month</th>
                <th>Receive Month</th>
                <th>Member Name</th>
                <th>Group</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.map((payment) => (
                <tr 
                  key={payment.id} 
                  onClick={() => handleRowClick(payment)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view payment details"
                >
                  {(user?.role === 'administrator' || user?.role === 'super_user') && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedPayments.has(payment.id)}
                        onChange={() => handleSelectPayment(payment.id)}
                        className="form-check-input"
                        title={`Select payment for ${payment.member?.firstName} ${payment.member?.lastName}`}
                      />
                    </td>
                  )}
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
                  <td onClick={(e) => e.stopPropagation()}>
                    {(user?.role === 'administrator' || user?.role === 'super_user') ? (
                      <StatusDropdown
                        currentStatus={payment.status}
                        paymentId={payment.id}
                        onStatusChange={handleStatusChange}
                      />
                    ) : (
                      <span className={`badge ${
                        payment.status === 'received' ? 'badge-success' :
                        payment.status === 'pending' ? 'badge-warning' :
                        payment.status === 'settled' ? 'badge-info' :
                        'badge-danger'
                      }`}>
                        {payment.status === 'received' ? 'Received' :
                         payment.status === 'pending' ? 'Pending' :
                         payment.status === 'settled' ? 'Settled' :
                         'Not Paid'}
                      </span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {(user?.role === 'administrator' || user?.role === 'super_user') ? (
                      <>
                        <button 
                          className="btn btn-sm btn-primary me-1" 
                          onClick={() => handleEdit(payment)}
                          title="Edit Payment"
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
                          onClick={() => handleDelete(payment.id)}
                          title="Delete Payment"
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
                      </>
                    ) : (
                      <span className="text-muted">View only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
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
          
          {filteredPayments.length === 0 && (
            <div className="text-center p-3">
              <p>
                {filterType !== 'all' && filterValue 
                  ? `No payments found matching "${filterValue}" in ${filterType === 'paymentMonth' ? 'payment month' : filterType === 'memberName' ? 'member name' : filterType === 'groupName' ? 'group name' : filterType === 'status' ? 'status' : 'all payments'}.`
                  : 'No payments found. Add your first payment above.'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Bulk Payment Modal */}
              <BulkPaymentModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          onSuccess={handleBulkPaymentSuccess}
        />
        
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={handleClosePaymentDetails}
          onPaymentUpdated={handlePaymentUpdated}
          onPaymentDeleted={handlePaymentDeleted}
        />
      </div>
    );
  };
  
  export default Payments; 