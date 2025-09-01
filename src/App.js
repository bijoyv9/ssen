import React, { useState, useEffect, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoiceManagement from './components/InvoiceManagement';
import BankManagement from './components/BankManagement';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import Footer from './components/Footer';
import './App.css';

function App() {
  const [invoices, setInvoices] = useState([]);
  const [banks, setBanks] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }

    try {
      const storedInvoices = localStorage.getItem('invoices');
      if (storedInvoices) {
        const parsedInvoices = JSON.parse(storedInvoices);
        if (Array.isArray(parsedInvoices)) {
          setInvoices(parsedInvoices);
        }
      }

      const storedBanks = localStorage.getItem('banks');
      if (storedBanks) {
        const parsedBanks = JSON.parse(storedBanks);
        if (Array.isArray(parsedBanks)) {
          setBanks(parsedBanks);
        }
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      setInvoices([]);
      setBanks([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('invoices', JSON.stringify(invoices));
    } catch (error) {
      console.error('Failed to save invoices to localStorage:', error);
    }
  }, [invoices]);

  // Real-time updates: Listen for localStorage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'invoices' && e.newValue) {
        setIsUpdating(true);
        try {
          const updatedInvoices = JSON.parse(e.newValue);
          if (Array.isArray(updatedInvoices)) {
            setInvoices(updatedInvoices);
          }
        } catch (error) {
          console.error('Failed to parse updated invoices:', error);
        }
        setTimeout(() => setIsUpdating(false), 1000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time updates: Periodic polling for changes
  useEffect(() => {
    const pollForUpdates = () => {
      try {
        const storedInvoices = localStorage.getItem('invoices');
        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          if (Array.isArray(parsedInvoices) && JSON.stringify(parsedInvoices) !== JSON.stringify(invoices)) {
            setInvoices(parsedInvoices);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    const interval = setInterval(pollForUpdates, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [invoices]);

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

  useEffect(() => {
    try {
      localStorage.setItem('banks', JSON.stringify(banks));
    } catch (error) {
      console.error('Failed to save banks to localStorage:', error);
    }
  }, [banks]);

  const handleLogin = useCallback((user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    setCurrentView('dashboard');
    localStorage.removeItem('currentUser');
  }, []);

  const addInvoice = useCallback((invoice) => {
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    const invoiceWithId = {
      ...invoice,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.fullName || 'Unknown User',
      notes: `${date} - ${userName} created invoice ${invoice.invoiceNumber} for ₹${parseFloat(invoice.total || 0).toLocaleString('en-IN')}`
    };
    setInvoices(prev => [...prev, invoiceWithId]);
  }, [currentUser]);

  const deleteInvoice = useCallback((invoiceId) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  }, []);

  const updateInvoice = useCallback((invoiceId, updatedInvoice) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? updatedInvoice : invoice
    ));
  }, []);

  const addBank = useCallback((bank) => {
    setBanks(prev => [...prev, bank]);
  }, []);

  const updateBank = useCallback((updatedBank) => {
    setBanks(prev => prev.map(bank => 
      bank.id === updatedBank.id ? updatedBank : bank
    ));
  }, []);

  const deleteBank = useCallback((bankId) => {
    setBanks(prev => prev.filter(bank => bank.id !== bankId));
  }, []);

  const handleViewUserProfile = useCallback((user) => {
    setSelectedUserForEdit(user);
    setCurrentView('userEdit');
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">      
      <header className="App-header">
        <div className="header-content">
          <div className="logo-section">
            {/* Add your logo here */}
            {/* <img src="/path-to-your-logo.png" alt="S. Sen & Associates Logo" className="company-logo" /> */}
          </div>
          <div className="company-info">
            <h1>S. Sen & Associates</h1>
            <p className="company-subtitle">Three decades of dedication</p>
          </div>
          <div className="header-spacer">
            {isUpdating && (
              <div className="sync-indicator">
                <span style={{color: '#3b82f6', fontSize: '0.9rem', fontWeight: '600'}}>
                  🔄 Syncing...
                </span>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <nav className="main-nav">
        <div className="nav-left">
          <button 
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          {currentUser?.role === 'admin' && (
            <button 
              className={`nav-btn ${currentView === 'management' ? 'active' : ''}`}
              onClick={() => setCurrentView('management')}
            >
              Manage Invoices
            </button>
          )}
          <button 
            className={`nav-btn ${currentView === 'banks' ? 'active' : ''}`}
            onClick={() => setCurrentView('banks')}
          >
            Bank Accounts
          </button>
          {currentUser?.role === 'admin' && (
            <button 
              className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => setCurrentView('admin')}
            >
              Admin Panel
            </button>
          )}
        </div>
        <div className="nav-right">
          <div className="profile-dropdown-container">
            <button 
              className="nav-btn profile-btn"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {currentUser?.fullName || 'Profile'} ▼
            </button>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <div className="header-left">
                    <strong>{currentUser?.fullName || 'User'}</strong>
                    <span className="user-role">{currentUser?.role || 'User'}</span>
                  </div>
                  <button 
                    className="view-profile-btn"
                    onClick={() => {
                      setCurrentView('profile');
                      setShowProfileDropdown(false);
                    }}
                  >
                    View Profile
                  </button>
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
                <button 
                  className="dropdown-action logout-action"
                  onClick={() => {
                    handleLogout();
                    setShowProfileDropdown(false);
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>
        {currentView === 'dashboard' ? (
          <Dashboard 
            invoices={invoices}
            currentUser={currentUser}
            onCreateInvoice={() => setCurrentView('createInvoice')}
            onViewProfile={() => setCurrentView('profile')}
            onLogout={handleLogout}
            onViewAllInvoices={() => setCurrentView('management')}
          />
        ) : currentView === 'createInvoice' ? (
          <InvoiceForm addInvoice={addInvoice} invoices={invoices} />
        ) : currentView === 'management' ? (
          <InvoiceManagement 
            invoices={invoices}
            updateInvoice={updateInvoice}
            deleteInvoice={deleteInvoice}
            currentUser={currentUser}
          />
        ) : currentView === 'banks' ? (
          <BankManagement
            banks={banks}
            addBank={addBank}
            updateBank={updateBank}
            deleteBank={deleteBank}
            currentUser={currentUser}
          />
        ) : currentView === 'admin' && currentUser?.role === 'admin' ? (
          <AdminPanel onViewUserProfile={handleViewUserProfile} />
        ) : currentView === 'userEdit' && currentUser?.role === 'admin' ? (
          <UserProfile 
            currentUser={selectedUserForEdit}
            onBack={() => setCurrentView('admin')}
            isEditable={true}
          />
        ) : currentView === 'profile' ? (
          <UserProfile 
            currentUser={currentUser}
            onBack={() => setCurrentView('dashboard')}
          />
        ) : (
          <div>Access Denied</div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;
