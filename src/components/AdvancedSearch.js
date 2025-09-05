import React, { useState, useEffect, useCallback } from 'react';

function AdvancedSearch({ files, onViewFileDetails, onEditFile, onDeleteFile, currentUser }) {
  const [searchFilters, setSearchFilters] = useState({
    fileNumber: '',
    clientName: '',
    clientFirstName: '',
    clientMiddleName: '',
    clientLastName: '',
    clientPhone: '',
    clientEmail: '',
    description: '',
    propertyValue: '',
    bankName: '',
    branchName: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    amountFrom: '',
    amountTo: ''
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const performAdvancedSearch = useCallback(() => {
    setIsSearching(true);
    
    let filteredFiles = [...files];

    // Apply filters
    Object.keys(searchFilters).forEach(key => {
      const filterValue = searchFilters[key];
      if (!filterValue) return;

      filteredFiles = filteredFiles.filter(file => {
        switch (key) {
          case 'fileNumber':
            return file.fileNumber?.toLowerCase().includes(filterValue.toLowerCase());
          case 'clientName':
            return file.clientName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'clientFirstName':
            return file.clientFirstName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'clientMiddleName':
            return file.clientMiddleName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'clientLastName':
            return file.clientLastName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'clientPhone':
            return file.clientPhone?.includes(filterValue);
          case 'clientEmail':
            return file.clientEmail?.toLowerCase().includes(filterValue.toLowerCase());
          case 'description':
            return file.description?.toLowerCase().includes(filterValue.toLowerCase());
          case 'propertyValue':
            return file.propertyValue?.toString().includes(filterValue);
          case 'bankName':
            return file.bankName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'branchName':
            return file.branchName?.toLowerCase().includes(filterValue.toLowerCase());
          case 'status':
            return file.status?.toLowerCase().includes(filterValue.toLowerCase());
          case 'dateFrom':
            const fileDate = new Date(file.fileDate || file.createdAt);
            const fromDate = new Date(filterValue);
            return fileDate >= fromDate;
          case 'dateTo':
            const fileDateTo = new Date(file.fileDate || file.createdAt);
            const toDate = new Date(filterValue);
            return fileDateTo <= toDate;
          case 'amountFrom':
            const amount = parseFloat(file.billAmount || file.amount || 0);
            return amount >= parseFloat(filterValue);
          case 'amountTo':
            const amountTo = parseFloat(file.billAmount || file.amount || 0);
            return amountTo <= parseFloat(filterValue);
          default:
            return true;
        }
      });
    });

    // Sort results
    filteredFiles.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'fileNumber':
          aValue = a.fileNumber || '';
          bValue = b.fileNumber || '';
          break;
        case 'clientName':
          aValue = a.clientName || '';
          bValue = b.clientName || '';
          break;
        case 'amount':
          aValue = parseFloat(a.billAmount || a.amount || 0);
          bValue = parseFloat(b.billAmount || b.amount || 0);
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });

    setSearchResults(filteredFiles);
    setIsSearching(false);
  }, [files, searchFilters, sortBy, sortOrder]);

  const clearFilters = () => {
    setSearchFilters({
      fileNumber: '',
      clientName: '',
      clientFirstName: '',
      clientMiddleName: '',
      clientLastName: '',
      clientPhone: '',
      clientEmail: '',
      description: '',
      propertyValue: '',
      bankName: '',
      branchName: '',
      status: '',
      dateFrom: '',
      dateTo: '',
      amountFrom: '',
      amountTo: ''
    });
    setSearchResults([]);
  };

  useEffect(() => {
    // Auto-search when filters change (with debounce)
    const timeoutId = setTimeout(() => {
      const hasFilters = Object.values(searchFilters).some(value => value !== '');
      if (hasFilters) {
        performAdvancedSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchFilters, performAdvancedSearch]);

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  return (
    <div className="advanced-search-container">
      <div className="advanced-search-header">
        <h2>Advanced File Search</h2>
        <div className="search-actions">
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      </div>

      <div className="search-filters-grid">
        <div className="filter-section">
          <h3>File Information</h3>
          <div className="filter-row">
            <input
              type="text"
              placeholder="File Number"
              value={searchFilters.fileNumber}
              onChange={(e) => handleFilterChange('fileNumber', e.target.value)}
              className="filter-input"
            />
            <select
              value={searchFilters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <textarea
            placeholder="Description contains..."
            value={searchFilters.description}
            onChange={(e) => handleFilterChange('description', e.target.value)}
            className="filter-input description-filter"
            rows="2"
          />
        </div>

        <div className="filter-section">
          <h3>Client Information</h3>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Client Name"
              value={searchFilters.clientName}
              onChange={(e) => handleFilterChange('clientName', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="First Name"
              value={searchFilters.clientFirstName}
              onChange={(e) => handleFilterChange('clientFirstName', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Middle Name"
              value={searchFilters.clientMiddleName}
              onChange={(e) => handleFilterChange('clientMiddleName', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={searchFilters.clientLastName}
              onChange={(e) => handleFilterChange('clientLastName', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Phone Number"
              value={searchFilters.clientPhone}
              onChange={(e) => handleFilterChange('clientPhone', e.target.value)}
              className="filter-input"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={searchFilters.clientEmail}
              onChange={(e) => handleFilterChange('clientEmail', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <h3>Bank & Financial</h3>
          <div className="filter-row">
            <input
              type="text"
              placeholder="Bank Name"
              value={searchFilters.bankName}
              onChange={(e) => handleFilterChange('bankName', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Branch Name"
              value={searchFilters.branchName}
              onChange={(e) => handleFilterChange('branchName', e.target.value)}
              className="filter-input"
            />
          </div>
          <div className="filter-row">
            <input
              type="number"
              placeholder="Min Amount"
              value={searchFilters.amountFrom}
              onChange={(e) => handleFilterChange('amountFrom', e.target.value)}
              className="filter-input"
            />
            <input
              type="number"
              placeholder="Max Amount"
              value={searchFilters.amountTo}
              onChange={(e) => handleFilterChange('amountTo', e.target.value)}
              className="filter-input"
            />
          </div>
          <input
            type="number"
            placeholder="Property Value"
            value={searchFilters.propertyValue}
            onChange={(e) => handleFilterChange('propertyValue', e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-section">
          <h3>Date Range</h3>
          <div className="filter-row">
            <input
              type="date"
              value={searchFilters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="filter-input"
              placeholder="From Date"
            />
            <input
              type="date"
              value={searchFilters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="filter-input"
              placeholder="To Date"
            />
          </div>
        </div>
      </div>

      <div className="search-results-section">
        <div className="results-header">
          <h3>
            Search Results 
            {searchResults.length > 0 && (
              <span className="results-count">({searchResults.length} files found)</span>
            )}
          </h3>
          {searchResults.length > 0 && (
            <div className="sort-controls">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="createdAt">Date Created</option>
                <option value="fileNumber">File Number</option>
                <option value="clientName">Client Name</option>
                <option value="amount">Amount</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="sort-order-btn"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          )}
        </div>

        {isSearching && (
          <div className="search-loading">Searching files...</div>
        )}

        {!isSearching && searchResults.length === 0 && Object.values(searchFilters).some(v => v !== '') && (
          <div className="no-results">No files match your search criteria.</div>
        )}

        {!isSearching && searchResults.length === 0 && Object.values(searchFilters).every(v => v === '') && (
          <div className="search-prompt">Use the filters above to search through files.</div>
        )}

        {searchResults.length > 0 && (
          <div className="search-results-grid">
            {searchResults.map((file) => (
              <div key={file.id} className="file-result-card">
                <div className="file-result-header">
                  <h4>File {file.fileNumber}</h4>
                  <div className="file-result-actions">
                    <button
                      onClick={() => onViewFileDetails(file)}
                      className="view-btn"
                      title="View Details"
                    >
                      👁️
                    </button>
                    {(currentUser?.role === 'admin' || currentUser?.id === file.createdBy) && (
                      <>
                        <button
                          onClick={() => onEditFile(file)}
                          className="edit-btn"
                          title="Edit File"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteFile(file.id)}
                          className="delete-btn"
                          title="Delete File"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="file-result-content">
                  <p><strong>Client:</strong> {file.clientName || 'N/A'}</p>
                  {file.description && (
                    <p><strong>Description:</strong> {file.description.substring(0, 100)}...</p>
                  )}
                  <p><strong>Amount:</strong> {formatCurrency(file.billAmount || file.amount)}</p>
                  {file.bankName && (
                    <p><strong>Bank:</strong> {file.bankName} - {file.branchName}</p>
                  )}
                  <p><strong>Status:</strong> <span className={`status-badge ${file.status}`}>{file.status || 'Pending'}</span></p>
                  <p><strong>Created:</strong> {formatDate(file.createdAt)} by {file.createdByName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedSearch;