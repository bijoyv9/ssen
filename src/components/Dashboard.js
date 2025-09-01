import React, { useMemo } from 'react';

const Dashboard = ({ invoices, currentUser, onCreateInvoice, onViewProfile, onLogout, onViewAllInvoices }) => {
  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status !== 'pending' || !inv.dueDate) return false;
      return new Date(inv.dueDate) < new Date();
    }).length;

    // User-specific stats
    const userInvoices = invoices.filter(inv => inv.createdBy === currentUser?.id);
    const userTotalInvoices = userInvoices.length;
    const userTotalAmount = userInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
    const userPendingInvoices = userInvoices.filter(inv => inv.status === 'pending').length;
    const userPaidInvoices = userInvoices.filter(inv => inv.status === 'paid').length;

    // Recent invoices (last 5) - filtered by user role
    const recentInvoices = invoices
      .filter(inv => {
        // Admin can see all invoices, regular users only see their own
        return currentUser?.role === 'admin' || inv.createdBy === currentUser?.id;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    // Monthly stats (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.createdAt);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });
    const monthlyAmount = monthlyInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);

    return {
      totalInvoices,
      totalAmount,
      pendingInvoices,
      paidInvoices,
      overdueInvoices,
      userTotalInvoices,
      userTotalAmount,
      userPendingInvoices,
      userPaidInvoices,
      recentInvoices,
      monthlyInvoices: monthlyInvoices.length,
      monthlyAmount
    };
  }, [invoices, currentUser]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="dashboard">
      <div className="user-welcome-header">
        <div className="welcome-section">
          <div className="welcome-title">
            <h1>Welcome, {currentUser?.fullName || 'User'}</h1>
          </div>
        </div>
        <div className="primary-action">
          <button 
            className="create-invoice-btn"
            onClick={onCreateInvoice}
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* Admin Overview Stats */}
      {currentUser?.role === 'admin' && (
        <div className="stats-section">
          <h3>Company Overview</h3>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-info">
                <div className="stat-label">Total Invoices</div>
                <div className="stat-number">{stats.totalInvoices}</div>
              </div>
            </div>

            <div className="stat-card amount">
              <div className="stat-info">
                <div className="stat-label">Total Amount</div>
                <div className="stat-number">{formatCurrency(stats.totalAmount)}</div>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-info">
                <div className="stat-label">Pending</div>
                <div className="stat-number">{stats.pendingInvoices}</div>
              </div>
            </div>

            <div className="stat-card paid">
              <div className="stat-info">
                <div className="stat-label">Paid</div>
                <div className="stat-number">{stats.paidInvoices}</div>
              </div>
            </div>

            <div className="stat-card overdue">
              <div className="stat-info">
                <div className="stat-label">Overdue</div>
                <div className="stat-number">{stats.overdueInvoices}</div>
              </div>
            </div>

            <div className="stat-card monthly">
              <div className="stat-info">
                <div className="stat-label">This Month</div>
                <div className="stat-number">{stats.monthlyInvoices}</div>
                <div className="stat-sublabel">{formatCurrency(stats.monthlyAmount)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Stats */}
      <div className="stats-section">
        <h3>{currentUser?.role === 'admin' ? 'Your Statistics' : 'Your Statistics'}</h3>
        <div className="stats-grid user-stats">
          <div className="stat-card user-total">
            <div className="stat-info">
              <div className="stat-label">{currentUser?.role === 'admin' ? 'Your Invoices' : 'Total Invoices'}</div>
              <div className="stat-number">{stats.userTotalInvoices}</div>
            </div>
          </div>

          <div className="stat-card user-amount">
            <div className="stat-info">
              <div className="stat-label">{currentUser?.role === 'admin' ? 'Your Total Amount' : 'Total Amount'}</div>
              <div className="stat-number">{formatCurrency(stats.userTotalAmount)}</div>
            </div>
          </div>

          <div className="stat-card user-pending">
            <div className="stat-info">
              <div className="stat-label">{currentUser?.role === 'admin' ? 'Your Pending' : 'Pending'}</div>
              <div className="stat-number">{stats.userPendingInvoices}</div>
            </div>
          </div>

          <div className="stat-card user-paid">
            <div className="stat-info">
              <div className="stat-label">{currentUser?.role === 'admin' ? 'Your Paid' : 'Paid'}</div>
              <div className="stat-number">{stats.userPaidInvoices}</div>
            </div>
          </div>
        </div>
      </div>


      {/* Recent Activity */}
      <div className="recent-section">
        <div className="section-header-dashboard">
          <h3>Recent Invoices</h3>
          <span className="section-subtitle">Last {stats.recentInvoices.length} invoices</span>
        </div>
        <div className="recent-invoices">
          {stats.recentInvoices.length > 0 ? (
            <>
              <table className="recent-invoices-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInvoices.map((invoice) => (
                    <tr key={invoice.id} className="recent-invoice-row">
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.clientFirstName} {invoice.clientLastName}</td>
                      <td>{new Date(invoice.createdAt).toLocaleDateString('en-IN')}</td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>
                        <span className={`status-badge ${invoice.status}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="recent-invoices-footer">
                <button className="view-all-btn" onClick={onViewAllInvoices}>
                  View All Invoices →
                </button>
              </div>
            </>
          ) : (
            <div className="no-invoices">
              <div className="no-invoices-icon">📄</div>
              <h4>No Invoices Yet</h4>
              <p>Start by creating your first invoice to track your business activities.</p>
              <button 
                className="create-first-invoice-btn"
                onClick={onCreateInvoice}
              >
                Create Your First Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;