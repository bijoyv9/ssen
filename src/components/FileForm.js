import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/file-form.css';

const FileForm = ({ onSave, onUpdate, onCancel, onGenerateInvoice, editingFile, files = [], currentUser }) => {
  // Get users from localStorage to populate dropdowns
  const [users, setUsers] = useState([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);
  const [currentEditingFile, setCurrentEditingFile] = useState(editingFile);
  
  // Default banks
  const defaultBanks = [
    { id: 'sbi', bankName: 'STATE BANK OF INDIA' },
    { id: 'pnb', bankName: 'PUNJAB NATIONAL BANK' },
    { id: 'ubi', bankName: 'UNION BANK OF INDIA' },
    { id: 'bom', bankName: 'BANK OF MAHARASHTRA' },
    { id: 'ib', bankName: 'INDIAN BANK' },
    { id: 'boi', bankName: 'BANK OF INDIA' },
    { id: 'cb', bankName: 'CANARA BANK' },
    { id: 'uco', bankName: 'UCO BANK' }
  ];
  
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  }, []);

  const [formData, setFormData] = useState({
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientAddress: '',
    clientCountryCode: '+91',
    clientPhone: '',
    clientEmail: '',
    description: '',
    propertyValue: '',
    remarks: '',
    status: 'in-progress',
    madeBy: currentUser?.fullName || '',
    inspectedBy: '',
    fileDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchName: ''
  });

  const getShortForm = useCallback((name) => {
    if (!name) return '';
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  }, []);

  const getBankShortForm = useCallback((bankName) => {
    const bankMappings = {
      'STATE BANK OF INDIA': 'SBI',
      'PUNJAB NATIONAL BANK': 'PNB',
      'UNION BANK OF INDIA': 'UBI',
      'BANK OF MAHARASHTRA': 'BOM',
      'INDIAN BANK': 'IB',
      'BANK OF INDIA': 'BOI',
      'CANARA BANK': 'CB',
      'UCO BANK': 'UCO'
    };
    return bankMappings[bankName] || 'BNK';
  }, []);

  const getFinancialYear = useCallback(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    if (currentMonth >= 3) {
      return `${currentYear.toString().slice(-2)}-${(currentYear + 1).toString().slice(-2)}`;
    } else {
      return `${(currentYear - 1).toString().slice(-2)}-${currentYear.toString().slice(-2)}`;
    }
  }, []);

  const generateFileNumber = useMemo(() => {
    if (editingFile) {
      return editingFile.fileNumber;
    }

    const financialYear = getFinancialYear();
    let serial = 1;
    
    if (files.length > 0) {
      const sortedFiles = [...files].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      const lastFile = sortedFiles[0];
      if (lastFile?.fileNumber) {
        // Extract serial number from different formats
        const match = lastFile.fileNumber.match(/(\d+)/);
        if (match) {
          const lastSerial = parseInt(match[1], 10);
          if (!isNaN(lastSerial)) {
            serial = lastSerial + 1;
          }
        }
      }
    }

    // New format: BANK/CLIENT/SERIAL/INSPECTOR/MAKER/YEAR
    const bankShort = getBankShortForm(formData.bankName) || 'BNK';
    const clientShort = getShortForm(`${formData.clientFirstName} ${formData.clientLastName}`.trim()) || 'CLT';
    const inspectorShort = getShortForm(formData.inspectedBy) || 'INS';
    const makerShort = getShortForm(formData.madeBy) || 'MKR';
    
    return `${bankShort}/${clientShort}/${serial.toString().padStart(2, '0')}/${inspectorShort}/${makerShort}/${financialYear}`;
  }, [files, editingFile, getFinancialYear, formData.bankName, formData.clientFirstName, formData.clientLastName, formData.inspectedBy, formData.madeBy, getBankShortForm, getShortForm]);

  useEffect(() => {
    if (editingFile) {
      setCurrentEditingFile(editingFile);
    }
  }, [editingFile]);

  useEffect(() => {
    if (currentEditingFile) {
      // Split phone number into country code and phone number
      let countryCode = '+91';
      let phoneNumber = currentEditingFile.clientPhone || '';
      
      if (phoneNumber && phoneNumber.includes(' ')) {
        const parts = phoneNumber.split(' ');
        countryCode = parts[0];
        phoneNumber = parts.slice(1).join(' ');
      }
      
      const formDataWithPhone = {
        ...currentEditingFile,
        clientCountryCode: countryCode,
        clientPhone: phoneNumber
      };
      
      setFormData(formDataWithPhone);
      setInitialFormData(formDataWithPhone);
      setHasChanges(false);
    } else {
      // For new files, set initial form data after first render
      if (formData.clientFirstName || formData.clientLastName || formData.description) {
        setInitialFormData({...formData});
        setHasChanges(false);
      }
    }
  }, [currentEditingFile]);

  useEffect(() => {
    if (generateFileNumber) {
      setFormData(prev => ({ ...prev, fileNumber: generateFileNumber }));
    }
  }, [generateFileNumber]);

  // Set initial form data for new files
  useEffect(() => {
    if (!editingFile && !initialFormData) {
      setInitialFormData({...formData});
      setHasChanges(false);
    }
  }, [formData.madeBy]); // Trigger when currentUser data is loaded

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special validation for phone number when country code is +91
    if (name === 'clientPhone' && formData.clientCountryCode === '+91') {
      // Allow only digits and limit to 10 characters
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length > 10) return; // Don't update if more than 10 digits
      
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
      setHasChanges(true);
      return;
    }
    
    // Convert ALL text fields to uppercase
    const textFields = ['clientFirstName', 'clientMiddleName', 'clientLastName', 'clientAddress', 'clientPhone', 'clientEmail', 'description', 'bankName', 'branchName', 'remarks'];
    const processedValue = textFields.includes(name) ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    setHasChanges(true);
  };

  const createFileData = useCallback(() => {
    // For editing, preserve all original file properties and only update the changed ones
    if (currentEditingFile && currentEditingFile.id) {
      return {
        ...currentEditingFile, // Start with original file data
        ...formData, // Override with form changes
        id: currentEditingFile.id, // Explicitly preserve original ID
        fileNumber: currentEditingFile.fileNumber, // Preserve original file number
        createdAt: currentEditingFile.createdAt, // Preserve original creation date
        updatedAt: new Date().toISOString(),
        propertyValue: parseFloat(formData.propertyValue),
        // Combine country code and phone number for storage
        clientPhone: formData.clientCountryCode && formData.clientPhone ? `${formData.clientCountryCode} ${formData.clientPhone}` : formData.clientPhone,
        // Create combined client name for display purposes
        clientName: `${formData.clientFirstName} ${formData.clientMiddleName || ''} ${formData.clientLastName}`.trim(),
        propertyAddress: formData.description,
        reportMaker: formData.madeBy,
        fileType: 'valuation',
        priority: 'normal'
      };
    } else {
      // For new files, create fresh data
      return {
        ...formData,
        id: Date.now().toString(),
        fileNumber: generateFileNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        propertyValue: parseFloat(formData.propertyValue),
        // Combine country code and phone number for storage
        clientPhone: formData.clientCountryCode && formData.clientPhone ? `${formData.clientCountryCode} ${formData.clientPhone}` : formData.clientPhone,
        // Create combined client name for display purposes
        clientName: `${formData.clientFirstName} ${formData.clientMiddleName || ''} ${formData.clientLastName}`.trim(),
        propertyAddress: formData.description,
        reportMaker: formData.madeBy,
        fileType: 'valuation',
        priority: 'normal'
      };
    }
  }, [formData, currentEditingFile, generateFileNumber]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clientFirstName || !formData.clientLastName || !formData.description || !formData.propertyValue) {
      alert('Please fill in all required fields');
      return;
    }

    const fileData = createFileData();
    
    // Call appropriate callback based on mode
    if (currentEditingFile) {
      // We're in edit mode, call onUpdate if available, otherwise onSave
      if (onUpdate) {
        onUpdate(fileData.id, fileData);
      } else {
        onSave(fileData);
      }
    } else {
      // We're in create mode, call onSave
      onSave(fileData);
      // Switch to edit mode after first successful save
      setCurrentEditingFile(fileData);
    }
    
    
    // Only show save message if there were actual changes
    if (hasChanges) {
      setSaveMessage(currentEditingFile ? 'File updated successfully!' : 'File saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
      setHasChanges(false);
      setInitialFormData({...fileData});
    }
  };

  const handleGenerateInvoice = useCallback(() => {
    if (!formData.clientFirstName || !formData.clientLastName || !formData.description || !formData.propertyValue) {
      alert('Please fill in all required fields before generating invoice');
      return;
    }

    const fileData = createFileData();
    onSave(fileData); // Auto-save the file
    onGenerateInvoice(fileData); // Navigate to invoice creation with the file data
  }, [formData, createFileData, onSave, onGenerateInvoice]);

  const handleStatusUpdate = useCallback((newStatus) => {
    if (!formData.clientFirstName || !formData.clientLastName || !formData.description || !formData.propertyValue) {
      alert('Please fill in all required fields before updating status');
      return;
    }

    // Create file data with the new status
    const fileData = {
      ...createFileData(),
      status: newStatus
    };

    // Call appropriate callback based on mode
    if (currentEditingFile) {
      if (onUpdate) {
        onUpdate(fileData.id, fileData);
      } else {
        onSave(fileData);
      }
    } else {
      onSave(fileData);
      setCurrentEditingFile(fileData);
    }

    // Update form data to reflect the new status
    setFormData(prev => ({ ...prev, status: newStatus }));
    
    // Show success message
    const statusMessages = {
      'hold': 'File marked as Hold',
      'returned': 'File marked as Returned'
    };
    setSaveMessage(statusMessages[newStatus] || 'File status updated');
    setTimeout(() => setSaveMessage(''), 3000);
    setHasChanges(false);
  }, [formData, createFileData, currentEditingFile, onSave, onUpdate, setSaveMessage, setHasChanges]);

  return (
    <div className="file-form-page page-transition-enter-active">
      <div className="file-form-container">
        <div className="file-form-header">
          <h2>{currentEditingFile ? 'Edit File Details' : 'Start a New Report'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="file-form">
          {/* Reference Number and Date */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  name="fileNumber"
                  value={formData.fileNumber || generateFileNumber}
                  readOnly
                  className="readonly-field"
                  style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="fileDate"
                  value={formData.fileDate || new Date().toISOString().split('T')[0]}
                  readOnly
                  className="readonly-field"
                  style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
                />
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="form-section">
            <h3>Client Information</h3>
            <div className="name-fields-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="clientFirstName"
                  value={formData.clientFirstName}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="FIRST NAME"
                  required
                />
              </div>
              <div className="form-group">
                <label>Middle Name</label>
                <input
                  type="text"
                  name="clientMiddleName"
                  value={formData.clientMiddleName}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="MIDDLE NAME"
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="clientLastName"
                  value={formData.clientLastName}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="LAST NAME"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <input
                    type="text"
                    name="clientCountryCode"
                    value={formData.clientCountryCode}
                    onChange={handleInputChange}
                    style={{ width: '70px', textAlign: 'center' }}
                    placeholder="+91"
                  />
                  <input
                    type="tel"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                    style={{ flex: 1 }}
                    placeholder={formData.clientCountryCode === '+91' ? '9876543210' : 'PHONE NUMBER'}
                    maxLength={formData.clientCountryCode === '+91' ? 10 : undefined}
                    pattern={formData.clientCountryCode === '+91' ? '[0-9]{10}' : undefined}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="EMAIL ADDRESS"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="clientAddress"
                value={formData.clientAddress}
                onChange={handleInputChange}
                rows="2"
                style={{ textTransform: 'uppercase' }}
                placeholder="CLIENT ADDRESS"
              />
            </div>
          </div>

          {/* Property Information */}
          <div className="form-section">
            <h3>Property Information</h3>
            <div className="form-row">
              <div className="form-group" style={{ flex: '2' }}>
                <label>Type *</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="PROPERTY TYPE (E.G., LAND & BUILDING, FLAT)"
                  required
                />
              </div>
              <div className="form-group" style={{ flex: '1' }}>
                <label>Value *</label>
                <input
                  type="number"
                  name="propertyValue"
                  value={formData.propertyValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="Property value in ₹"
                  required
                />
              </div>
            </div>
          </div>

          {/* Bank Information */}
          <div className="form-section">
            <h3>Bank Information</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Bank Name</label>
                <select
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleInputChange}
                >
                  <option value="">SELECT BANK</option>
                  {defaultBanks.map(bank => (
                    <option key={bank.id} value={bank.bankName}>
                      {bank.bankName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Branch Name</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  placeholder="BRANCH NAME"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Work Assignment */}
          <div className="form-section">
            <h3>Work Assignment</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Made By *</label>
                <input
                  type="text"
                  name="madeBy"
                  value={formData.madeBy}
                  readOnly
                  className="readonly-field"
                  style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed', textTransform: 'uppercase' }}
                />
              </div>
              <div className="form-group">
                <label>Inspected By</label>
                <select
                  name="inspectedBy"
                  value={formData.inspectedBy}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                >
                  <option value="">SELECT INSPECTOR</option>
                  {users
                    .filter(user => user.role === 'inspector')
                    .map(user => (
                      <option key={user.id} value={user.fullName}>
                        {user.fullName.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows="3"
                style={{ textTransform: 'uppercase' }}
                placeholder="ADDITIONAL REMARKS OR COMMENTS"
              />
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div style={{
                backgroundColor: '#10b981',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '8px',
                margin: '1rem 0',
                fontSize: '14px',
                fontWeight: '500',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                ✓ {saveMessage}
              </div>
            )}
          </div>

          <div className="form-actions">
            <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
              <button type="submit" className="btn-primary">
                {currentEditingFile ? 'Update' : 'Submit'}
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                  color: '#059669', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                  e.target.style.borderColor = 'rgba(16, 185, 129, 0.3)';
                }}
                onClick={handleGenerateInvoice}
              >
                Generate Invoice
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.1)', 
                  color: '#d97706', 
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
                  e.target.style.borderColor = 'rgba(245, 158, 11, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
                  e.target.style.borderColor = 'rgba(245, 158, 11, 0.3)';
                }}
                onClick={() => handleStatusUpdate('hold')}
              >
                Mark as Hold
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                  color: '#dc2626', 
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                }}
                onClick={() => handleStatusUpdate('returned')}
              >
                Return
              </button>
              <button type="button" className="btn-primary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>

      
      <style>{`
        @keyframes fadeIn {
          from { 
            opacity: 0;
            transform: translateY(-10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FileForm;