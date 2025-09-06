import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/invoice-form.css';

const InvoiceForm = ({ addInvoice, invoices, files = [], selectedFileForInvoice, currentUser, onBackToFiles, onInvoiceSubmitted }) => {
  const [users, setUsers] = useState([]);
  const [currentFile, setCurrentFile] = useState('');
  const [additionalFiles, setAdditionalFiles] = useState([]);
  
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientAddress: '',
    bankName: '',
    professionalFees: '',
    advance: '',
    total: 0,
    status: 'pending',
    dueDate: '',
    paymentDate: null,
    notes: '',
    clientGstNumber: '',
    gstApplicable: false,
    gstType: 'CGST_SGST', // 'CGST_SGST' or 'IGST'
    cgstRate: 9,
    sgstRate: 9,
    igstRate: 18,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addAdditionalFile = useCallback(() => {
    setAdditionalFiles(prev => [...prev, '']);
  }, []);

  const removeAdditionalFile = useCallback((index) => {
    setAdditionalFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateAdditionalFile = useCallback((index, fileId) => {
    setAdditionalFiles(prev => prev.map((file, i) => i === index ? fileId : file));
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

  useEffect(() => {
    // Load users from localStorage for admin dropdown
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
    
    // Set currentFile based on selectedFileForInvoice or fallback to first in-progress file
    if (selectedFileForInvoice) {
      setCurrentFile(selectedFileForInvoice.id);
    } else {
      const inProgressFiles = files.filter(file => file.status === 'in-progress');
      if (inProgressFiles.length > 0) {
        setCurrentFile(inProgressFiles[0].id);
      }
    }
  }, [files, selectedFileForInvoice]);

  // Auto-populate client information when currentFile changes
  useEffect(() => {
    if (currentFile) {
      // First try to find in the files array
      let selectedFile = files.find(f => f.id === currentFile);
      
      // If not found in files array, use selectedFileForInvoice (newly created file)
      if (!selectedFile && selectedFileForInvoice && selectedFileForInvoice.id === currentFile) {
        selectedFile = selectedFileForInvoice;
      }
      
      if (selectedFile) {
        setInvoice(prev => ({
          ...prev,
          clientFirstName: selectedFile.clientFirstName || '',
          clientMiddleName: selectedFile.clientMiddleName || '',
          clientLastName: selectedFile.clientLastName || '',
          clientAddress: selectedFile.clientAddress || '',
          bankName: selectedFile.bankName || ''
        }));
      }
    }
  }, [currentFile, files, selectedFileForInvoice]);

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

  const generateInvoiceNumber = useMemo(() => {
    const { gstApplicable } = invoice;
    const financialYear = getFinancialYear();

    let serial = 1;
    
    if (invoices.length > 0) {
      // Filter invoices by type (GST or normal) for separate numbering
      const filteredInvoices = invoices.filter(inv => inv.gstApplicable === gstApplicable);
      
      if (filteredInvoices.length > 0) {
        const sortedInvoices = [...filteredInvoices].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        const lastInvoice = sortedInvoices[0];
        if (lastInvoice?.invoiceNumber) {
          // Extract serial number from different formats
          const match = lastInvoice.invoiceNumber.match(/(\d+)/);
          if (match) {
            const lastSerial = parseInt(match[1], 10);
            if (!isNaN(lastSerial)) {
              serial = lastSerial + 1;
            }
          }
        }
      }
    }

    // New numbering: GST invoices = 01/25-26, Normal invoices = SBI/01/25-26
    if (gstApplicable) {
      // GST invoices: just serial/year
      return `${serial.toString().padStart(2, '0')}/${financialYear}`;
    } else {
      // Normal invoices: bank/serial/year
      const bankShort = getBankShortForm(invoice.bankName) || 'BNK';
      return `${bankShort}/${serial.toString().padStart(2, '0')}/${financialYear}`;
    }
  }, [invoice.gstApplicable, invoice.bankName, invoices, getFinancialYear, getBankShortForm]);

  useEffect(() => {
    if (generateInvoiceNumber) {
      setInvoice(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber }));
    }
  }, [generateInvoiceNumber]);

  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'clientFirstName':
      case 'clientLastName':
        if (!value.trim()) {
          newErrors[name] = 'This field is required';
        } else {
          delete newErrors[name];
        }
        break;
      case 'professionalFees':
      case 'advance':
        if (value !== '' && (isNaN(value) || parseFloat(value) < 0)) {
          newErrors[name] = 'Amount must be a valid positive number';
        } else {
          delete newErrors[name];
        }
        break;
      case 'invoiceDate':
        if (!value) {
          newErrors[name] = 'Invoice date is required';
        } else {
          delete newErrors[name];
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [errors]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    setInvoice(prev => {
      const updated = { 
        ...prev, 
        [name]: type === 'checkbox' ? checked : value 
      };
      
      if (name === 'professionalFees' || name === 'advance') {
        const fees = name === 'professionalFees' ? parseFloat(value) || 0 : parseFloat(updated.professionalFees) || 0;
        const advance = name === 'advance' ? parseFloat(value) || 0 : parseFloat(updated.advance) || 0;
        updated.total = fees - advance;
      }
      
      return updated;
    });
    
    validateField(name, type === 'checkbox' ? checked : value);
  }, [validateField]);

  const validateForm = useCallback(() => {
    const requiredFields = ['clientFirstName', 'clientLastName', 'invoiceDate'];
    const newErrors = {};
    
    requiredFields.forEach(field => {
      if (!invoice[field] || !invoice[field].toString().trim()) {
        newErrors[field] = 'This field is required';
      }
    });
    
    if (invoice.professionalFees !== '' && (isNaN(invoice.professionalFees) || parseFloat(invoice.professionalFees) < 0)) {
      newErrors.professionalFees = 'Amount must be a valid positive number';
    }
    
    if (invoice.advance !== '' && (isNaN(invoice.advance) || parseFloat(invoice.advance) < 0)) {
      newErrors.advance = 'Amount must be a valid positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [invoice]);

  const handleSubmit = useCallback(async (e, isDraft = false) => {
    e.preventDefault();
    
    if (!isDraft && !validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      const invoiceToAdd = {
        ...invoice,
        status: isDraft ? 'draft' : 'pending'
      };
      addInvoice(invoiceToAdd);
      
      // If not a draft and there's a selected file, mark it as completed
      if (!isDraft && currentFile && onInvoiceSubmitted) {
        onInvoiceSubmitted(currentFile);
      }
      
      setInvoice({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        clientFirstName: '',
        clientMiddleName: '',
        clientLastName: '',
        clientAddress: '',
        bankName: '',
        professionalFees: '',
        advance: '',
        total: 0,
        status: 'pending',
        dueDate: '',
        paymentDate: null,
        notes: '',
        clientGstNumber: '',
        gstApplicable: false,
        gstType: 'CGST_SGST',
        cgstRate: 9,
        sgstRate: 9,
        igstRate: 18,
      });
      setErrors({});
    } catch (error) {
      console.error('Failed to add invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [invoice, addInvoice, validateForm, currentFile, onInvoiceSubmitted]);

  const handleSaveAsDraft = useCallback((e) => {
    handleSubmit(e, true);
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="invoice-form page-transition-enter-active">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="invoiceNumber">Invoice Number</label>
          <input
            id="invoiceNumber"
            type="text"
            name="invoiceNumber"
            value={invoice.invoiceNumber}
            onChange={handleChange}
            readOnly
            className="readonly-field"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="invoiceDate">Invoice Date *</label>
          <input
            id="invoiceDate"
            type="date"
            name="invoiceDate"
            value={invoice.invoiceDate}
            onChange={handleChange}
            className={errors.invoiceDate ? 'error' : ''}
            required
          />
          {errors.invoiceDate && <span className="error-message">{errors.invoiceDate}</span>}
        </div>
      </div>


      <div className="client-information-section">
        <h3 className="section-title">Client Information</h3>
        
        <div className="gst-control-section">
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                name="gstApplicable"
                checked={invoice.gstApplicable}
                onChange={handleChange}
                className="toggle-checkbox"
              />
              <span className="toggle-slider"></span>
              GST Invoice
            </label>
            <small>Toggle to enable GST calculations and simplified invoice numbering</small>
          </div>

          {invoice.gstApplicable && (
            <div className="gst-config-panel">
              <div className="form-group">
                <label htmlFor="clientGstNumber">Client GST Number (Optional)</label>
                <input
                  id="clientGstNumber"
                  type="text"
                  name="clientGstNumber"
                  placeholder="Enter GST number (e.g., 27AACFS7539M1ZV)"
                  value={invoice.clientGstNumber}
                  onChange={handleChange}
                  maxLength="15"
                />
                <small>Optional - Will be shown on invoice if provided</small>
              </div>

              <div className="form-group">
                <label htmlFor="gstType">GST Type</label>
                <select
                  id="gstType"
                  name="gstType"
                  value={invoice.gstType}
                  onChange={handleChange}
                  className="gst-type-select"
                >
                  <option value="CGST_SGST">CGST + SGST (Intrastate)</option>
                  <option value="IGST">IGST (Interstate)</option>
                </select>
                <small>Choose based on client's state location</small>
              </div>

              {invoice.gstType === 'CGST_SGST' ? (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cgstRate">CGST Rate (%)</label>
                    <input
                      id="cgstRate"
                      type="number"
                      name="cgstRate"
                      value={invoice.cgstRate}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sgstRate">SGST Rate (%)</label>
                    <input
                      id="sgstRate"
                      type="number"
                      name="sgstRate"
                      value={invoice.sgstRate}
                      onChange={handleChange}
                      min="0"
                      max="20"
                      step="0.5"
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="igstRate">IGST Rate (%)</label>
                  <input
                    id="igstRate"
                    type="number"
                    name="igstRate"
                    value={invoice.igstRate}
                    onChange={handleChange}
                    min="0"
                    max="40"
                    step="0.5"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="client-name-section">
          <label className="section-label">Client Name *</label>
          <div className="name-fields-row">
            <div className="form-group">
              <label htmlFor="clientFirstName">First Name</label>
              <input
                id="clientFirstName"
                type="text"
                name="clientFirstName"
                placeholder="First name"
                value={invoice.clientFirstName}
                onChange={handleChange}
                className={errors.clientFirstName ? 'error' : ''}
                required
              />
              {errors.clientFirstName && <span className="error-message">{errors.clientFirstName}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="clientMiddleName">Middle Name</label>
              <input
                id="clientMiddleName"
                type="text"
                name="clientMiddleName"
                placeholder="Middle name (optional)"
                value={invoice.clientMiddleName}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="clientLastName">Last Name</label>
              <input
                id="clientLastName"
                type="text"
                name="clientLastName"
                placeholder="Last name"
                value={invoice.clientLastName}
                onChange={handleChange}
                className={errors.clientLastName ? 'error' : ''}
                required
              />
              {errors.clientLastName && <span className="error-message">{errors.clientLastName}</span>}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="clientAddress">Client Address</label>
          <textarea
            id="clientAddress"
            name="clientAddress"
            placeholder="Enter client address"
            value={invoice.clientAddress}
            onChange={handleChange}
            rows="3"
          />
        </div>
      </div>

      <div className="project-details-section">
        <h3 className="section-title">File Selection</h3>
        
        {/* Current File - Locked/Pre-selected */}
        <div className="form-group" style={{marginBottom: '1.5rem'}}>
          <label htmlFor="currentFile">Current File *</label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: '2px solid #10b981',
            backgroundColor: '#f0fdf4',
            minHeight: '44px'
          }}>
            <span style={{color: '#059669', fontWeight: '500'}}>
              🔒 {currentFile ? (() => {
                // First try to find in the files array
                let file = files.find(f => f.id === currentFile);
                
                // If not found in files array, use selectedFileForInvoice (newly created file)
                if (!file && selectedFileForInvoice && selectedFileForInvoice.id === currentFile) {
                  file = selectedFileForInvoice;
                }
                
                return file ? `📁 ${file.fileNumber} - ${file.clientName || `${file.clientFirstName} ${file.clientLastName}`.trim()}` : 'No file selected';
              })() : 'No file selected'}
            </span>
          </div>
          <small style={{color: '#6b7280', marginTop: '4px', display: 'block'}}>
            This is the primary file for this invoice
          </small>
        </div>

        {/* Additional Files Section */}
        {additionalFiles.length > 0 && (
          <div style={{marginBottom: '1rem'}}>
            <h4 style={{color: '#374151', fontSize: '16px', marginBottom: '1rem'}}>Additional Files</h4>
            {additionalFiles.map((additionalFile, index) => (
              <div key={index} className="form-row" style={{alignItems: 'flex-end', marginBottom: '1rem'}}>
                <div className="form-group" style={{flex: 1}}>
                  <label htmlFor={`additional-file-${index}`}>
                    Additional File {index + 1}
                  </label>
                  <select
                    id={`additional-file-${index}`}
                    name={`additional-file-${index}`}
                    value={additionalFile}
                    onChange={(e) => updateAdditionalFile(index, e.target.value)}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      backgroundColor: 'white',
                      minHeight: '44px'
                    }}
                  >
                    <option value="">🔽 Select an additional file</option>
                    {files
                      .filter(file => file.status === 'in-progress' && file.id !== currentFile)
                      .map(file => (
                        <option key={file.id} value={file.id}>
                          📁 {file.fileNumber} - {file.clientName || `${file.clientFirstName} ${file.clientLastName}`.trim()}
                        </option>
                      ))}
                  </select>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeAdditionalFile(index)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '10px 16px',
                    marginLeft: '10px',
                    cursor: 'pointer',
                    minHeight: '44px'
                  }}
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div style={{marginTop: '1rem'}}>
          <button
            type="button"
            onClick={addAdditionalFile}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 16px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            + Add Another File
          </button>
        </div>
      </div>

      <div className="financial-summary-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="professionalFees">Professional Fees (₹)</label>
            <input
              id="professionalFees"
              type="number"
              name="professionalFees"
              placeholder="Enter amount"
              value={invoice.professionalFees}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.professionalFees ? 'error' : ''}
            />
            {errors.professionalFees && <span className="error-message">{errors.professionalFees}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="advance">Advance (₹)</label>
            <input
              id="advance"
              type="number"
              name="advance"
              placeholder="Enter advance amount"
              value={invoice.advance}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={errors.advance ? 'error' : ''}
            />
            {errors.advance && <span className="error-message">{errors.advance}</span>}
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="total">Amount Before GST (₹)</label>
            <input
              id="total"
              type="number"
              name="total"
              value={invoice.total}
              readOnly
              className="readonly-field total-field"
            />
            <small>Professional Fees - Advance</small>
          </div>
        </div>

        {invoice.gstApplicable && (
          <div className="gst-calculations">
            {invoice.gstType === 'CGST_SGST' ? (
              <div className="form-row">
                <div className="form-group">
                  <label>CGST @ {invoice.cgstRate}% (₹)</label>
                  <input
                    type="number"
                    value={(parseFloat(invoice.total || 0) * (parseFloat(invoice.cgstRate || 0) / 100)).toFixed(2)}
                    readOnly
                    className="readonly-field gst-field"
                  />
                </div>
                <div className="form-group">
                  <label>SGST @ {invoice.sgstRate}% (₹)</label>
                  <input
                    type="number"
                    value={(parseFloat(invoice.total || 0) * (parseFloat(invoice.sgstRate || 0) / 100)).toFixed(2)}
                    readOnly
                    className="readonly-field gst-field"
                  />
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label>IGST @ {invoice.igstRate}% (₹)</label>
                <input
                  type="number"
                  value={(parseFloat(invoice.total || 0) * (parseFloat(invoice.igstRate || 0) / 100)).toFixed(2)}
                  readOnly
                  className="readonly-field gst-field"
                />
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="totalWithGst">Total Amount (Including GST) (₹)</label>
              <input
                id="totalWithGst"
                type="number"
                value={(() => {
                  const baseAmount = parseFloat(invoice.total || 0);
                  let gstAmount = 0;
                  
                  if (invoice.gstType === 'CGST_SGST') {
                    gstAmount = baseAmount * (parseFloat(invoice.cgstRate || 0) + parseFloat(invoice.sgstRate || 0)) / 100;
                  } else {
                    gstAmount = baseAmount * (parseFloat(invoice.igstRate || 0) / 100);
                  }
                  
                  return (baseAmount + gstAmount).toFixed(2);
                })()}
                readOnly
                className="readonly-field total-with-gst-field"
              />
              <small>Amount + GST</small>
            </div>
          </div>
        )}

        {!invoice.gstApplicable && (
          <div className="no-gst-notice">
            <p>💡 Toggle "GST Invoice" to enable GST calculations and simplified invoice numbering</p>
          </div>
        )}
      </div>

      <div className="form-buttons">
        <button 
          type="submit" 
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="btn-primary"
        >
          {isSubmitting ? 'Adding Invoice...' : 'Add Invoice'}
        </button>
        <button 
          type="button"
          onClick={onBackToFiles}
          className="back-to-files-btn"
        >
          ← Back to Files
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
