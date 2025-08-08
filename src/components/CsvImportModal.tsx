import React, { useState, useCallback, useEffect } from 'react';
import { Member } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
}

interface CsvRow {
  firstname: string;
  lastname: string;
  birthdate: string;
  birthplace: string;
  address: string;
  city: string;
  phonenumber: string;
  email: string;
  nationalid: string;
  nationality: string;
  occupation: string;
  bankname: string;
  accountnumber: string;
  registrationdate: string;
}

const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState('');

  const clearModalState = () => {
    setIsDragOver(false);
    setCsvData([]);
    setErrors([]);
    setIsProcessing(false);
    setFileName('');
  };

  // Clear state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      clearModalState();
    }
  }, [isOpen]);

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validateRow = useCallback((row: any, index: number): string[] => {
    const rowErrors: string[] = [];
    
    if (!row.firstname?.trim()) rowErrors.push(`Row ${index + 1}: First name is required`);
    if (!row.lastname?.trim()) rowErrors.push(`Row ${index + 1}: Last name is required`);
    if (!row.birthdate?.trim()) rowErrors.push(`Row ${index + 1}: Birth date is required`);
    if (!row.birthplace?.trim()) rowErrors.push(`Row ${index + 1}: Birthplace is required`);
    if (!row.address?.trim()) rowErrors.push(`Row ${index + 1}: Address is required`);
    if (!row.city?.trim()) rowErrors.push(`Row ${index + 1}: City is required`);
    if (!row.phonenumber?.trim()) rowErrors.push(`Row ${index + 1}: Phone number is required`);
    if (!row.email?.trim()) rowErrors.push(`Row ${index + 1}: Email is required`);
    if (!row.nationalid?.trim()) rowErrors.push(`Row ${index + 1}: National ID is required`);
    if (!row.nationality?.trim()) rowErrors.push(`Row ${index + 1}: Nationality is required`);
    if (!row.occupation?.trim()) rowErrors.push(`Row ${index + 1}: Occupation is required`);
    if (!row.bankname?.trim()) rowErrors.push(`Row ${index + 1}: Bank name is required`);
    if (!row.accountnumber?.trim()) rowErrors.push(`Row ${index + 1}: Account number is required`);
    
    if (row.email && !validateEmail(row.email)) {
      rowErrors.push(`Row ${index + 1}: Invalid email format`);
    }

    return rowErrors;
  }, [validateEmail]);

  const parseCSV = useCallback((csvText: string): CsvRow[] => {
    // Normalize line endings and split
    const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines
      
      const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Only add rows that have at least some data
      if (Object.values(row).some(value => value && typeof value === 'string' && value.trim())) {
        data.push(row as CsvRow);
      }
    }

    return data;
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrors(['Please select a valid CSV file']);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // Check if the CSV has the expected headers
      const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        setErrors(['CSV file must have at least a header row and one data row']);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = [
        'firstname', 'lastname', 'birthdate', 'birthplace', 'address', 'city', 
        'phonenumber', 'email', 'nationalid', 'nationality', 'occupation', 
        'bankname', 'accountnumber', 'registrationdate'
      ];
      
      const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        setErrors([`CSV file is missing required headers: ${missingHeaders.join(', ')}`]);
        return;
      }
      
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        setErrors(['No valid data found in CSV file']);
        return;
      }

      const validationErrors: string[] = [];
      parsedData.forEach((row, index) => {
        validationErrors.push(...validateRow(row, index));
      });

      setErrors(validationErrors);
      setCsvData(parsedData);
    };

    reader.readAsText(file);
  }, [validateRow, parseCSV]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const handleClose = () => {
    clearModalState();
    onClose();
  };

  const convertCsvToApiFormat = (csvData: CsvRow[]): Omit<Member, 'id' | 'createdAt' | 'updatedAt'>[] => {
    return csvData.map(row => ({
      firstName: row.firstname,
      lastName: row.lastname,
      birthDate: row.birthdate,
      birthplace: row.birthplace,
      address: row.address,
      city: row.city,
      phoneNumber: row.phonenumber,
      email: row.email,
      nationalId: row.nationalid,
      nationality: row.nationality,
      occupation: row.occupation,
      bankName: row.bankname,
      accountNumber: row.accountnumber,
      registrationDate: row.registrationdate || new Date().toISOString().split('T')[0],
    }));
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      return;
    }

    setIsProcessing(true);
         try {
       const apiData = convertCsvToApiFormat(csvData);
       await onImport(apiData);
       clearModalState();
       onClose();
     } catch (error: any) {
       // Error is already handled by the parent component
       // Just close the modal to show the results
       clearModalState();
       onClose();
     } finally {
      setIsProcessing(false);
    }
  };

  const downloadSampleCsv = () => {
    const timestamp = Date.now();
    const sampleData = [
      'firstName,lastName,birthDate,birthplace,address,city,phoneNumber,email,nationalId,nationality,occupation,bankName,accountNumber,registrationDate',
      `John,Doe,1990-01-15,New York,123 Main St,New York,+1234567890,john.doe.${timestamp}@email.com,123456789${timestamp},American,Engineer,Chase Bank,1234567890,2024-01-01`,
      `Jane,Smith,1985-05-20,Los Angeles,456 Oak Ave,Los Angeles,+1987654321,jane.smith.${timestamp}@email.com,987654321${timestamp},American,Designer,Bank of America,0987654321,2024-01-02`
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_members.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

     return (
     <div className="modal-overlay" onClick={handleClose}>
       <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                 <div className="modal-header">
           <h2>Import Members from CSV</h2>
           <button className="modal-close" onClick={handleClose}>&times;</button>
         </div>

        <div className="modal-body">
          <div className="import-section">
            <div className="sample-csv-section">
              <h3>Download Sample CSV</h3>
              <p>Download a sample CSV file to see the required format:</p>
              <button 
                className="btn btn-secondary" 
                onClick={downloadSampleCsv}
              >
                Download Sample CSV
              </button>
            </div>

            <div className="upload-section">
              <h3>Upload CSV File</h3>
              <div
                className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileInput}
                  className="file-input"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="upload-label">
                  <div className="upload-icon">📁</div>
                  <p>Drag and drop your CSV file here, or click to browse</p>
                  {fileName && <p className="file-name">Selected: {fileName}</p>}
                </label>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="validation-errors">
                <h4>Validation Errors:</h4>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index} className="error-item">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {csvData.length > 0 && errors.length === 0 && (
              <div className="preview-section">
                <h4>Preview ({csvData.length} members):</h4>
                <div className="preview-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>National ID</th>
                      </tr>
                    </thead>
                    <tbody>
                                             {csvData.slice(0, 5).map((row, index) => (
                         <tr key={index}>
                           <td>{row.firstname} {row.lastname}</td>
                           <td>{row.email}</td>
                           <td>{row.phonenumber}</td>
                           <td>{row.nationalid}</td>
                         </tr>
                       ))}
                    </tbody>
                  </table>
                  {csvData.length > 5 && (
                    <p className="preview-note">... and {csvData.length - 5} more members</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

                 <div className="modal-footer">
           <button 
             className="btn btn-secondary" 
             onClick={handleClose}
             disabled={isProcessing}
           >
             Cancel
           </button>
          <button 
            className="btn btn-primary" 
            onClick={handleImport}
            disabled={csvData.length === 0 || errors.length > 0 || isProcessing}
          >
            {isProcessing ? 'Importing...' : `Import ${csvData.length} Members`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal; 