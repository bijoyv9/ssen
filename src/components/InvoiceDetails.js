import React, { useState, useCallback } from 'react';
import InvoiceGenerator from './InvoiceGenerator';

const INVOICE_STATUSES = {
  pending: { label: 'Pending', color: '#ffc107', bgColor: '#fff3cd' },
  paid: { label: 'Paid', color: '#28a745', bgColor: '#d4edda' },
  overdue: { label: 'Overdue', color: '#dc3545', bgColor: '#f8d7da' },
  cancelled: { label: 'Cancelled', color: '#6c757d', bgColor: '#e2e3e5' },
  draft: { label: 'Draft', color: '#17a2b8', bgColor: '#d1ecf1' },
  partially_paid: { label: 'Partially Paid', color: '#fd7e14', bgColor: '#ffeaa7' }
};

const InvoiceDetails = ({ invoice, onBack, onUpdateStatus, onAddNote, onDelete, onUpdate, currentUser }) => {
  const [newNote, setNewNote] = useState('');
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(invoice.dueDate || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [showInvoiceGenerator, setShowInvoiceGenerator] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  
  // Removed unused edit states
  
  // Edit form data
  const [editData, setEditData] = useState({
    clientFirstName: invoice.clientFirstName || '',
    clientMiddleName: invoice.clientMiddleName || '',
    clientLastName: invoice.clientLastName || '',
    clientAddress: invoice.clientAddress || '',
    bankName: invoice.bankName || '',
    branchName: invoice.branchName || '',
    reportMaker: invoice.reportMaker || '',
    inspectedBy: invoice.inspectedBy || '',
    description: invoice.description || '',
    professionalFees: invoice.professionalFees || 0,
    advance: invoice.advance || 0,
    total: invoice.total || 0
  });

  const fullClientName = [
    invoice.clientFirstName, 
    invoice.clientMiddleName, 
    invoice.clientLastName
  ].filter(name => name?.trim()).join(' ') || invoice.clientName || 'N/A';

  const statusConfig = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.pending;

  const handleStatusChange = useCallback((newStatus) => {
    setActionFeedback(`Updating status to ${INVOICE_STATUSES[newStatus]?.label || newStatus}...`);
    
    // Add status change to history
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    const oldStatus = INVOICE_STATUSES[invoice.status]?.label || invoice.status;
    const newStatusLabel = INVOICE_STATUSES[newStatus]?.label || newStatus;
    onAddNote(invoice.id, `${date} - ${userName} changed status from "${oldStatus}" to "${newStatusLabel}"`);
    
    if (newStatus === 'paid') {
      onUpdateStatus(invoice.id, newStatus, new Date().toISOString());
    } else {
      onUpdateStatus(invoice.id, newStatus);
    }
    setTimeout(() => {
      setActionFeedback(`✓ Status updated to ${INVOICE_STATUSES[newStatus]?.label || newStatus}`);
    }, 100);
    setTimeout(() => setActionFeedback(''), 3000);
  }, [invoice.id, invoice.status, onUpdateStatus, onAddNote, currentUser]);

  const handlePartialPayment = useCallback(() => {
    const amount = parseFloat(partialPaymentAmount);
    if (amount > 0 && amount < parseFloat(invoice.total)) {
      setActionFeedback('Recording payment...');
      
      // Update the invoice directly with the custom log entry
      const userName = currentUser?.fullName || 'User';
      const date = new Date().toLocaleDateString('en-GB');
      const oldStatus = INVOICE_STATUSES[invoice.status]?.label || invoice.status;
      
      const existingNotes = invoice.notes || '';
      const paymentNote = `${date} - ${userName} changed status from "${oldStatus}" to "Partially Paid" (₹${amount.toLocaleString('en-IN')} paid)`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${paymentNote}` : paymentNote;
      
      const updatedInvoice = {
        ...invoice,
        status: 'partially_paid',
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      };
      
      onUpdate(invoice.id, updatedInvoice);
      setPartialPaymentAmount('');
      setTimeout(() => {
        setActionFeedback(`✓ Payment of ₹${amount.toLocaleString('en-IN')} recorded successfully`);
      }, 100);
      setTimeout(() => setActionFeedback(''), 3000);
    }
  }, [invoice, invoice.status, invoice.total, partialPaymentAmount, onUpdate, currentUser]);

  const handleAddNote = useCallback(() => {
    if (newNote.trim()) {
      const userName = currentUser?.fullName || 'User';
      const date = new Date().toLocaleDateString('en-GB');
      onAddNote(invoice.id, `${date} - ${userName} added note: ${newNote.trim()}`);
      setNewNote('');
    }
  }, [invoice.id, newNote, onAddNote, currentUser]);

  const handleUpdateDueDate = useCallback(() => {
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    const oldDueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'None';
    const newDueDate = new Date(dueDate).toLocaleDateString('en-GB');
    
    onAddNote(invoice.id, `${date} - ${userName} updated due date from ${oldDueDate} to ${newDueDate}`);
    onUpdate(invoice.id, { ...invoice, dueDate, updatedAt: new Date().toISOString() });
    setIsEditingDueDate(false);
  }, [invoice, dueDate, onUpdate, onAddNote, currentUser]);

  const handleDelete = useCallback(() => {
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    onAddNote(invoice.id, `${date} - ${userName} deleted invoice ${invoice.invoiceNumber}`);
    onDelete(invoice.id);
    onBack();
  }, [invoice.id, invoice.invoiceNumber, onDelete, onBack, onAddNote, currentUser]);

  // Create simple, readable history entries
  const createHistoryEntry = useCallback((changes) => {
    const date = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY format
    const userName = currentUser?.fullName || 'Unknown User';
    
    const changeEntries = [];
    
    // Check what actually changed and create readable messages
    if (changes.clientFirstName !== invoice.clientFirstName || 
        changes.clientMiddleName !== invoice.clientMiddleName || 
        changes.clientLastName !== invoice.clientLastName) {
      const oldName = [invoice.clientFirstName, invoice.clientMiddleName, invoice.clientLastName]
        .filter(Boolean).join(' ');
      const newName = [changes.clientFirstName, changes.clientMiddleName, changes.clientLastName]
        .filter(Boolean).join(' ');
      if (oldName !== newName) {
        changeEntries.push(`${date} - ${userName} changed client name from "${oldName}" to "${newName}"`);
      }
    }
    
    if (changes.clientAddress !== invoice.clientAddress) {
      changeEntries.push(`${date} - ${userName} changed client address from "${invoice.clientAddress || 'Not set'}" to "${changes.clientAddress}"`);
    }
    
    if (changes.bankName !== invoice.bankName) {
      changeEntries.push(`${date} - ${userName} changed bank name from "${invoice.bankName}" to "${changes.bankName}"`);
    }
    
    if (changes.branchName !== invoice.branchName) {
      changeEntries.push(`${date} - ${userName} changed branch name from "${invoice.branchName}" to "${changes.branchName}"`);
    }
    
    if (changes.description !== invoice.description) {
      changeEntries.push(`${date} - ${userName} changed service description from "${invoice.description || 'Not set'}" to "${changes.description}"`);
    }
    
    if (changes.total !== invoice.total) {
      changeEntries.push(`${date} - ${userName} changed total amount from ₹${parseFloat(invoice.total || 0).toLocaleString('en-IN')} to ₹${parseFloat(changes.total || 0).toLocaleString('en-IN')}`);
    }
    
    // Add to existing notes
    const currentNotes = invoice.notes || '';
    const newEntries = changeEntries.join('\n');
    const updatedNotes = currentNotes ? `${currentNotes}\n${newEntries}` : newEntries;
    
    return updatedNotes;
  }, [currentUser, invoice]);

  // Removed unused save functions

  // Save all changes at once
  const saveAllChanges = useCallback(() => {
    const changes = {
      clientFirstName: editData.clientFirstName,
      clientMiddleName: editData.clientMiddleName,
      clientLastName: editData.clientLastName,
      clientAddress: editData.clientAddress,
      bankName: editData.bankName,
      branchName: editData.branchName,
      description: editData.description,
      total: editData.total
    };
    
    const updatedNotes = createHistoryEntry(changes);
    const updatedInvoice = {
      ...invoice,
      ...changes,
      notes: updatedNotes,
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(invoice.id, updatedInvoice);
    
    // Update local invoice state to reflect changes immediately
    Object.assign(invoice, updatedInvoice);
  }, [invoice, editData, onUpdate, createHistoryEntry]);

  const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status === 'pending';

  return (
    <div className="invoice-details">
      <div className="management-header">
        <div className="management-title-section">
          <div className="details-title-group">
            <button onClick={onBack} className="back-btn">
              ← Back to Invoices
            </button>
            <h2>Invoice Details - {invoice.invoiceNumber}</h2>
          </div>
          <button
            onClick={() => setShowInvoiceGenerator(true)}
            className="export-excel-btn"
          >
            📄 Generate Invoice
          </button>
        </div>
        
        <div className="client-bank-row">
          <div className="summary-card-large client-card">
            <h3>👤 Client Information</h3>
            <p className="client-name-large">{fullClientName}</p>
            <small className="client-address-small">{invoice.clientAddress || 'No address provided'}</small>
          </div>
          <div className="summary-card-large bank-details-card">
            <h3>🏦</h3>
            <p className="bank-name-large">{invoice.bankName}</p>
            {invoice.branchName && <small className="branch-name-small">{invoice.branchName}</small>}
          </div>
        </div>
        
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Amount</h3>
            <p>₹{parseFloat(invoice.total || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Invoice Date</h3>
            <p>{new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Due Date</h3>
            {isEditingDueDate ? (
              <div className="due-date-edit-card">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="date-input-card"
                />
                <div className="date-edit-actions">
                  <button onClick={handleUpdateDueDate} className="save-btn-card">✓</button>
                  <button onClick={() => setIsEditingDueDate(false)} className="cancel-btn-card">✕</button>
                </div>
              </div>
            ) : (
              <p 
                onClick={() => setIsEditingDueDate(true)}
                className="due-date-clickable"
                title="Click to edit due date"
              >
                {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'Click to add'}
              </p>
            )}
          </div>
          <div className="summary-card">
            <h3>Status</h3>
            <p 
              className="status-text-card"
              style={{
                color: statusConfig.color,
                fontSize: '1.8rem',
                fontWeight: '700',
                margin: 0,
                lineHeight: '1.2'
              }}
            >
              {statusConfig.label}
              {isOverdue && ' ⚠️'}
            </p>
          </div>
        </div>
      </div>

      {invoice.paymentDate && (
        <div className="filters-section">
          <div className="invoice-info-grid">
            <div className="info-group">
              <div className="info-label">Payment Date</div>
              <div className="info-value">{new Date(invoice.paymentDate).toLocaleDateString('en-IN')}</div>
            </div>
          </div>
        </div>
      )}

      <div className="details-content-grid">
        <div className="main-content">
          <div className="invoices-table-container">
            <div className="section-header">
              <h3>✏️ Edit Invoice Details</h3>
            </div>
            <div className="edit-form-table">
              <div className="form-row-grid">
                <div className="form-group">
                  <label>Client Name</label>
                  <input
                    type="text"
                    value={editData.clientFirstName + ' ' + editData.clientMiddleName + ' ' + editData.clientLastName}
                    onChange={(e) => {
                      const parts = e.target.value.split(' ');
                      setEditData({
                        ...editData, 
                        clientFirstName: parts[0] || '',
                        clientMiddleName: parts.slice(1, -1).join(' ') || '',
                        clientLastName: parts[parts.length - 1] || ''
                      });
                    }}
                    className="search-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={editData.bankName}
                    onChange={(e) => setEditData({...editData, bankName: e.target.value})}
                    className="search-input"
                  />
                </div>
                <div className="form-group">
                  <label>Branch Name</label>
                  <input
                    type="text"
                    value={editData.branchName}
                    onChange={(e) => setEditData({...editData, branchName: e.target.value})}
                    className="search-input"
                  />
                </div>
                <div className="form-group">
                  <label>Total Amount</label>
                  <input
                    type="number"
                    value={editData.total}
                    onChange={(e) => setEditData({...editData, total: parseFloat(e.target.value) || 0})}
                    step="0.01"
                    min="0"
                    className="search-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Client Address</label>
                <textarea
                  value={editData.clientAddress}
                  onChange={(e) => setEditData({...editData, clientAddress: e.target.value})}
                  rows="3"
                  className="search-input"
                />
              </div>
              
              <div className="form-group">
                <label>Service Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  rows="3"
                  className="search-input"
                  placeholder="Describe the service provided..."
                />
              </div>

              <button onClick={saveAllChanges} className="export-excel-btn" style={{alignSelf: 'flex-start'}}>
                💾 Save All Changes
              </button>
            </div>
          </div>

          <div className="invoices-table-container" style={{marginTop: '2rem'}}>
            <div className="section-header">
              <h3>Record of Changes</h3>
              <p style={{color: '#666', fontSize: '0.9rem'}}>Complete record of all changes made to this invoice</p>
            </div>
            <div className="history-content">
              {invoice.notes ? invoice.notes.split('\n').reverse().map((note, index) => {
                if (!note.trim()) return null;
                
                const isNewFormat = /^\d{2}\/\d{2}\/\d{4}\s*-/.test(note);
                let activityType = 'note';
                let borderColor = '#e9ecef';
                
                // Determine activity type and color
                if (note.includes('created invoice')) {
                  activityType = 'created';
                  borderColor = '#28a745'; // Green for creation
                } else if (note.includes('changed status')) {
                  activityType = 'status';
                  borderColor = '#007bff'; // Blue for status changes
                } else if (note.includes('recorded partial payment') || note.includes('payment')) {
                  activityType = 'payment';
                  borderColor = '#fd7e14'; // Orange for payments
                } else if (note.includes('updated due date') || note.includes('changed client') || note.includes('changed bank')) {
                  activityType = 'edit';
                  borderColor = '#6f42c1'; // Purple for edits
                } else if (note.includes('added note')) {
                  activityType = 'note';
                  borderColor = '#17a2b8'; // Cyan for notes
                } else if (note.includes('deleted')) {
                  activityType = 'delete';
                  borderColor = '#dc3545'; // Red for deletion
                }
                
                return (
                  <div key={index} className="history-entry-minimal">
                    <div className="history-item-minimal" style={{borderLeftColor: borderColor}}>
                      {isNewFormat ? (
                        <span className="history-text-minimal">{note}</span>
                      ) : note.includes('updated') ? (
                        <span className="history-text-minimal">
                          <strong>System Update:</strong> {note.replace(/^\[.*?\]\s*/, '').replace(/updated/g, 'changed')}
                        </span>
                      ) : (
                        <span className="history-text-minimal">
                          <strong>Note:</strong> {note.replace(/^\[.*?\]\s*/, '')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <div className="no-history">
                  <p>No activity recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="actions-panel">
          <div className="invoices-table-container">
            <div className="section-header">
              <h3>Quick Actions</h3>
              {actionFeedback && (
                <div className="action-feedback" style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: actionFeedback.startsWith('✓') ? '#d4edda' : '#fff3cd',
                  color: actionFeedback.startsWith('✓') ? '#155724' : '#856404',
                  border: `1px solid ${actionFeedback.startsWith('✓') ? '#c3e6cb' : '#ffeaa7'}`,
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  marginTop: '0.5rem',
                  fontWeight: '500'
                }}>
                  {actionFeedback}
                </div>
              )}
            </div>
            
            {currentUser?.role === 'admin' && (
              <>
                {invoice.status !== 'paid' && (
                  <button
                    onClick={() => handleStatusChange('paid')}
                    className="action-btn-modern"
                    style={{backgroundColor: '#28a745', color: 'white'}}
                  >
                    ✓ Mark as Paid
                  </button>
                )}

                <div className="status-change-section">
                  <h4 style={{margin: '1rem 0 0.5rem 0', color: '#666'}}>Change Status</h4>
                  {Object.entries(INVOICE_STATUSES)
                    .filter(([status]) => status !== invoice.status && status !== 'cancelled')
                    .map(([status, config]) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="filter-btn"
                        style={{
                          backgroundColor: config.bgColor,
                          color: config.color,
                          borderColor: config.color,
                          width: '100%',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {config.label}
                      </button>
                    ))}
                </div>
              </>
            )}

            {/* Record Payment - Available for all users */}
            {invoice.status === 'pending' && (
              <div className="partial-payment-highlight" style={{marginTop: '1rem'}}>
                <div className="partial-payment-header">
                  <h4>💰 Record Payment</h4>
                </div>
                <div className="partial-payment-section">
                  <input
                    type="number"
                    placeholder="Enter payment amount"
                    value={partialPaymentAmount}
                    onChange={(e) => setPartialPaymentAmount(e.target.value)}
                    step="0.01"
                    min="0"
                    max={invoice.total}
                    className="partial-input"
                  />
                  <button
                    onClick={handlePartialPayment}
                    className="action-btn-modern partial-btn-highlight"
                    disabled={!partialPaymentAmount || parseFloat(partialPaymentAmount) >= parseFloat(invoice.total)}
                  >
                    💳 Record Payment
                  </button>
                </div>
              </div>
            )}

            {/* Cancel button available for all users */}
            {!['cancelled', 'paid'].includes(invoice.status) && (
              <button
                onClick={() => handleStatusChange('cancelled')}
                className="action-btn-modern"
                style={{backgroundColor: '#6c757d', color: 'white', marginTop: '1rem'}}
              >
                ✕ Cancel Invoice
              </button>
            )}
            
            {currentUser?.role !== 'admin' && (
              <div className="admin-notice" style={{padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', marginTop: '1rem'}}>
                <p style={{color: '#666', margin: 0}}><strong>Other Status Changes:</strong> Admin Only</p>
              </div>
            )}
          </div>

          <div className="invoices-table-container" style={{marginTop: '2rem'}}>
            <div className="section-header">
              <h3>Add Note</h3>
            </div>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this invoice..."
              rows="4"
              className="search-input"
            />
            <button
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="action-btn-modern"
              style={{backgroundColor: '#3b82f6', color: 'white', marginTop: '0.5rem'}}
            >
              Add Note
            </button>
          </div>

          <div className="invoices-table-container" style={{marginTop: '2rem'}}>
            <div className="section-header">
              <h3 style={{color: '#dc3545'}}>Danger Zone</h3>
            </div>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="action-btn-modern"
                style={{backgroundColor: '#dc3545', color: 'white'}}
              >
                Delete Invoice
              </button>
            ) : (
              <div className="delete-confirm-modern">
                <p style={{margin: '0 0 1rem 0', color: '#666'}}>Confirm deletion? This cannot be undone.</p>
                <div style={{display: 'flex', gap: '0.5rem'}}>
                  <button 
                    onClick={handleDelete} 
                    className="action-btn-modern"
                    style={{backgroundColor: '#dc3545', color: 'white', flex: 1}}
                  >
                    Confirm Delete
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(false)} 
                    className="filter-btn"
                    style={{flex: 1}}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoiceGenerator && (
        <InvoiceGenerator
          invoice={invoice}
          onClose={() => setShowInvoiceGenerator(false)}
        />
      )}
    </div>
  );
};

export default InvoiceDetails;