import React, { useMemo, useState, useEffect } from 'react';
import '../styles/home.css';

// Constants moved outside component to avoid recreation on each render
const FILES_PER_PAGE = 15;

const Home = ({ files, currentUser, onCreateFile, onViewProfile, onLogout, onEditFile, onProfileUpdate, onViewInvoice }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [bankFilter, setBankFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [inspectorFilter, setInspectorFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const profilePicture = e.target.result;
        const updatedUser = { ...currentUser, profilePicture };
        
        // Update localStorage for current user
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        
        // Update users array in localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = storedUsers.map(user => 
          user.id === currentUser.id ? updatedUser : user
        );
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Update current user state using callback from parent
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        } else {
          // Fallback to reload if callback not provided
          window.location.reload();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper function to reset all filters
  const resetFilters = () => {
    setStatusFilter('all');
    setBankFilter('all');
    setBranchFilter('all');
    setDescriptionFilter('');
    setDateFilter('all');
    setInspectorFilter('all');
    setCurrentPage(1); // Reset pagination to first page
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  // Reset pagination when files change
  useEffect(() => {
    setCurrentPage(1);
  }, [files]);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };


  const userSpecificFiles = useMemo(() => {
    return currentUser?.role === 'admin' ? files :
      files.filter(file => file.createdBy === currentUser?.id);
  }, [files, currentUser]);

  // Get unique values for dropdowns
  const uniqueBanks = useMemo(() => {
    const banks = [...new Set(userSpecificFiles.map(file => file.bankName).filter(Boolean))];
    return banks.sort();
  }, [userSpecificFiles]);

  const uniqueBranches = useMemo(() => {
    const branches = [...new Set(userSpecificFiles.map(file => file.branchName).filter(Boolean))];
    return branches.sort();
  }, [userSpecificFiles]);

  const uniqueInspectors = useMemo(() => {
    const inspectors = [...new Set(userSpecificFiles.map(file => file.inspectedBy || file.inspector).filter(Boolean))];
    return inspectors.sort();
  }, [userSpecificFiles]);


  const filteredAndSortedFiles = useMemo(() => {
    let filtered = userSpecificFiles;
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(file => file.status === statusFilter);
    }
    
    // Apply bank filter
    if (bankFilter !== 'all') {
      filtered = filtered.filter(file => file.bankName === bankFilter);
    }
    
    // Apply branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(file => file.branchName === branchFilter);
    }
    
    // Apply description filter
    if (descriptionFilter.trim()) {
      const descLower = descriptionFilter.toLowerCase();
      filtered = filtered.filter(file => 
        file.description?.toLowerCase().includes(descLower)
      );
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const todayStr = today.toDateString();
      filtered = filtered.filter(file => {
        const fileDate = new Date(file.createdAt);
        switch (dateFilter) {
          case 'today':
            return fileDate.toDateString() === todayStr;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return fileDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return fileDate >= monthAgo;
          default:
            return true;
        }
      });
    }
    
    
    // Apply inspector filter
    if (inspectorFilter !== 'all') {
      filtered = filtered.filter(file => 
        file.inspectedBy === inspectorFilter || file.inspector === inspectorFilter
      );
    }
    
    // Sort by creation date (newest first)
    return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [userSpecificFiles, statusFilter, bankFilter, branchFilter, descriptionFilter, dateFilter, inspectorFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedFiles.length / FILES_PER_PAGE);
  const startIndex = (currentPage - 1) * FILES_PER_PAGE;
  const endIndex = startIndex + FILES_PER_PAGE;
  const currentFiles = filteredAndSortedFiles.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, bankFilter, branchFilter, descriptionFilter, dateFilter, inspectorFilter]);

  return (
    <div className="home-container">
      <div className="user-row">
        <div className="welcome-message">
          <span className="welcome-text">{getTimeBasedGreeting()}, {currentUser?.fullName?.split(' ')[0] || 'User'}!</span>
        </div>
        
        <button className="date-btn">
          {new Date().toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })}
        </button>
        
        <div className="profile-dropdown-container">
          <span 
            className="profile-text"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            <label className="profile-avatar clickable-avatar" htmlFor="profile-picture-upload">
              <input
                id="profile-picture-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureUpload}
                style={{ display: 'none' }}
                aria-label="Upload profile picture"
              />
              {currentUser?.profilePicture ? (
                <img src={currentUser.profilePicture} alt="Profile" className="profile-image" />
              ) : (
                <span className="profile-letter">
                  {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </label>
            <div className="profile-info">
              <div className="profile-name">{currentUser?.fullName || 'Profile'}</div>
              <div className="user-role-text">{currentUser?.role || 'User'}</div>
            </div>
            <span className="dropdown-arrow">‹</span>
          </span>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="header-left">
                  <div className="dropdown-profile-info">
                    <label className="dropdown-avatar clickable-avatar">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        style={{ display: 'none' }}
                      />
                      {currentUser?.profilePicture ? (
                        <img src={currentUser.profilePicture} alt="Profile" className="dropdown-profile-image" />
                      ) : (
                        <span className="dropdown-profile-letter">
                          {currentUser?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </label>
                    <div className="dropdown-user-details">
                      <strong>{currentUser?.fullName || 'User'}</strong>
                      <span className="user-role">{currentUser?.role || 'User'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item">
                <span className="item-label">User ID:</span>
                <span className="item-value">{currentUser?.id || 'N/A'}</span>
              </div>
              <div className="dropdown-item">
                <span className="item-label">Phone:</span>
                <span className="item-value">{currentUser?.phone || 'N/A'}</span>
              </div>
              <div className="dropdown-item">
                <span className="item-label">Email:</span>
                <span className="item-value">{currentUser?.email || 'N/A'}</span>
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-actions">
                <button 
                  className="dropdown-action view-profile-action"
                  onClick={() => {
                    onViewProfile();
                    setShowProfileDropdown(false);
                  }}
                >
                  View Profile
                </button>
                <button 
                  className="dropdown-action logout-action"
                  onClick={() => {
                    onLogout();
                    setShowProfileDropdown(false);
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* File List */}
      <div className="invoice-list-section">
        <div className="section-header">
          <div></div>
          <div className="header-actions">
            <button 
              className="filter-toggle-btn" 
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button className="btn-primary" onClick={onCreateFile}>
              Start a New Report
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className={`file-controls ${showFilters ? 'filters-open' : 'filters-closed'}`}>
          <div className="filter-row">
            <div className="filter-control">
              <label className="filter-label" htmlFor="status-filter">Status:</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter files by status"
              >
                <option value="all">All Status</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="hold">Hold</option>
                <option value="returned">Returned</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div className="filter-control">
              <label className="filter-label" htmlFor="bank-filter">Bank:</label>
              <select
                id="bank-filter"
                value={bankFilter}
                onChange={(e) => setBankFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter files by bank"
              >
                <option value="all">All Banks</option>
                {uniqueBanks.map(bank => (
                  <option key={bank} value={bank}>{bank}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-control">
              <label className="filter-label" htmlFor="branch-filter">Branch:</label>
              <select
                id="branch-filter"
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter files by branch"
              >
                <option value="all">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-control">
              <label className="filter-label" htmlFor="date-filter">Date:</label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter files by date"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>
            </div>
            
            <div className="filter-control">
              <label className="filter-label" htmlFor="inspector-filter">Inspector:</label>
              <select
                id="inspector-filter"
                value={inspectorFilter}
                onChange={(e) => setInspectorFilter(e.target.value)}
                className="filter-select"
                aria-label="Filter files by inspector"
              >
                <option value="all">All Inspectors</option>
                {uniqueInspectors.map(inspector => (
                  <option key={inspector} value={inspector}>{inspector}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-control">
              <label className="filter-label" htmlFor="description-filter">Description:</label>
              <input
                id="description-filter"
                type="text"
                placeholder="Filter by description..."
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                className="filter-input"
                aria-label="Filter files by description"
              />
            </div>
            
            <div className="filter-control clear-filters">
              <label className="filter-label" style={{visibility: 'hidden'}}>Clear:</label>
              <button 
                onClick={resetFilters}
                className="clear-filters-btn"
                aria-label="Clear all active filters"
              >
                Clear All Filters
              </button>
            </div>
          </div>
          
          <div className="file-count">
            {filteredAndSortedFiles.length} file{filteredAndSortedFiles.length !== 1 ? 's' : ''} found 
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </div>
        </div>

        <div className="file-list-container">
          <div className="file-list-header">
            <div className="header-cell file-status">STATUS</div>
            <div className="header-cell file-number">REPORT #</div>
            <div className="header-cell file-date">DATE</div>
            <div className="header-cell file-client">CLIENT</div>
            <div className="header-cell file-bank">BANK</div>
            <div className="header-cell file-branch">BRANCH</div>
            <div className="header-cell file-inspector">INSPECTOR</div>
            <div className="header-cell file-property-type">PROPERTY TYPE</div>
            <div className="header-cell file-bill-amount">BILL AMOUNT</div>
            <div className="header-cell file-amount">PROPERTY VALUE</div>
            <div className="header-cell file-remarks">REMARKS</div>
          </div>

          <div className="file-list-body">
            {currentFiles.length > 0 ? (
              currentFiles.map((file) => (
                <div key={file.id} className="file-row">
                  <div className="file-cell file-status">
                    <span className={`status-badge status-${file.status || 'in-progress'}`}>
                      {file.status ? file.status.toUpperCase().replace('-', ' ') : 'IN PROGRESS'}
                    </span>
                  </div>
                  <div className="file-cell file-number">
                    <strong 
                      className="clickable-file-number"
                      onClick={() => {
                        if (file.status === 'completed' && file.invoiceAmount) {
                          // For completed files with invoice, show invoice details
                          onViewInvoice?.(file);
                        } else {
                          // For other files, edit the file
                          onEditFile(file);
                        }
                      }}
                      title={file.status === 'completed' && file.invoiceAmount ? "Click to view invoice details" : "Click to edit file"}
                    >
                      {file.fileNumber || 'N/A'}
                    </strong>
                  </div>
                  <div className="file-cell file-date">
                    {new Date(file.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="file-cell file-client">
                    <div className="client-info">
                      <span className="client-name">{file.clientName || 'N/A'}</span>
                      {file.clientPhone && (
                        <span className="client-phone">{file.clientPhone}</span>
                      )}
                    </div>
                  </div>
                  <div className="file-cell file-bank">
                    <span className="bank-name">{file.bankName || 'N/A'}</span>
                  </div>
                  <div className="file-cell file-branch">
                    <span className="branch-name">{file.branchName || 'N/A'}</span>
                  </div>
                  <div className="file-cell file-inspector">
                    <span className="inspector-name">{file.inspectedBy || file.inspector || 'N/A'}</span>
                  </div>
                  <div className="file-cell file-property-type">
                    <div className="property-type-text" title={file.propertyType}>
                      {file.propertyType || 'N/A'}
                    </div>
                  </div>
                  <div className="file-cell file-bill-amount">
                    <span className="bill-amount-value">₹{parseFloat(file.billAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="file-cell file-amount">
                    <span className="amount-value">₹{parseFloat(file.propertyValue || file.amount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="file-cell file-remarks">
                    <div className="remarks-text" title={file.remarks}>
                      {file.remarks?.length > 25 
                        ? `${file.remarks.substring(0, 25)}...` 
                        : file.remarks || 'N/A'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-state-content">
                  {filteredAndSortedFiles.length === 0 && userSpecificFiles.length > 0 ? (
                    // No files match current filters
                    <>
                      <div className="empty-state-icon">🔍</div>
                      <h3>No files match your filters</h3>
                      <p>Try adjusting your filter criteria or clearing all filters to see more results.</p>
                      <button 
                        onClick={resetFilters}
                        className="reset-filters-btn"
                        aria-label="Clear all filters to show all files"
                      >
                        Clear All Filters
                      </button>
                    </>
                  ) : (
                    // No files exist at all
                    <>
                      <div className="empty-state-icon">📄</div>
                      <h3>No files found</h3>
                      <p>
                        {currentUser?.role === 'admin' 
                          ? "No files have been created yet."
                          : "You haven't created any files yet."
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Go to previous page"
              >
                ← Previous
              </button>
              
              <div className="pagination-numbers">
                {totalPages <= 5 ? (
                  // Show all pages if 5 or fewer
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                      aria-label={`Go to page ${page}`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  // Show ellipses only when more than 5 pages
                  Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => 
                      page === 1 || 
                      page === totalPages || 
                      Math.abs(page - currentPage) <= 2
                    )
                    .map((page, index, arr) => (
                      <React.Fragment key={page}>
                        {index > 0 && arr[index - 1] !== page - 1 && (
                          <span className="pagination-ellipsis" aria-hidden="true">...</span>
                        )}
                        <button
                          className={`pagination-number ${page === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                          aria-label={`Go to page ${page}`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))
                )}
              </div>
              
              <button 
                className="pagination-btn"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Go to next page"
              >
                Next →
              </button>
            </div>
          )}
      </div>
      </div>


    </div>
  );
};

export default Home;