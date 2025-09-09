import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../styles/invoice-form.css';
import { printInvoice } from '../utils/invoicePrintUtils';

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
    branchName: '',
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

  // Calculation functions
  const calculateTotal = useCallback(() => {
    const fees = parseFloat(invoice.professionalFees) || 0;
    const advance = parseFloat(invoice.advance) || 0;
    return Math.max(0, fees - advance);
  }, [invoice.professionalFees, invoice.advance]);

  const calculateTotalWithGST = useCallback(() => {
    const baseAmount = calculateTotal();
    if (!invoice.gstApplicable) return baseAmount;
    
    let gstRate = 0;
    if (invoice.gstType === 'CGST_SGST') {
      gstRate = (parseFloat(invoice.cgstRate) || 0) + (parseFloat(invoice.sgstRate) || 0);
    } else {
      gstRate = parseFloat(invoice.igstRate) || 0;
    }
    
    return baseAmount + (baseAmount * gstRate / 100);
  }, [calculateTotal, invoice.gstApplicable, invoice.gstType, invoice.cgstRate, invoice.sgstRate, invoice.igstRate]);

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
          bankName: selectedFile.bankName || '',
          branchName: selectedFile.branchName || ''
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
        status: isDraft ? 'draft' : 'pending',
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        currentFile: files.find(f => f.id === currentFile),
        additionalFiles: additionalFiles.map(id => files.find(f => f.id === id)).filter(Boolean),
        calculatedTotal: invoice.gstApplicable ? calculateTotalWithGST() : calculateTotal(),
        clientFullName: [invoice.clientFirstName, invoice.clientMiddleName, invoice.clientLastName].filter(Boolean).join(' ')
      };
      addInvoice(invoiceToAdd);
      
      // If not a draft and there's a selected file, mark it as completed
      console.log('Invoice submission debug:', { 
        isDraft, 
        currentFile, 
        onInvoiceSubmitted: !!onInvoiceSubmitted,
        calculatedTotal: invoiceToAdd.calculatedTotal 
      });
      
      if (!isDraft && currentFile && onInvoiceSubmitted) {
        console.log('Calling onInvoiceSubmitted with:', currentFile, invoiceToAdd.calculatedTotal);
        onInvoiceSubmitted(currentFile, invoiceToAdd.calculatedTotal);
      } else {
        console.log('onInvoiceSubmitted NOT called because:', {
          isDraft,
          hasCurrentFile: !!currentFile,
          hasCallback: !!onInvoiceSubmitted
        });
      }
      
      // Show success message
      alert(`Invoice ${isDraft ? 'draft saved' : 'submitted'} successfully! Invoice Number: ${invoiceToAdd.invoiceNumber}`);
      
      // Don't reset the form - keep it for reference
      // User can navigate back manually if needed
    } catch (error) {
      console.error('Failed to add invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [invoice, addInvoice, validateForm, currentFile, onInvoiceSubmitted]);

  const handleSaveAsDraft = useCallback((e) => {
    handleSubmit(e, true);
  }, [handleSubmit]);


  const handlePrintInvoice = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    // Auto-submit the invoice first
    try {
      const submissionResult = await addInvoice({
        ...invoice,
        status: 'completed',
        currentFile: files.find(f => f.id === currentFile),
        additionalFiles: additionalFiles.map(id => files.find(f => f.id === id)).filter(Boolean),
        calculatedTotal: invoice.gstApplicable ? calculateTotalWithGST() : calculateTotal()
      });

      // Update the file status to completed with the bill amount
      if (currentFile && onInvoiceSubmitted) {
        onInvoiceSubmitted(currentFile, {
          status: 'completed',
          billAmount: invoice.gstApplicable ? calculateTotalWithGST() : calculateTotal(),
          invoiceId: submissionResult?.id,
          submittedAt: new Date().toISOString()
        });
      }

      // Show success feedback
      alert('✓ Invoice submitted and ready to print!');

    } catch (error) {
      console.error('Failed to submit invoice:', error);
      alert('Failed to submit invoice. Please try again.');
      return;
    }

    // Create invoice data for printing
    const invoiceData = {
      ...invoice,
      currentFile: files.find(f => f.id === currentFile),
      additionalFiles: additionalFiles.map(id => files.find(f => f.id === id)).filter(Boolean),
      calculatedTotal: invoice.gstApplicable ? calculateTotalWithGST() : calculateTotal()
    };

    // Use unified print function
    await printInvoice(invoiceData);
  }, [invoice, validateForm, files, currentFile, additionalFiles, calculateTotal, calculateTotalWithGST, addInvoice, onInvoiceSubmitted]);

  const generateInvoicePrintContent = (invoiceData) => {
    const clientName = [
      invoiceData.clientFirstName,
      invoiceData.clientMiddleName,
      invoiceData.clientLastName
    ].filter(Boolean).join(' ');

    const today = new Date().toLocaleDateString('en-IN');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoiceData.invoiceNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            line-height: 1.6;
            color: #333;
          }
          .company-header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
          .company-info {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 15px;
          }
          .company-logo {
            height: 80px;
            width: 80px;
            object-fit: contain;
            border: 1px solid #ddd;
          }
          .company-name-img {
            height: 60px;
            width: auto;
            object-fit: contain;
            max-width: 400px;
            border: 1px solid #ddd;
          }
          .logo-fallback {
            width: 80px;
            height: 80px;
            border: 2px solid #2c3e50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 14px;
            color: #2c3e50;
          }
          .cname-fallback {
            text-align: center;
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            line-height: 1.2;
          }
          .cname-fallback small {
            font-size: 12px;
            font-weight: normal;
            color: #666;
          }
          .invoice-header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .invoice-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 10px;
          }
          .invoice-title { 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .invoice-details { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px;
          }
          .detail-section h3 { 
            margin-bottom: 10px; 
            font-size: 16px;
            color: #34495e;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 5px;
          }
          .detail-section p { 
            margin: 5px 0; 
            font-size: 14px;
          }
          .files-section { 
            margin: 30px 0;
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
          }
          .files-section h3 {
            color: #2c3e50;
            margin-bottom: 15px;
          }
          .financial-section { 
            margin-top: 30px;
            border-top: 2px solid #333;
            padding-top: 20px;
          }
          .amount-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0;
            padding: 5px 0;
          }
          .total-row { 
            font-weight: bold; 
            font-size: 18px;
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 15px;
          }
          .gst-details {
            background: #e8f5e8;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .notes-section {
            margin-top: 30px;
            background: #fff3cd;
            padding: 15px;
            border-radius: 5px;
          }
          @media print { 
            body { margin: 0; } 
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          <div class="company-info">
            ${invoiceData.logoBase64 ? `<img src="${invoiceData.logoBase64}" alt="Company Logo" class="company-logo" onerror="this.style.display='none'" />` : '<div class="logo-fallback">LOGO</div>'}
            ${invoiceData.cnameBase64 ? `<img src="${invoiceData.cnameBase64}" alt="S. Sen & Associates" class="company-name-img" onerror="this.style.display='none'" />` : '<div class="cname-fallback">S. SEN & ASSOCIATES<br><small>THREE DECADES OF DEDICATION</small></div>'}
          </div>
        </div>
        
        <div class="invoice-header">
          <div class="invoice-title">INVOICE</div>
          <div class="invoice-meta">
            <p><strong>Invoice No:</strong> ${invoiceData.invoiceNumber}</p>
            <p><strong>Date:</strong> ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="detail-section">
            <h3>Bill To:</h3>
            <p><strong>${clientName}</strong></p>
            <p>${invoiceData.clientAddress}</p>
            ${invoiceData.clientGstNumber ? `<p><strong>GST No:</strong> ${invoiceData.clientGstNumber}</p>` : ''}
          </div>
          <div class="detail-section">
            <h3>Invoice Details:</h3>
            <p><strong>Due Date:</strong> ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString('en-IN') : 'N/A'}</p>
            <p><strong>Status:</strong> ${invoiceData.status.toUpperCase()}</p>
            ${invoiceData.bankName ? `<p><strong>Bank:</strong> ${invoiceData.bankName}</p>` : ''}
          </div>
        </div>

        <div class="files-section">
          <h3>Services/Files:</h3>
          ${invoiceData.currentFile ? `<p><strong>Primary File:</strong> ${invoiceData.currentFile.clientName} - ${invoiceData.currentFile.fileType}</p>` : ''}
          ${invoiceData.additionalFiles.length > 0 ? `
            <p><strong>Additional Files:</strong></p>
            <ul>
              ${invoiceData.additionalFiles.map(file => `<li>${file.clientName} - ${file.fileType}</li>`).join('')}
            </ul>
          ` : ''}
        </div>

        <div class="financial-section">
          <div class="amount-row">
            <span>Professional Fees:</span>
            <span>₹${parseFloat(invoiceData.professionalFees || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
          
          ${invoiceData.advance ? `
            <div class="amount-row">
              <span>Less: Advance:</span>
              <span>₹${parseFloat(invoiceData.advance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
            </div>
          ` : ''}

          ${invoiceData.gstApplicable ? `
            <div class="gst-details">
              <h4>GST Details:</h4>
              ${invoiceData.gstType === 'CGST_SGST' ? `
                <div class="amount-row">
                  <span>CGST (${invoiceData.cgstRate}%):</span>
                  <span>₹${(((invoiceData.professionalFees || 0) - (invoiceData.advance || 0)) * (invoiceData.cgstRate / 100)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div class="amount-row">
                  <span>SGST (${invoiceData.sgstRate}%):</span>
                  <span>₹${(((invoiceData.professionalFees || 0) - (invoiceData.advance || 0)) * (invoiceData.sgstRate / 100)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              ` : `
                <div class="amount-row">
                  <span>IGST (${invoiceData.igstRate}%):</span>
                  <span>₹${(((invoiceData.professionalFees || 0) - (invoiceData.advance || 0)) * (invoiceData.igstRate / 100)).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
              `}
            </div>
          ` : ''}

          <div class="amount-row total-row">
            <span>Total Amount:</span>
            <span>₹${invoiceData.calculatedTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
          </div>
        </div>

        ${invoiceData.notes ? `
          <div class="notes-section">
            <h3>Notes:</h3>
            <p>${invoiceData.notes}</p>
          </div>
        ` : ''}

        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #666;">
          <p>Generated on ${today}</p>
        </div>
      </body>
      </html>
    `;
  };

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
        
        {/* GST Configuration Section */}
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
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
        <button 
          type="button"
          onClick={handlePrintInvoice}
          disabled={isSubmitting || Object.keys(errors).length > 0}
          className="btn-print"
        >
          🖨️ Print Invoice
        </button>
        <button 
          type="button"
          onClick={onBackToFiles}
          className="back-to-files-btn"
        >
          ← Back
        </button>
      </div>
    </form>
  );
};

export default InvoiceForm;
