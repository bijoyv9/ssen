import React, { useCallback } from 'react';
import { printInvoice, exportInvoiceAsWord } from '../utils/invoicePrintUtils';

const InvoiceGenerator = ({ invoice, onClose }) => {
  const fullClientName = [
    invoice.clientFirstName, 
    invoice.clientMiddleName, 
    invoice.clientLastName
  ].filter(name => name?.trim()).join(' ') || invoice.clientName || 'N/A';

  const handlePrint = useCallback(async () => {
    // Use unified print function
    await printInvoice(invoice);
  }, [invoice]);

  const handleDownloadPDF = useCallback(async () => {
    // Use unified print function for PDF too
    await printInvoice(invoice);
  }, [invoice]);

  const handleDownloadWord = useCallback(async () => {
    await exportInvoiceAsWord(invoice);
  }, [invoice]);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  const calculateGST = () => {
    const subtotal = (invoice.professionalFees || 0) - (invoice.advance || 0);
    const gstRate = 0.18; // 18% GST
    const gstAmount = subtotal * gstRate;
    const totalWithGST = subtotal + gstAmount;
    
    return {
      subtotal,
      cgst: gstAmount / 2, // Split GST into CGST and SGST
      sgst: gstAmount / 2,
      igst: gstAmount, // For interstate transactions
      totalWithGST
    };
  };

  const gstCalculation = calculateGST();

  return (
    <div className="invoice-generator-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div className="invoice-generator-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90%',
        overflow: 'auto',
        position: 'relative'
      }}>
        <div className="modal-header" style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #ddd',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2>Invoice Preview</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div className="invoice-content" style={{ padding: '20px' }}>
          {/* Space reserved for letterhead */}
          <div style={{ height: '500px', backgroundColor: '#f9f9f9', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px' }}>
            <span style={{ color: '#999', fontSize: '16px' }}>Space for Letterhead (500px)</span>
          </div>

          {/* Invoice Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            <div>
              <h2 style={{ fontSize: '24px', color: '#333', marginBottom: '10px' }}>BILL</h2>
              <p><strong>Bill No:</strong> {invoice.invoiceNumber}</p>
              <p><strong>Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
              {invoice.dueDate && (
                <p><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString('en-IN')}</p>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2a5298', marginBottom: '15px', fontSize: '18px' }}>Bill To:</h3>
            <div>
              <p><strong>{fullClientName}</strong></p>
              <p>{invoice.clientAddress}</p>
              {invoice.clientGstNumber && <p><strong>GST No:</strong> {invoice.clientGstNumber}</p>}
            </div>
          </div>

          {/* Service Details */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#2a5298', marginBottom: '15px', fontSize: '18px' }}>Service Details:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Professional Consultation Fees</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                    {formatCurrency(invoice.professionalFees)}
                  </td>
                </tr>
                {invoice.advance && parseFloat(invoice.advance) > 0 && (
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>Less: Advance Received</td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                      - {formatCurrency(invoice.advance)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '12px', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>Subtotal</td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd', fontWeight: 'bold' }}>
                    {formatCurrency(invoice.total)}
                  </td>
                </tr>
                {invoice.gstApplicable && (
                  <>
                    {invoice.gstType === 'cgst_sgst' ? (
                      <>
                        <tr>
                          <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>CGST (9%)</td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {formatCurrency(gstCalculation.cgst)}
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>SGST (9%)</td>
                          <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                            {formatCurrency(gstCalculation.sgst)}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <tr>
                        <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>IGST (18%)</td>
                        <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                          {formatCurrency(gstCalculation.igst)}
                        </td>
                      </tr>
                    )}
                    <tr style={{ backgroundColor: '#f8f9fa', fontSize: '18px', fontWeight: 'bold' }}>
                      <td style={{ padding: '12px' }}>Total Amount (Inc. GST)</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <strong>{formatCurrency(gstCalculation.totalWithGST)}</strong>
                      </td>
                    </tr>
                  </>
                )}
                {!invoice.gstApplicable && (
                  <tr style={{ backgroundColor: '#f8f9fa', fontSize: '18px', fontWeight: 'bold' }}>
                    <td style={{ padding: '12px' }}>Total Amount</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <strong>{formatCurrency(invoice.total)}</strong>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: '#2a5298', marginBottom: '10px' }}>Notes:</h3>
              <p style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px' }}>
                {invoice.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            justifyContent: 'center', 
            marginTop: '30px',
            borderTop: '1px solid #ddd',
            paddingTop: '20px'
          }}>
            <button 
              onClick={handlePrint}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🖨️ Print Invoice
            </button>
            <button 
              onClick={handleDownloadPDF}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📄 Download PDF
            </button>
            <button 
              onClick={handleDownloadWord}
              style={{
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              📄 Download Word
            </button>
            <button 
              onClick={onClose}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;