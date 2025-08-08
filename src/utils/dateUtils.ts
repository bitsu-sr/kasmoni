/**
 * Utility functions for handling dates and timezone conversions
 */

/**
 * Converts a UTC date string to local date string without timezone shift
 * This prevents the date from shifting when the original date was stored in UTC
 * but we want to display it as the local date it was intended to represent
 */
export const formatPaymentDate = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse the date string and create a date object
  const date = new Date(dateString);
  
  // Get the local date components (year, month, day) without timezone conversion
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  // Create a new date object using local timezone but with the original date values
  const localDate = new Date(year, month, day);
  
  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats a date string for display in a more compact format
 */
export const formatDateShort = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  
  const localDate = new Date(year, month, day);
  
  return localDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats a month-year string (YYYY-MM) to a readable format
 */
export const formatMonthYear = (monthYear: string): string => {
  if (!monthYear) return '';
  
  const [year, month] = monthYear.split('-').map(Number);
  if (!year || !month) return '';
  
  const date = new Date(year, month - 1);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
};

/**
 * Gets the current date in YYYY-MM-DD format for form inputs
 * Uses local timezone to avoid timezone issues
 */
export const getCurrentDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Gets the current month in YYYY-MM format for form inputs
 */
export const getCurrentMonthString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Formats a timestamp string to local timezone for display
 * Handles UTC timestamps and converts them to local time
 */
export const formatTimestamp = (timestamp: string): {
  date: string;
  time: string;
  full: string;
} => {
  if (!timestamp) return { date: '', time: '', full: '' };
  
  // Parse the UTC timestamp and convert to local time
  // Add 'Z' suffix to indicate UTC timezone if not already present
  const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
  const date = new Date(utcTimestamp);
  
  return {
    date: date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    time: date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    full: date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };
};