import React, { useState, useEffect, useCallback, useMemo } from 'react';

const FileManagement = ({ currentUser }) => {
  const [files, setFiles] = useState([]);
  const [showAddFile, setShowAddFile] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fileDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const [newFile, setNewFile] = useState({
    fileNumber: '',
    fileDate: new Date().toISOString().split('T')[0],
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientAddress: '',
    clientPhone: '',
    clientEmail: '',
    propertyAddress: '',
    propertyType: 'residential', // residential, commercial, industrial, land
    fileType: 'valuation', // valuation, inspection, audit, survey
    propertyDescription: '',
    instructions: '',
    estimatedValue: '',
    actualValue: '',
    reportMaker: currentUser?.role === 'admin' ? '' : currentUser?.fullName || '',
    inspectedBy: '',
    bankName: '',
    branchName: '',
    status: 'active', // active, completed, cancelled, on_hold
    priority: 'normal', // low, normal, high, urgent
    notes: '',
    attachments: [],
    linkedInvoices: []
  });

  const [errors, setErrors] = useState({});

  // Load files from localStorage
  useEffect(() => {
    const storedFiles = JSON.parse(localStorage.getItem('files') || '[]');
    setFiles(storedFiles);
  }, []);

  // Save files to localStorage
  const saveFiles = useCallback((updatedFiles) => {
    localStorage.setItem('files', JSON.stringify(updatedFiles));
    setFiles(updatedFiles);
  }, []);

  // Handle search button click
  const handleSearch = () => {
    setSearchTerm(searchInput);
  };

  // Handle search input enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Auto-generate file number
  const generateFileNumber = useCallback(() => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    // Find the highest file number for this month
    const monthFiles = files.filter(file => {
      const fileDate = new Date(file.fileDate);
      return fileDate.getFullYear().toString().slice(-2) === year &&
             (fileDate.getMonth() + 1).toString().padStart(2, '0') === month;
    });
    
    let serial = 1;
    if (monthFiles.length > 0) {
      const serials = monthFiles
        .map(file => {
          const match = file.fileNumber.match(/(\d+)\/\d{2}-\d{2}$/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));
      
      if (serials.length > 0) {
        serial = Math.max(...serials) + 1;
      }
    }
    
    return `${serial.toString().padStart(3, '0')}/${month}-${year}`;
  }, [files]);

  // Update file number when date changes
  useEffect(() => {
    if (showAddFile && !editingFile) {
      setNewFile(prev => ({
        ...prev,
        fileNumber: generateFileNumber()
      }));
    }
  }, [showAddFile, editingFile, generateFileNumber]);

  // Form validation
  const validateFile = useCallback((file) => {
    const newErrors = {};
    
    if (!file.clientFirstName.trim()) {
      newErrors.clientFirstName = 'Client first name is required';
    }
    
    if (!file.clientLastName.trim()) {
      newErrors.clientLastName = 'Client last name is required';
    }
    
    if (!file.propertyAddress.trim()) {
      newErrors.propertyAddress = 'Property address is required';
    }
    
    if (!file.reportMaker.trim()) {
      newErrors.reportMaker = 'Report maker is required';
    }
    
    if (!file.inspectedBy.trim()) {
      newErrors.inspectedBy = 'Inspector is required';
    }
    
    return newErrors;
  }, []);

  // Handle form changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    const processedValue = ['estimatedValue', 'actualValue'].includes(name) ? value : value.toUpperCase();
    
    setNewFile(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear error when field is corrected
    if (errors[name] && processedValue.trim()) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  // Reset form
  const resetForm = useCallback(() => {
    setNewFile({
      fileNumber: '',
      fileDate: new Date().toISOString().split('T')[0],
      clientFirstName: '',
      clientMiddleName: '',
      clientLastName: '',
      clientAddress: '',
      clientPhone: '',
      clientEmail: '',
      propertyAddress: '',
      propertyType: 'residential',
      fileType: 'valuation',
      propertyDescription: '',
      instructions: '',
      estimatedValue: '',
      actualValue: '',
      reportMaker: currentUser?.role === 'admin' ? '' : currentUser?.fullName || '',
      inspectedBy: '',
      bankName: '',
      branchName: '',
      status: 'active',
      priority: 'normal',
      notes: '',
      attachments: [],
      linkedInvoices: []
    });
    setShowAddFile(false);
    setEditingFile(null);
    setErrors({});
  }, [currentUser]);

  // Add or update file
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const validationErrors = validateFile(newFile);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const fileToSave = {
      ...newFile,
      id: editingFile ? editingFile.id : 'file_' + Date.now(),
      createdAt: editingFile ? editingFile.createdAt : new Date().toISOString(),
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.fullName || 'Unknown User',
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.id || 'unknown',
      updatedByName: currentUser?.fullName || 'Unknown User'
    };
    
    const updatedFiles = editingFile 
      ? files.map(file => file.id === editingFile.id ? fileToSave : file)
      : [...files, fileToSave];
    
    saveFiles(updatedFiles);
    resetForm();
  }, [newFile, editingFile, files, validateFile, currentUser, saveFiles, resetForm]);

  // Edit file
  const handleEdit = useCallback((file) => {
    setNewFile(file);
    setEditingFile(file);
    setShowAddFile(true);
  }, []);

  // Delete file
  const handleDelete = useCallback((fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      const updatedFiles = files.filter(file => file.id !== fileId);
      saveFiles(updatedFiles);
    }
  }, [files, saveFiles]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
      // Status filter
      if (statusFilter !== 'all' && file.status !== statusFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${file.clientFirstName} ${file.clientMiddleName || ''} ${file.clientLastName}`.toLowerCase();
        return (
          file.fileNumber.toLowerCase().includes(searchLower) ||
          fullName.includes(searchLower) ||
          file.propertyAddress.toLowerCase().includes(searchLower) ||
          file.reportMaker.toLowerCase().includes(searchLower) ||
          file.inspectedBy.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
    
    // Sort files
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'fileDate' || sortBy === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return filtered;
  }, [files, statusFilter, searchTerm, sortBy, sortOrder]);

  // Get statistics
  const stats = useMemo(() => {
    return {
      total: files.length,
      active: files.filter(f => f.status === 'active').length,
      completed: files.filter(f => f.status === 'completed').length,
      onHold: files.filter(f => f.status === 'on_hold').length,
      cancelled: files.filter(f => f.status === 'cancelled').length
    };
  }, [files]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'completed': return '#007bff';
      case 'on_hold': return '#ffc107';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return '#28a745';
      case 'normal': return '#007bff';
      case 'high': return '#fd7e14';
      case 'urgent': return '#dc3545';
      default: return '#6c757d';
    }
  };

  return (
    <div className="file-management">
      <div className="file-header">
        <h2>📁 File Management</h2>
        <button 
          className="add-file-btn"
          onClick={() => setShowAddFile(true)}
        >
          ➕ Add New File
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Files</h3>
          <p>{stats.total}</p>
        </div>
        <div className="stat-card">
          <h3>Active</h3>
          <p style={{ color: '#28a745' }}>{stats.active}</p>
        </div>
        <div className="stat-card">
          <h3>Completed</h3>
          <p style={{ color: '#007bff' }}>{stats.completed}</p>
        </div>
        <div className="stat-card">
          <h3>On Hold</h3>
          <p style={{ color: '#ffc107' }}>{stats.onHold}</p>
        </div>
        <div className="stat-card">
          <h3>Cancelled</h3>
          <p style={{ color: '#dc3545' }}>{stats.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="file-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search files by number, client name, property address..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
          <button 
            className="file-search-btn"
            onClick={handleSearch}
            type="button"
          >
            Search
          </button>
        </div>
        
        <div className="filter-controls">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="fileDate">File Date</option>
            <option value="fileNumber">File Number</option>
            <option value="clientFirstName">Client Name</option>
            <option value="propertyAddress">Property Address</option>
            <option value="createdAt">Created Date</option>
          </select>
          
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Files Table */}
      <div className="files-table-container">
        <table className="files-table">
          <thead>
            <tr>
              <th>File Number</th>
              <th>File Date</th>
              <th>Client Name</th>
              <th>Property Address</th>
              <th>Type</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Report Maker</th>
              <th>Inspector</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedFiles.map(file => (
              <tr key={file.id}>
                <td><strong>{file.fileNumber}</strong></td>
                <td>{new Date(file.fileDate).toLocaleDateString('en-IN')}</td>
                <td>
                  {`${file.clientFirstName} ${file.clientMiddleName || ''} ${file.clientLastName}`.trim()}
                </td>
                <td>{file.propertyAddress}</td>
                <td>
                  <span className="file-type-badge">
                    {file.fileType.charAt(0).toUpperCase() + file.fileType.slice(1)}
                  </span>
                </td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ 
                      backgroundColor: getStatusColor(file.status) + '20',
                      color: getStatusColor(file.status),
                      border: `1px solid ${getStatusColor(file.status)}`
                    }}
                  >
                    {file.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td>
                  <span 
                    className="priority-badge"
                    style={{ 
                      backgroundColor: getPriorityColor(file.priority) + '20',
                      color: getPriorityColor(file.priority),
                      border: `1px solid ${getPriorityColor(file.priority)}`
                    }}
                  >
                    {file.priority.toUpperCase()}
                  </span>
                </td>
                <td>{file.reportMaker}</td>
                <td>{file.inspectedBy}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(file)}
                      className="edit-btn"
                      title="Edit File"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(file.id)}
                      className="delete-btn"
                      title="Delete File"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredAndSortedFiles.length === 0 && (
          <div className="no-files">
            <p>No files found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Add/Edit File Modal */}
      {showAddFile && (
        <div className="modal-overlay">
          <div className="modal-container file-modal">
            <div className="modal-header">
              <h3>{editingFile ? 'Edit File' : 'Add New File'}</h3>
              <button className="close-modal-btn" onClick={resetForm}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="file-form">
              {/* File Details */}
              <div className="form-section">
                <h4>File Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fileNumber">File Number</label>
                    <input
                      id="fileNumber"
                      type="text"
                      name="fileNumber"
                      value={newFile.fileNumber}
                      onChange={handleChange}
                      readOnly
                      className="readonly-field"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="fileDate">File Date *</label>
                    <input
                      id="fileDate"
                      type="date"
                      name="fileDate"
                      value={newFile.fileDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fileType">File Type</label>
                    <select
                      id="fileType"
                      name="fileType"
                      value={newFile.fileType}
                      onChange={handleChange}
                    >
                      <option value="valuation">Valuation</option>
                      <option value="inspection">Inspection</option>
                      <option value="audit">Audit</option>
                      <option value="survey">Survey</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="propertyType">Property Type</label>
                    <select
                      id="propertyType"
                      name="propertyType"
                      value={newFile.propertyType}
                      onChange={handleChange}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Client Information */}
              <div className="form-section">
                <h4>Client Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientFirstName">First Name *</label>
                    <input
                      id="clientFirstName"
                      type="text"
                      name="clientFirstName"
                      value={newFile.clientFirstName}
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
                      value={newFile.clientMiddleName}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="clientLastName">Last Name *</label>
                    <input
                      id="clientLastName"
                      type="text"
                      name="clientLastName"
                      value={newFile.clientLastName}
                      onChange={handleChange}
                      className={errors.clientLastName ? 'error' : ''}
                      required
                    />
                    {errors.clientLastName && <span className="error-message">{errors.clientLastName}</span>}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="clientAddress">Client Address</label>
                  <textarea
                    id="clientAddress"
                    name="clientAddress"
                    value={newFile.clientAddress}
                    onChange={handleChange}
                    rows="2"
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPhone">Phone Number</label>
                    <input
                      id="clientPhone"
                      type="tel"
                      name="clientPhone"
                      value={newFile.clientPhone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="clientEmail">Email Address</label>
                    <input
                      id="clientEmail"
                      type="email"
                      name="clientEmail"
                      value={newFile.clientEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Property Information */}
              <div className="form-section">
                <h4>Property Information</h4>
                <div className="form-group">
                  <label htmlFor="propertyAddress">Property Address *</label>
                  <textarea
                    id="propertyAddress"
                    name="propertyAddress"
                    value={newFile.propertyAddress}
                    onChange={handleChange}
                    className={errors.propertyAddress ? 'error' : ''}
                    rows="2"
                    required
                  />
                  {errors.propertyAddress && <span className="error-message">{errors.propertyAddress}</span>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="propertyDescription">Property Description</label>
                  <textarea
                    id="propertyDescription"
                    name="propertyDescription"
                    value={newFile.propertyDescription}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Detailed description of the property..."
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="estimatedValue">Estimated Value (₹)</label>
                    <input
                      id="estimatedValue"
                      type="number"
                      name="estimatedValue"
                      value={newFile.estimatedValue}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="actualValue">Actual Value (₹)</label>
                    <input
                      id="actualValue"
                      type="number"
                      name="actualValue"
                      value={newFile.actualValue}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Work Assignment */}
              <div className="form-section">
                <h4>Work Assignment</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="reportMaker">Report Made By *</label>
                    <input
                      id="reportMaker"
                      type="text"
                      name="reportMaker"
                      value={newFile.reportMaker}
                      onChange={handleChange}
                      className={errors.reportMaker ? 'error' : ''}
                      required
                    />
                    {errors.reportMaker && <span className="error-message">{errors.reportMaker}</span>}
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="inspectedBy">Inspected By *</label>
                    <input
                      id="inspectedBy"
                      type="text"
                      name="inspectedBy"
                      value={newFile.inspectedBy}
                      onChange={handleChange}
                      className={errors.inspectedBy ? 'error' : ''}
                      required
                    />
                    {errors.inspectedBy && <span className="error-message">{errors.inspectedBy}</span>}
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName">Bank Name</label>
                    <input
                      id="bankName"
                      type="text"
                      name="bankName"
                      value={newFile.bankName}
                      onChange={handleChange}
                      placeholder="Enter bank name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="branchName">Branch Name</label>
                    <input
                      id="branchName"
                      type="text"
                      name="branchName"
                      value={newFile.branchName}
                      onChange={handleChange}
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Priority */}
              <div className="form-section">
                <h4>Status & Priority</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={newFile.status}
                      onChange={handleChange}
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={newFile.priority}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instructions and Notes */}
              <div className="form-section">
                <h4>Additional Information</h4>
                <div className="form-group">
                  <label htmlFor="instructions">Instructions</label>
                  <textarea
                    id="instructions"
                    name="instructions"
                    value={newFile.instructions}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Special instructions for this file..."
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={newFile.notes}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-file-btn">
                  {editingFile ? 'Update File' : 'Add File'}
                </button>
                <button type="button" className="cancel-btn" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagement;