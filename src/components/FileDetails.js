import React, { useState, useCallback } from 'react';

const FILE_STATUSES = {
  pending: { label: 'Pending', color: '#ffc107', bgColor: '#fff3cd' },
  'in-progress': { label: 'In Progress', color: '#17a2b8', bgColor: '#d1ecf1' },
  completed: { label: 'Completed', color: '#28a745', bgColor: '#d4edda' },
  cancelled: { label: 'Cancelled', color: '#6c757d', bgColor: '#e2e3e5' }
};

const FileDetails = ({ file, onBack, onUpdate, onAddNote, onDelete, currentUser }) => {
  const [newNote, setNewNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');
  
  // Edit form data
  const [editData, setEditData] = useState({
    clientFirstName: file.clientFirstName || '',
    clientMiddleName: file.clientMiddleName || '',
    clientLastName: file.clientLastName || '',
    clientAddress: file.clientAddress || '',
    clientPhone: file.clientPhone || '',
    clientEmail: file.clientEmail || '',
    description: file.description || '',
    propertyValue: file.propertyValue || file.amount || 0,
    bankName: file.bankName || '',
    branchName: file.branchName || '',
    madeBy: file.madeBy || '',
    inspectedBy: file.inspectedBy || '',
    remarks: file.remarks || ''
  });

  const fullClientName = [
    file.clientFirstName, 
    file.clientMiddleName, 
    file.clientLastName
  ].filter(name => name?.trim()).join(' ') || file.clientName || 'N/A';

  const statusConfig = FILE_STATUSES[file.status] || FILE_STATUSES.pending;

  const handleStatusChange = useCallback((newStatus) => {
    setActionFeedback(`Updating status to ${FILE_STATUSES[newStatus]?.label || newStatus}...`);
    
    // Add status change to history
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    const oldStatus = FILE_STATUSES[file.status]?.label || file.status;
    const newStatusLabel = FILE_STATUSES[newStatus]?.label || newStatus;
    onAddNote(file.id, `${date} - ${userName} changed status from "${oldStatus}" to "${newStatusLabel}"`);
    
    const updatedFile = {
      ...file,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(file.id, updatedFile);
    setTimeout(() => {
      setActionFeedback(`✓ Status updated to ${FILE_STATUSES[newStatus]?.label || newStatus}`);
    }, 100);
    setTimeout(() => setActionFeedback(''), 3000);
  }, [file.id, file.status, onUpdate, onAddNote, currentUser]);

  const handleAddNote = useCallback(() => {
    if (newNote.trim()) {
      const userName = currentUser?.fullName || 'User';
      const date = new Date().toLocaleDateString('en-GB');
      onAddNote(file.id, `${date} - ${userName} added note: ${newNote.trim()}`);
      setNewNote('');
    }
  }, [file.id, newNote, onAddNote, currentUser]);

  const handleDelete = useCallback(() => {
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    onAddNote(file.id, `${date} - ${userName} deleted file ${file.fileNumber}`);
    onDelete(file.id);
    onBack();
  }, [file.id, file.fileNumber, onDelete, onBack, onAddNote, currentUser]);

  // Create simple, readable history entries
  const createHistoryEntry = useCallback((changes) => {
    const date = new Date().toLocaleDateString('en-GB');
    const userName = currentUser?.fullName || 'Unknown User';
    
    const changeEntries = [];
    
    // Check what actually changed and create readable messages
    if (changes.clientFirstName !== file.clientFirstName || 
        changes.clientMiddleName !== file.clientMiddleName || 
        changes.clientLastName !== file.clientLastName) {
      const oldName = [file.clientFirstName, file.clientMiddleName, file.clientLastName]
        .filter(Boolean).join(' ');
      const newName = [changes.clientFirstName, changes.clientMiddleName, changes.clientLastName]
        .filter(Boolean).join(' ');
      if (oldName !== newName) {
        changeEntries.push(`${date} - ${userName} changed client name from "${oldName}" to "${newName}"`);
      }
    }
    
    if (changes.clientAddress !== file.clientAddress) {
      changeEntries.push(`${date} - ${userName} changed client address from "${file.clientAddress || 'Not set'}" to "${changes.clientAddress}"`);
    }
    
    if (changes.bankName !== file.bankName) {
      changeEntries.push(`${date} - ${userName} changed bank name from "${file.bankName}" to "${changes.bankName}"`);
    }
    
    if (changes.branchName !== file.branchName) {
      changeEntries.push(`${date} - ${userName} changed branch name from "${file.branchName}" to "${changes.branchName}"`);
    }
    
    if (changes.description !== file.description) {
      changeEntries.push(`${date} - ${userName} changed property type from "${file.description || 'Not set'}" to "${changes.description}"`);
    }
    
    if (changes.propertyValue !== file.propertyValue) {
      changeEntries.push(`${date} - ${userName} changed property value from ₹${parseFloat(file.propertyValue || file.amount || 0).toLocaleString('en-IN')} to ₹${parseFloat(changes.propertyValue || 0).toLocaleString('en-IN')}`);
    }
    
    // Add to existing notes
    const currentNotes = file.notes || '';
    const newEntries = changeEntries.join('\n');
    const updatedNotes = currentNotes ? `${currentNotes}\n${newEntries}` : newEntries;
    
    return updatedNotes;
  }, [currentUser, file]);

  // Save all changes at once
  const saveAllChanges = useCallback(() => {
    const changes = {
      clientFirstName: editData.clientFirstName,
      clientMiddleName: editData.clientMiddleName,
      clientLastName: editData.clientLastName,
      clientAddress: editData.clientAddress,
      clientPhone: editData.clientPhone,
      clientEmail: editData.clientEmail,
      description: editData.description,
      propertyValue: editData.propertyValue,
      bankName: editData.bankName,
      branchName: editData.branchName,
      remarks: editData.remarks
    };
    
    const updatedNotes = createHistoryEntry(changes);
    const updatedFile = {
      ...file,
      ...changes,
      clientName: `${editData.clientFirstName} ${editData.clientMiddleName || ''} ${editData.clientLastName}`.trim(),
      notes: updatedNotes,
      updatedAt: new Date().toISOString()
    };
    
    onUpdate(file.id, updatedFile);
    
    // Update local file state to reflect changes immediately
    Object.assign(file, updatedFile);
  }, [file, editData, onUpdate, createHistoryEntry]);

  return (
    <div className="invoice-details">
      <div className="management-header">
        <div className="management-title-section">
          <div className="details-title-group">
            <button onClick={onBack} className="back-btn">
              ← Back to Home
            </button>
            <h2>File Details - {file.fileNumber}</h2>
          </div>
        </div>
        
        <div className="client-bank-row">
          <div className="summary-card-large client-card">
            <h3>👤 Client Information</h3>
            <p className="client-name-large">{fullClientName}</p>
            <small className="client-address-small">{file.clientAddress || 'No address provided'}</small>
          </div>
          <div className="summary-card-large bank-details-card">
            <h3>🏦 {file.bankName || 'No Bank'}</h3>
            <p className="bank-name-large">{file.bankName || 'Not specified'}</p>
            {file.branchName && <small className="branch-name-small">{file.branchName}</small>}
          </div>
        </div>
        
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Property Value</h3>
            <p>₹{parseFloat(file.propertyValue || file.amount || 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>File Date</h3>
            <p>{new Date(file.fileDate || file.createdAt).toLocaleDateString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Property Type</h3>
            <p>{file.description || 'Not specified'}</p>
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
            </p>
          </div>
        </div>
      </div>

      <div className="details-content-grid">
        <div className="main-content">
          <div className="invoices-table-container">
            <div className="section-header">
              <h3>✏️ Edit File Details</h3>
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
                  <label>Phone</label>
                  <input
                    type="text"
                    value={editData.clientPhone}
                    onChange={(e) => setEditData({...editData, clientPhone: e.target.value})}
                    className="search-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={editData.clientEmail}
                    onChange={(e) => setEditData({...editData, clientEmail: e.target.value})}
                    className="search-input"
                  />
                </div>
                <div className="form-group">
                  <label>Property Value</label>
                  <input
                    type="number"
                    value={editData.propertyValue}
                    onChange={(e) => setEditData({...editData, propertyValue: parseFloat(e.target.value) || 0})}
                    step="0.01"
                    min="0"
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
                <label>Property Type</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({...editData, description: e.target.value})}
                  rows="2"
                  className="search-input"
                  placeholder="Describe the property type..."
                />
              </div>

              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  value={editData.remarks}
                  onChange={(e) => setEditData({...editData, remarks: e.target.value})}
                  rows="3"
                  className="search-input"
                  placeholder="Additional remarks..."
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
              <p style={{color: '#666', fontSize: '0.9rem'}}>Complete record of all changes made to this file</p>
            </div>
            <div className="history-content">
              {file.notes ? file.notes.split('\n').reverse().map((note, index) => {
                if (!note.trim()) return null;
                
                const isNewFormat = /^\d{2}\/\d{2}\/\d{4}\s*-/.test(note);
                let activityType = 'note';
                let borderColor = '#e9ecef';
                
                // Determine activity type and color
                if (note.includes('created file')) {
                  activityType = 'created';
                  borderColor = '#28a745';
                } else if (note.includes('changed status')) {
                  activityType = 'status';
                  borderColor = '#007bff';
                } else if (note.includes('updated') || note.includes('changed client') || note.includes('changed bank') || note.includes('changed property')) {
                  activityType = 'edit';
                  borderColor = '#6f42c1';
                } else if (note.includes('added note')) {
                  activityType = 'note';
                  borderColor = '#17a2b8';
                } else if (note.includes('deleted')) {
                  activityType = 'delete';
                  borderColor = '#dc3545';
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
              <div className="status-change-section">
                <h4 style={{margin: '1rem 0 0.5rem 0', color: '#666'}}>Change Status</h4>
                {Object.entries(FILE_STATUSES)
                  .filter(([status]) => status !== file.status)
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
            )}
            
            {currentUser?.role !== 'admin' && (
              <div className="admin-notice" style={{padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', marginTop: '1rem'}}>
                <p style={{color: '#666', margin: 0}}><strong>Status Changes:</strong> Admin Only</p>
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
              placeholder="Add a note about this file..."
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

          {currentUser?.role === 'admin' && (
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
                  Delete File
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
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetails;