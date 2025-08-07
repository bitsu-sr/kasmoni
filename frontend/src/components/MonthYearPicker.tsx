import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '../utils/dateUtils';

interface MonthYearPickerProps {
  value: string; // Format: YYYY-MM
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  value,
  onChange,
  placeholder = "Select month...",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => {
    if (value) {
      const [year] = value.split('-');
      return parseInt(year);
    }
    return new Date().getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    if (value) {
      const [, month] = value.split('-');
      return parseInt(month);
    }
    return new Date().getMonth() + 1;
  });
  
  const pickerRef = useRef<HTMLDivElement>(null);

  const months = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = currentYear.toString();
    const newValue = `${yearStr}-${monthStr}`;
    onChange(newValue);
    setIsOpen(false);
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setCurrentYear(prev => direction === 'prev' ? prev - 1 : prev + 1);
  };

  const getDisplayValue = () => {
    if (value) {
      return formatMonthYear(value);
    }
    return placeholder;
  };

  const isCurrentMonthSelected = (month: number) => {
    if (!value) return false;
    const [year, monthStr] = value.split('-');
    return parseInt(year) === currentYear && parseInt(monthStr) === month;
  };

  return (
    <div className={`month-year-picker ${className}`} ref={pickerRef}>
      <div 
        className={`picker-input form-control-sm ${disabled ? 'disabled' : ''} ${isOpen ? 'active' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="picker-value">{getDisplayValue()}</span>
        <div className="picker-arrow">▼</div>
      </div>

      {isOpen && (
        <div className="picker-dropdown">
          <div className="picker-header">
            <button 
              className="year-nav-btn"
              onClick={() => handleYearChange('prev')}
              type="button"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="year-display">{currentYear}</span>
            <button 
              className="year-nav-btn"
              onClick={() => handleYearChange('next')}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          
          <div className="month-grid">
            {months.map((month) => (
              <button
                key={month.value}
                className={`month-btn ${isCurrentMonthSelected(month.value) ? 'selected' : ''}`}
                onClick={() => handleMonthSelect(month.value)}
                type="button"
              >
                {month.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthYearPicker; 