import React, { useState, useEffect, useCallback, useMemo } from 'react';

const FileManagement = ({ files = [], addFile, updateFile, deleteFile, onEditFile, onCreateFile, currentUser, banks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fileDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // File operations will use the props passed from App component

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





  // Edit file
  const handleEdit = useCallback((file) => {
    onEditFile(file);
  }, [onEditFile]);

  // Delete file
  const handleDelete = useCallback((fileId) => {
    if (window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      deleteFile(fileId);
    }
  }, [deleteFile]);

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
          className="btn-primary"
          onClick={onCreateFile}
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

    </div>
  );
};

export default FileManagement;