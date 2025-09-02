import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/invoice-form.css';

const InvoiceForm = ({ addInvoice, invoices, currentUser }) => {
  const [users, setUsers] = useState([]);
  
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    bankName: '',
    branchName: '',
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientAddress: '',
    reportMaker: currentUser?.role === 'admin' ? '' : currentUser?.fullName || '',
    inspectedBy: '',
    description: '',
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

  const getShortForm = useCallback((name, isBank = false) => {
    if (!name) return '';

    if (isBank) {
      const bankMap = {
        'STATE BANK OF INDIA': 'SBI',
        'PUNJAB NATIONAL BANK': 'PNB',
        'UNITED BANK OF INDIA': 'UBI',
        'BANK OF MAHARASHTRA': 'BOM',
        'HDFC BANK': 'HDFC',
        'ICICI BANK': 'ICICI',
        'AXIS BANK': 'AXIS',
      };
      const upperCaseName = name.toUpperCase();
      if (bankMap[upperCaseName]) {
        return bankMap[upperCaseName];
      }
    }

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

  useEffect(() => {
    // Load users from localStorage for admin dropdown
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  }, []);

  const generateInvoiceNumber = useMemo(() => {
    const { bankName, clientFirstName, clientMiddleName, clientLastName, inspectedBy, reportMaker, gstApplicable } = invoice;
    
    const fullClientName = [clientFirstName, clientMiddleName, clientLastName].filter(name => name.trim()).join(' ');
    
    if (!bankName || !fullClientName || !inspectedBy || !reportMaker) {
      return '';
    }

    const financialYear = getFinancialYear();

    // If GST is applicable, use simple numeric format
    if (gstApplicable) {
      let serial = 1;
      const gstInvoices = invoices.filter(inv => inv.gstApplicable);
      
      if (gstInvoices.length > 0) {
        const sortedGstInvoices = [...gstInvoices].sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        const lastGstInvoice = sortedGstInvoices[0];
        if (lastGstInvoice?.invoiceNumber && lastGstInvoice.invoiceNumber.match(/^\d+\/\d{2}-\d{2}$/)) {
          const parts = lastGstInvoice.invoiceNumber.split('/');
          const lastSerial = parseInt(parts[0], 10);
          if (!isNaN(lastSerial)) {
            serial = lastSerial + 1;
          }
        }
      }
      return `${serial.toString().padStart(2, '0')}/${financialYear}`;
    }

    // Regular non-GST invoice numbering
    const bankShort = getShortForm(bankName, true);
    const clientShort = getShortForm(fullClientName);
    const inspectorShort = getShortForm(inspectedBy);
    const reportMakerShort = getShortForm(reportMaker);

    let serial = 1;
    const nonGstInvoices = invoices.filter(inv => !inv.gstApplicable);
    
    if (nonGstInvoices.length > 0) {
      const sortedInvoices = [...nonGstInvoices].sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      const lastInvoice = sortedInvoices[0];
      if (lastInvoice?.invoiceNumber && lastInvoice.invoiceNumber.includes('/')) {
        const parts = lastInvoice.invoiceNumber.split('/');
        if (parts.length > 2) {
          const lastSerial = parseInt(parts[2], 10);
          if (!isNaN(lastSerial)) {
            serial = lastSerial + 1;
          }
        }
      }
    }

    return `${bankShort}/${clientShort}/${serial}/${inspectorShort}/${reportMakerShort}/${financialYear}`;
  }, [invoice.bankName, invoice.clientFirstName, invoice.clientMiddleName, invoice.clientLastName, invoice.inspectedBy, invoice.reportMaker, invoice.gstApplicable, invoices, getShortForm, getFinancialYear]);

  useEffect(() => {
    if (generateInvoiceNumber) {
      setInvoice(prev => ({ ...prev, invoiceNumber: generateInvoiceNumber }));
    }
  }, [generateInvoiceNumber]);

  const validateField = useCallback((name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'bankName':
      case 'clientFirstName':
      case 'clientLastName':
      case 'reportMaker':
      case 'inspectedBy':
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
    const requiredFields = ['bankName', 'clientFirstName', 'clientLastName', 'reportMaker', 'inspectedBy', 'invoiceDate'];
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
      
      setInvoice({
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        bankName: '',
        branchName: '',
        clientFirstName: '',
        clientMiddleName: '',
        clientLastName: '',
        clientAddress: '',
        reportMaker: currentUser?.role === 'admin' ? '' : currentUser?.fullName || '',
        inspectedBy: '',
        description: '',
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
  }, [invoice, addInvoice, validateForm]);

  const handleSaveAsDraft = useCallback((e) => {
    handleSubmit(e, true);
  }, [handleSubmit]);

  return (
    <form onSubmit={handleSubmit} className="invoice-form">
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

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="bankName">Bank Name *</label>
          <input
            id="bankName"
            type="text"
            name="bankName"
            placeholder="Enter bank name"
            value={invoice.bankName}
            onChange={handleChange}
            className={errors.bankName ? 'error' : ''}
            required
          />
          {errors.bankName && <span className="error-message">{errors.bankName}</span>}
        </div>
        
        <div className="form-group">
          <label htmlFor="branchName">Branch Name</label>
          <input
            id="branchName"
            type="text"
            name="branchName"
            placeholder="Enter branch name"
            value={invoice.branchName}
            onChange={handleChange}
          />
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
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reportMaker">Report Made By *</label>
            {currentUser?.role === 'admin' ? (
              <select
                id="reportMaker"
                name="reportMaker"
                value={invoice.reportMaker}
                onChange={handleChange}
                className={errors.reportMaker ? 'error' : ''}
                required
                style={{
                  padding: '12px',
                  fontSize: '14px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  minHeight: '44px'
                }}
              >
                <option value="">🔽 Select report maker</option>
                {users.map(user => (
                  <option key={user.id} value={user.fullName}>
                    👤 {user.fullName}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="reportMaker"
                type="text"
                name="reportMaker"
                value={currentUser?.fullName || ''}
                readOnly
                className="readonly-field"
                style={{backgroundColor: '#f5f5f5', cursor: 'not-allowed'}}
              />
            )}
            {errors.reportMaker && <span className="error-message">{errors.reportMaker}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="inspectedBy">Inspected By *</label>
            <input
              id="inspectedBy"
              type="text"
              name="inspectedBy"
              placeholder="Enter inspector name"
              value={invoice.inspectedBy}
              onChange={handleChange}
              className={errors.inspectedBy ? 'error' : ''}
              required
            />
            {errors.inspectedBy && <span className="error-message">{errors.inspectedBy}</span>}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description of Services</label>
          <textarea
            id="description"
            name="description"
            placeholder="Enter description of services provided"
            value={invoice.description}
            onChange={handleChange}
            rows="4"
          />
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
          className="submit-btn"
        >
          {isSubmitting ? 'Adding Invoice...' : 'Add Invoice'}
        </button>
        <button 
          type="button"
          onClick={handleSaveAsDraft}
          disabled={isSubmitting}
          className="draft-btn"
        >
          {isSubmitting ? 'Saving Draft...' : 'Save as Draft'}
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
