export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateNationalId = (nationalId) => {
  return nationalId.length >= 5;
};

export const validateAccountNumber = (accountNumber) => {
  return accountNumber.length >= 5;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'SRD',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getMonthName = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export const calculateLateFee = (dueDate, paymentDate) => {
  const due = new Date(dueDate);
  const payment = new Date(paymentDate);
  const diffTime = payment.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays * 100 : 0; // SRD 100 per day
};


