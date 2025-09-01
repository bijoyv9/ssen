import React, { useRef, useCallback, useState, useEffect } from 'react';

const InvoiceGenerator = ({ invoice, onClose }) => {
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);
  const invoiceRef = useRef();

  const fullClientName = [
    invoice.clientFirstName, 
    invoice.clientMiddleName, 
    invoice.clientLastName
  ].filter(name => name?.trim()).join(' ') || invoice.clientName || 'N/A';

  const handlePrint = useCallback(() => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoice.invoiceNumber}</title>
        <style>
          /* Print-specific styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            padding: 20px;
          }
          
          .invoice-document {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            font-size: 28px;
            color: #2a5298;
            margin-bottom: 5px;
          }
          
          .company-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
          }
          
          .invoice-title h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
          }
          
          .invoice-meta p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .invoice-parties {
            margin-bottom: 30px;
          }
          
          .bill-to h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .client-details p {
            margin: 5px 0;
          }
          
          .service-section {
            margin-bottom: 30px;
          }
          
          .service-section h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .financial-summary {
            margin-bottom: 30px;
          }
          
          .summary-table {
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
          }
          
          .summary-row:last-child {
            border-bottom: none;
          }
          
          .total-row {
            background: #f8f9fa;
            font-weight: bold;
            font-size: 16px;
          }
          
          .amount-words {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          
          .payment-details {
            margin-bottom: 30px;
          }
          
          .payment-details h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .bank-account-info p {
            margin: 8px 0;
          }
          
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 30px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            margin: 40px auto 10px auto;
          }
          
          .footer-note {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          
          .generated-note {
            margin-top: 10px;
            font-style: italic;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .invoice-document {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait a bit for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }, [invoice.invoiceNumber]);

  const handleDownloadPDF = useCallback(() => {
    const printContent = invoiceRef.current;
    if (!printContent) return;
    
    // Create a new window for PDF generation
    const pdfWindow = window.open('', '_blank');
    pdfWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice-${invoice.invoiceNumber}</title>
        <style>
          /* PDF-specific styles */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            padding: 20px;
          }
          
          .invoice-document {
            max-width: 800px;
            margin: 0 auto;
          }
          
          .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          
          .company-info h1 {
            font-size: 28px;
            color: #2a5298;
            margin-bottom: 5px;
          }
          
          .company-subtitle {
            font-size: 14px;
            color: #666;
            font-style: italic;
          }
          
          .invoice-title h2 {
            font-size: 24px;
            color: #333;
            margin-bottom: 10px;
          }
          
          .invoice-meta p {
            margin: 5px 0;
            font-size: 14px;
          }
          
          .invoice-parties {
            margin-bottom: 30px;
          }
          
          .bill-to h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .client-details p {
            margin: 5px 0;
          }
          
          .service-section {
            margin-bottom: 30px;
          }
          
          .service-section h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .financial-summary {
            margin-bottom: 30px;
          }
          
          .summary-table {
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          
          .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
          }
          
          .summary-row:last-child {
            border-bottom: none;
          }
          
          .total-row {
            background: #f8f9fa;
            font-weight: bold;
            font-size: 16px;
          }
          
          .amount-words {
            background: #f0f8ff;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 30px;
          }
          
          .payment-details {
            margin-bottom: 30px;
          }
          
          .payment-details h3 {
            color: #2a5298;
            margin-bottom: 15px;
            font-size: 18px;
          }
          
          .bank-account-info p {
            margin: 8px 0;
          }
          
          .invoice-footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 50px;
            border-top: 1px solid #ccc;
            padding-top: 30px;
          }
          
          .signature-box {
            text-align: center;
          }
          
          .signature-line {
            width: 200px;
            border-bottom: 1px solid #333;
            margin: 40px auto 10px auto;
          }
          
          .footer-note {
            text-align: right;
            font-size: 12px;
            color: #666;
          }
          
          .generated-note {
            margin-top: 10px;
            font-style: italic;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .invoice-document {
              box-shadow: none;
            }
          }
        </style>
      </head>
      <body>
        ${printContent.outerHTML}
        <script>
          window.onload = function() {
            // Just focus the window - user can manually print to PDF using Ctrl+P or browser menu
            window.focus();
          }
        </script>
      </body>
      </html>
    `);
    
    pdfWindow.document.close();
  }, [invoice.invoiceNumber]);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if (num === 0) return 'Zero';
    if (num < 0) return 'Minus ' + numberToWords(Math.abs(num));
    
    let words = '';
    
    if (num >= 10000000) {
      words += numberToWords(Math.floor(num / 10000000)) + ' Crore ';
      num %= 10000000;
    }
    
    if (num >= 100000) {
      words += numberToWords(Math.floor(num / 100000)) + ' Lakh ';
      num %= 100000;
    }
    
    if (num >= 1000) {
      words += numberToWords(Math.floor(num / 1000)) + ' Thousand ';
      num %= 1000;
    }
    
    if (num >= 100) {
      words += ones[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    
    if (num >= 20) {
      words += tens[Math.floor(num / 10)];
      if (num % 10 !== 0) {
        words += ' ' + ones[num % 10];
      }
    } else if (num >= 10) {
      words += teens[num - 10];
    } else if (num > 0) {
      words += ones[num];
    }
    
    return words.trim();
  };

  const calculateGST = (amount, gstType, cgstRate, sgstRate, igstRate) => {
    const baseAmount = parseFloat(amount || 0);
    let cgst = 0, sgst = 0, igst = 0, totalGST = 0;
    
    if (gstType === 'CGST_SGST') {
      cgst = baseAmount * (parseFloat(cgstRate || 0) / 100);
      sgst = baseAmount * (parseFloat(sgstRate || 0) / 100);
      totalGST = cgst + sgst;
    } else {
      igst = baseAmount * (parseFloat(igstRate || 0) / 100);
      totalGST = igst;
    }
    
    const totalWithGST = baseAmount + totalGST;
    
    return {
      cgst,
      sgst,
      igst,
      totalGST,
      totalWithGST
    };
  };

  const gstCalculation = calculateGST(
    invoice.total, 
    invoice.gstType, 
    invoice.cgstRate, 
    invoice.sgstRate, 
    invoice.igstRate
  );

  useEffect(() => {
    try {
      const storedBanks = localStorage.getItem('banks');
      if (storedBanks) {
        const parsedBanks = JSON.parse(storedBanks);
        if (Array.isArray(parsedBanks)) {
          setBanks(parsedBanks);
          // Set default bank if available
          const defaultBank = parsedBanks.find(bank => bank.isDefault) || parsedBanks[0];
          setSelectedBank(defaultBank);
        }
      }
    } catch (error) {
      console.error('Failed to load banks:', error);
    }
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="invoice-generator-overlay">
      <div className="invoice-generator-container">
        <div className="invoice-generator-header">
          <h2>Generate Invoice</h2>
          <div className="generator-actions">
            <button onClick={handlePrint} className="print-btn">
              🖨️ Print
            </button>
            <button onClick={handleDownloadPDF} className="pdf-btn">
              📄 Download PDF
            </button>
            {banks.length > 0 && (
              <select
                value={selectedBank?.id || ''}
                onChange={(e) => {
                  const bank = banks.find(b => b.id === e.target.value);
                  setSelectedBank(bank);
                }}
                className="bank-select"
              >
                <option value="">Select Bank</option>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName} - {bank.accountNumber.slice(-4)}
                  </option>
                ))}
              </select>
            )}
            <button onClick={onClose} className="close-btn">
              ✕ Close
            </button>
          </div>
        </div>

        <div ref={invoiceRef} className="invoice-document">
          {/* Company Header */}
          <div className="invoice-header">
            <div className="company-info">
              <h1>S. SEN & ASSOCIATES</h1>
              <p className="company-subtitle">Professional Engineering Consultants</p>
            </div>
            <div className="invoice-title">
              <h2>BILL</h2>
              <div className="invoice-meta">
                <p><strong>Bill No:</strong> {invoice.invoiceNumber}</p>
                <p><strong>Date:</strong> {formatDate(invoice.invoiceDate)}</p>
                {invoice.dueDate && (
                  <p><strong>Due Date:</strong> {formatDate(invoice.dueDate)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="invoice-parties">
            <div className="bill-to">
              <h3>Bill To:</h3>
              <div className="client-details">
                <p><strong>{fullClientName}</strong></p>
                {invoice.clientAddress && (
                  <p>{invoice.clientAddress.split('\n').map((line, i) => (
                    <span key={i}>{line}<br /></span>
                  ))}</p>
                )}
                {invoice.clientGstNumber && (
                  <p><strong>GST No:</strong> {invoice.clientGstNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="service-section">
            <h3>Service Details</h3>
            <div className="service-description">
              <p>Being the professional fees for services regarding the preparation of the Valuation Report as mentioned above.</p>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="financial-summary">
            <div className="summary-table">
              <div className="summary-row">
                <span>Professional Fees:</span>
                <span>{formatCurrency(invoice.professionalFees)}</span>
              </div>
              {parseFloat(invoice.advance || 0) > 0 && (
                <div className="summary-row">
                  <span>Less: Advance:</span>
                  <span>- {formatCurrency(invoice.advance)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Amount before GST:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              
              {invoice.gstApplicable && (
                <>
                  {invoice.gstType === 'CGST_SGST' ? (
                    <>
                      <div className="summary-row">
                        <span>Add: CGST @ {invoice.cgstRate}%:</span>
                        <span>{formatCurrency(gstCalculation.cgst)}</span>
                      </div>
                      <div className="summary-row">
                        <span>Add: SGST @ {invoice.sgstRate}%:</span>
                        <span>{formatCurrency(gstCalculation.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="summary-row">
                      <span>Add: IGST @ {invoice.igstRate}%:</span>
                      <span>{formatCurrency(gstCalculation.igst)}</span>
                    </div>
                  )}
                  <div className="summary-row total-row">
                    <span><strong>Total Amount (Including GST):</strong></span>
                    <span><strong>{formatCurrency(gstCalculation.totalWithGST)}</strong></span>
                  </div>
                </>
              )}
              
              {!invoice.gstApplicable && (
                <div className="summary-row total-row">
                  <span><strong>Total Amount:</strong></span>
                  <span><strong>{formatCurrency(invoice.total)}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Amount in Words */}
          <div className="amount-words">
            <p><strong>Amount in Words:</strong> 
              Rupees {numberToWords(Math.floor(parseFloat(invoice.gstApplicable ? gstCalculation.totalWithGST : invoice.total || 0)))} Only
            </p>
          </div>


          {/* Bank Details */}
          {selectedBank && (
            <div className="payment-details">
              <h3>Our Bank Details:</h3>
              <div className="bank-account-info">
                <p><strong>Bank Name:</strong> {selectedBank.bankName}</p>
                <p><strong>Branch:</strong> {selectedBank.branchName}</p>
                <p><strong>A/c No.:</strong> {selectedBank.accountNumber}</p>
                <p><strong>IFSC Code:</strong> {selectedBank.ifscCode}</p>
                <p><strong>Account Type:</strong> {selectedBank.accountType}</p>
                <p><strong>Account Holder:</strong> {selectedBank.accountHolderName}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="invoice-footer">
            <div className="signature-section">
              <div className="signature-box">
                <p>For S. SEN & ASSOCIATES</p>
                <div className="signature-line"></div>
                <p>Authorized Signatory</p>
              </div>
            </div>
            <div className="footer-note">
              <p>Thank you for choosing S. Sen & Associates</p>
              <p className="generated-note">Generated on {formatDate(new Date())}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;