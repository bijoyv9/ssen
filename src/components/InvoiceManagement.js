import React, { useState, useCallback, useMemo } from 'react';
import InvoiceDetails from './InvoiceDetails';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const INVOICE_STATUSES = {
  pending: { label: 'Pending', color: '#ffc107', bgColor: '#fff3cd' },
  paid: { label: 'Paid', color: '#28a745', bgColor: '#d4edda' },
  overdue: { label: 'Overdue', color: '#dc3545', bgColor: '#f8d7da' },
  cancelled: { label: 'Cancelled', color: '#6c757d', bgColor: '#e2e3e5' },
  draft: { label: 'Draft', color: '#17a2b8', bgColor: '#d1ecf1' },
  partially_paid: { label: 'Partially Paid', color: '#fd7e14', bgColor: '#ffeaa7' }
};

const InvoiceManagement = ({ invoices, updateInvoice, deleteInvoice, currentUser }) => {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  const getBankShortName = useCallback((bankName) => {
    if (!bankName) return '';
    
    const bankMap = {
      'STATE BANK OF INDIA': 'SBI',
      'PUNJAB NATIONAL BANK': 'PNB',
      'UNITED BANK OF INDIA': 'UBI',
      'BANK OF MAHARASHTRA': 'BOM',
      'HDFC BANK': 'HDFC',
      'ICICI BANK': 'ICICI',
      'AXIS BANK': 'AXIS',
      'CANARA BANK': 'CANARA',
      'BANK OF BARODA': 'BOB',
      'INDIAN BANK': 'IB',
    };
    
    const upperCaseName = bankName.toUpperCase();
    return bankMap[upperCaseName] || bankName.split(' ').map(word => word[0]).join('').toUpperCase();
  }, []);

  const updateInvoiceStatus = useCallback((invoiceId, newStatus, paymentDate = null) => {
    const updatedInvoice = invoices.find(inv => inv.id === invoiceId);
    if (updatedInvoice) {
      const userName = currentUser?.fullName || 'User';
      const date = new Date().toLocaleDateString('en-GB');
      const oldStatus = INVOICE_STATUSES[updatedInvoice.status]?.label || updatedInvoice.status;
      const newStatusLabel = INVOICE_STATUSES[newStatus]?.label || newStatus;
      
      // Add status change to history
      const existingNotes = updatedInvoice.notes || '';
      const statusChangeNote = `${date} - ${userName} changed status from "${oldStatus}" to "${newStatusLabel}"`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${statusChangeNote}` : statusChangeNote;
      
      const updates = {
        status: newStatus,
        paymentDate: newStatus === 'paid' ? paymentDate || new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
        notes: updatedNotes
      };
      updateInvoice(invoiceId, { ...updatedInvoice, ...updates });
    }
  }, [invoices, updateInvoice, currentUser]);

  const addInvoiceNote = useCallback((invoiceId, note) => {
    const updatedInvoice = invoices.find(inv => inv.id === invoiceId);
    if (updatedInvoice) {
      const existingNotes = updatedInvoice.notes || '';
      const timestamp = new Date().toLocaleString();
      const newNote = `[${timestamp}] ${note}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;
      
      updateInvoice(invoiceId, { 
        ...updatedInvoice, 
        notes: updatedNotes,
        updatedAt: new Date().toISOString()
      });
    }
  }, [invoices, updateInvoice]);

  const filteredAndSortedInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      // Filter by user permissions - users can only see their own invoices or invoices assigned to them
      const userCanSee = currentUser?.role === 'admin' || invoice.createdBy === currentUser?.id || invoice.reportMaker === currentUser?.fullName;
      if (!userCanSee) return false;
      
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      const fullClientName = [
        invoice.clientFirstName, 
        invoice.clientMiddleName, 
        invoice.clientLastName
      ].filter(name => name?.trim()).join(' ') || invoice.clientName || '';
      
      const matchesSearch = searchTerm === '' || 
        fullClientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.bankName.toLowerCase().includes(searchTerm.toLowerCase());
        
      return matchesStatus && matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.invoiceDate);
          bValue = new Date(b.invoiceDate);
          break;
        case 'amount':
          aValue = parseFloat(a.total || 0);
          bValue = parseFloat(b.total || 0);
          break;
        case 'client':
          aValue = [a.clientFirstName, a.clientMiddleName, a.clientLastName]
            .filter(name => name?.trim()).join(' ') || a.clientName || '';
          bValue = [b.clientFirstName, b.clientMiddleName, b.clientLastName]
            .filter(name => name?.trim()).join(' ') || b.clientName || '';
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.invoiceNumber;
          bValue = b.invoiceNumber;
      }

      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [invoices, statusFilter, searchTerm, sortBy, sortOrder, currentUser?.id, currentUser?.role]);

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedInvoices.slice(startIndex, endIndex);
  }, [filteredAndSortedInvoices, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedInvoices.length / itemsPerPage);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleItemsPerPageChange = useCallback((newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  }, []);

  const statusCounts = useMemo(() => {
    // Filter invoices by user permissions first
    const userInvoices = invoices.filter(invoice => {
      return currentUser?.role === 'admin' || invoice.createdBy === currentUser?.id || invoice.reportMaker === currentUser?.fullName;
    });
    
    const counts = { all: userInvoices.length };
    Object.keys(INVOICE_STATUSES).forEach(status => {
      counts[status] = userInvoices.filter(inv => inv.status === status).length;
    });
    return counts;
  }, [invoices, currentUser?.id, currentUser?.role, currentUser?.fullName]);

  const totalAmounts = useMemo(() => {
    // Filter invoices by user permissions first
    const userInvoices = invoices.filter(invoice => {
      return currentUser?.role === 'admin' || invoice.createdBy === currentUser?.id || invoice.reportMaker === currentUser?.fullName;
    });
    
    return {
      total: userInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      paid: userInvoices.filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      pending: userInvoices.filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0),
      overdue: userInvoices.filter(inv => inv.status === 'overdue' || (inv.dueDate && new Date(inv.dueDate) < new Date() && inv.status === 'pending'))
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0)
    };
  }, [invoices, currentUser?.id, currentUser?.role, currentUser?.fullName]);

  const exportToExcel = useCallback(() => {
    const exportData = filteredAndSortedInvoices.map(invoice => {
      const fullClientName = [
        invoice.clientFirstName, 
        invoice.clientMiddleName, 
        invoice.clientLastName
      ].filter(name => name?.trim()).join(' ') || invoice.clientName || '';
      
      const gstAmount = invoice.gstApplicable ? (() => {
        const baseAmount = parseFloat(invoice.total || 0);
        let gstRate = 0;
        if (invoice.gstType === 'CGST_SGST') {
          gstRate = (parseFloat(invoice.cgstRate || 0) + parseFloat(invoice.sgstRate || 0));
        } else {
          gstRate = parseFloat(invoice.igstRate || 0);
        }
        return baseAmount * (gstRate / 100);
      })() : 0;
      
      const totalWithGst = parseFloat(invoice.total || 0) + gstAmount;
      
      return {
        'Invoice Number': invoice.invoiceNumber || '',
        'Date': invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-IN') : '',
        'Client Name': fullClientName,
        'Client Address': invoice.clientAddress || '',
        'Client GST Number': invoice.clientGstNumber || '',
        'Bank Name': invoice.bankName || '',
        'Branch Name': invoice.branchName || '',
        'Report Made By': invoice.reportMaker || '',
        'Inspected By': invoice.inspectedBy || '',
        'Description': invoice.description || '',
        'Professional Fees (₹)': parseFloat(invoice.professionalFees || 0),
        'Advance (₹)': parseFloat(invoice.advance || 0),
        'Amount Before GST (₹)': parseFloat(invoice.total || 0),
        'GST Applicable': invoice.gstApplicable ? 'Yes' : 'No',
        'GST Type': invoice.gstApplicable ? invoice.gstType : '',
        'GST Amount (₹)': gstAmount.toFixed(2),
        'Total Amount (₹)': invoice.gstApplicable ? totalWithGst.toFixed(2) : parseFloat(invoice.total || 0).toFixed(2),
        'Status': INVOICE_STATUSES[invoice.status]?.label || invoice.status,
        'Due Date': invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : '',
        'Payment Date': invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString('en-IN') : '',
        'Notes': invoice.notes || '',
        'Created At': invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-IN') : '',
        'Updated At': invoice.updatedAt ? new Date(invoice.updatedAt).toLocaleDateString('en-IN') : ''
      };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 25 }, // Invoice Number
      { wch: 12 }, // Date
      { wch: 20 }, // Client Name
      { wch: 30 }, // Client Address
      { wch: 20 }, // Client GST Number
      { wch: 15 }, // Bank Name
      { wch: 15 }, // Branch Name
      { wch: 15 }, // Report Made By
      { wch: 15 }, // Inspected By
      { wch: 40 }, // Description
      { wch: 15 }, // Professional Fees
      { wch: 12 }, // Advance
      { wch: 18 }, // Amount Before GST
      { wch: 15 }, // GST Applicable
      { wch: 12 }, // GST Type
      { wch: 15 }, // GST Amount
      { wch: 15 }, // Total Amount
      { wch: 12 }, // Status
      { wch: 12 }, // Due Date
      { wch: 12 }, // Payment Date
      { wch: 30 }, // Notes
      { wch: 12 }, // Created At
      { wch: 12 }  // Updated At
    ];
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
    
    const fileName = `S_Sen_Associates_Invoices_${new Date().toISOString().split('T')[0]}.xlsx`;
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, fileName);
  }, [filteredAndSortedInvoices]);

  if (selectedInvoice) {
    // Find the current version of the selected invoice
    const currentInvoice = invoices.find(inv => inv.id === selectedInvoice.id) || selectedInvoice;
    
    return (
      <InvoiceDetails
        invoice={currentInvoice}
        onBack={() => setSelectedInvoice(null)}
        onUpdateStatus={updateInvoiceStatus}
        onAddNote={addInvoiceNote}
        onDelete={deleteInvoice}
        onUpdate={updateInvoice}
        currentUser={currentUser}
      />
    );
  }

  return (
    <div className="invoice-management">
      <div className="management-header">
        <div className="management-title-section">
          <h2>Invoice Management</h2>
          <button onClick={exportToExcel} className="export-excel-btn" title="Export filtered invoices to Excel">
            📊 Export to Excel
          </button>
        </div>
        <div className="summary-cards">
          <div className="summary-card">
            <h3>Total Revenue</h3>
            <p>₹{totalAmounts.total.toLocaleString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Paid</h3>
            <p>₹{totalAmounts.paid.toLocaleString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Pending</h3>
            <p>₹{totalAmounts.pending.toLocaleString('en-IN')}</p>
          </div>
          <div className="summary-card">
            <h3>Overdue</h3>
            <p>₹{totalAmounts.overdue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search invoices by client name, invoice number, or bank..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <div className="status-filters">
            <button
              className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All ({statusCounts.all})
            </button>
            {Object.entries(INVOICE_STATUSES).map(([status, config]) => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
                style={{
                  backgroundColor: statusFilter === status ? config.color : 'transparent',
                  color: statusFilter === status ? 'white' : config.color,
                  borderColor: config.color
                }}
              >
                {config.label} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>

          <div className="sort-controls">
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="items-per-page-select"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
              <option value={200}>200 per page</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
              <option value="client">Sort by Client</option>
              <option value="status">Sort by Status</option>
              <option value="invoice">Sort by Invoice #</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      <div className="table-info">
        <p>
          Showing {paginatedInvoices.length} of {filteredAndSortedInvoices.length} invoices
          {filteredAndSortedInvoices.length !== invoices.length && 
            ` (filtered from ${invoices.length} total)`
          }
        </p>
      </div>

      <div className="invoices-table-container">
        {filteredAndSortedInvoices.length === 0 ? (
          <div className="no-invoices">
            <p>No invoices found matching your criteria.</p>
          </div>
        ) : (
          <>
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Client</th>
                  <th>Bank</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedInvoices.map((invoice) => {
                const fullClientName = [
                  invoice.clientFirstName, 
                  invoice.clientMiddleName, 
                  invoice.clientLastName
                ].filter(name => name?.trim()).join(' ') || invoice.clientName || 'N/A';
                
                const statusConfig = INVOICE_STATUSES[invoice.status] || INVOICE_STATUSES.pending;
                const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < new Date() && invoice.status === 'pending';
                
                return (
                  <tr key={invoice.id} className={`invoice-row ${isOverdue ? 'overdue-row' : ''}`}>
                    <td className="invoice-number">
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="invoice-link"
                      >
                        {invoice.invoiceNumber}
                      </button>
                    </td>
                    <td className="client-name">{fullClientName}</td>
                    <td className="bank-name">{getBankShortName(invoice.bankName)}</td>
                    <td className="invoice-date">
                      {new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="amount">
                      ₹{parseFloat(invoice.total || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="status">
                      <span 
                        className="status-badge-small"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.color}`
                        }}
                      >
                        {statusConfig.label}
                        {isOverdue && ' ⚠️'}
                      </span>
                    </td>
                    <td className="actions">
                      <div className="table-actions">
                        {currentUser?.role === 'admin' && (
                          <>
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                                className="table-action-btn paid large"
                                title="Mark as Paid"
                              >
                                ✓
                              </button>
                            )}
                            {invoice.status === 'pending' && (
                              <button
                                onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                                className="table-action-btn overdue large"
                                title="Mark as Overdue"
                              >
                                ⚠
                              </button>
                            )}
                          </>
                        )}
                        {!['cancelled', 'paid'].includes(invoice.status) && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'cancelled')}
                            className="table-action-btn cancelled large"
                            title="Cancel Invoice"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              </tbody>
            </table>
            
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  Previous
                </button>
                
                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`page-number ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Last
                </button>
                
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvoiceManagement;