import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/file-form.css';

const FileForm = ({ onSave, onCancel, editingFile, banks, files = [], currentUser }) => {
  // Get users from localStorage to populate dropdowns
  const [users, setUsers] = useState([]);
  
  // Default banks
  const defaultBanks = [
    { id: 'sbi', bankName: 'STATE BANK OF INDIA' },
    { id: 'pnb', bankName: 'PUNJAB NATIONAL BANK' }
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
    clientPhone: '',
    clientEmail: '',
    description: '',
    propertyValue: '',
    remarks: '',
    status: 'pending',
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
        // Extract serial number from different formats (same algorithm as invoice)
        const match = lastFile.fileNumber.match(/(\d+)/);
        if (match) {
          const lastSerial = parseInt(match[1], 10);
          if (!isNaN(lastSerial)) {
            serial = lastSerial + 1;
          }
        }
      }
    }

    // Simple file numbering: FILE/001/24-25
    return `FILE/${serial.toString().padStart(3, '0')}/${financialYear}`;
  }, [files, editingFile, getFinancialYear]);

  useEffect(() => {
    if (editingFile) {
      setFormData(editingFile);
    }
  }, [editingFile]);

  useEffect(() => {
    if (generateFileNumber) {
      setFormData(prev => ({ ...prev, fileNumber: generateFileNumber }));
    }
  }, [generateFileNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Convert ALL text fields to uppercase
    const textFields = ['clientFirstName', 'clientMiddleName', 'clientLastName', 'clientAddress', 'clientPhone', 'clientEmail', 'description', 'bankName', 'branchName', 'remarks'];
    const processedValue = textFields.includes(name) ? value.toUpperCase() : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.clientFirstName || !formData.clientLastName || !formData.description || !formData.propertyValue) {
      alert('Please fill in all required fields');
      return;
    }

    const fileData = {
      ...formData,
      id: editingFile ? editingFile.id : Date.now().toString(),
      fileNumber: editingFile ? editingFile.fileNumber : generateFileNumber,
      createdAt: editingFile ? editingFile.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      propertyValue: parseFloat(formData.propertyValue),
      // Create combined client name for display purposes
      clientName: `${formData.clientFirstName} ${formData.clientMiddleName || ''} ${formData.clientLastName}`.trim()
    };

    onSave(fileData);
  };

  return (
    <div className="file-form-page">
      <div className="file-form-container">
        <div className="file-form-header">
          <h2>{editingFile ? 'Edit File' : 'Start a New File'}</h2>
          <button className="btn-secondary" onClick={onCancel}>← Back to Home</button>
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
                  placeholder="ENTER FIRST NAME"
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
                  placeholder="ENTER MIDDLE NAME"
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
                  placeholder="ENTER LAST NAME"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="clientPhone"
                  value={formData.clientPhone}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="ENTER PHONE NUMBER"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="clientEmail"
                  value={formData.clientEmail}
                  onChange={handleInputChange}
                  style={{ textTransform: 'uppercase' }}
                  placeholder="ENTER EMAIL ADDRESS"
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
                placeholder="ENTER CLIENT ADDRESS"
              />
            </div>
          </div>

          {/* Property Information */}
          <div className="form-section">
            <h3>Property Information</h3>
            <div className="form-group">
              <label>Property Type *</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                style={{ textTransform: 'uppercase' }}
                placeholder="ENTER PROPERTY TYPE (E.G., LAND & BUILDING, FLAT)"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Property Value *</label>
                <input
                  type="number"
                  name="propertyValue"
                  value={formData.propertyValue}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  placeholder="Enter property value in ₹"
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
                  placeholder="ENTER BRANCH NAME"
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
                >
                  <option value="">Select Inspector</option>
                  {users
                    .filter(user => user.role === 'inspector')
                    .map(user => (
                      <option key={user.id} value={user.fullName}>
                        {user.fullName}
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
                placeholder="ADDITIONAL REMARKS OR COMMENTS..."
              />
            </div>
          </div>

          <div className="form-actions">
            <div className="form-group status-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="action-buttons">
              <button type="submit" className="btn-primary">
                {editingFile ? 'Update File' : 'Create File'}
              </button>
              <button type="button" className="btn-secondary">
                Generate Invoice
              </button>
              <button type="button" className="btn-secondary" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FileForm;