import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import InvoiceForm from './components/InvoiceForm';
import InvoiceManagement from './components/InvoiceManagement';
import BankManagement from './components/BankManagement';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import FileForm from './components/FileForm';
import FileManagement from './components/FileManagement';
import FileDetails from './components/FileDetails';
import AdvancedSearch from './components/AdvancedSearch';
import logoImg from './assets/logo.png';
import './App.css';

function App() {
  const [invoices, setInvoices] = useState([]);
  const [banks, setBanks] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [selectedFileForEdit, setSelectedFileForEdit] = useState(null);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

      const storedFiles = localStorage.getItem('files');
      if (storedFiles) {
        const parsedFiles = JSON.parse(storedFiles);
        if (Array.isArray(parsedFiles)) {
          setFiles(parsedFiles);
        }
      }
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      setInvoices([]);
      setBanks([]);
      setFiles([]);
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



  useEffect(() => {
    try {
      localStorage.setItem('banks', JSON.stringify(banks));
    } catch (error) {
      console.error('Failed to save banks to localStorage:', error);
    }
  }, [banks]);

  useEffect(() => {
    try {
      localStorage.setItem('files', JSON.stringify(files));
    } catch (error) {
      console.error('Failed to save files to localStorage:', error);
    }
  }, [files]);

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

  const addFile = useCallback((file) => {
    const userName = currentUser?.fullName || 'User';
    const date = new Date().toLocaleDateString('en-GB');
    const fileWithId = {
      ...file,
      id: Date.now() + Math.random(),
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.fullName || 'Unknown User',
      notes: file.notes ? `${file.notes}\n\n${date} - ${userName} created file ${file.fileNumber} for ₹${parseFloat(file.amount || 0).toLocaleString('en-IN')}` : `${date} - ${userName} created file ${file.fileNumber} for ₹${parseFloat(file.amount || 0).toLocaleString('en-IN')}`
    };
    setFiles(prev => [...prev, fileWithId]);
  }, [currentUser]);

  const updateFile = useCallback((fileId, updatedFile) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? updatedFile : file
    ));
  }, []);

  const deleteFile = useCallback((fileId) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  // Handle smooth page transitions (defined early to avoid circular dependency)
  const handleViewTransition = useCallback((newView) => {
    if (newView === currentView) return;
    
    setIsTransitioning(true);
    
    // Short delay to trigger fade-out
    setTimeout(() => {
      setCurrentView(newView);
    }, 75);
    
    // Reset transition state after fade-in
    setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
  }, [currentView]);

  const handleViewUserProfile = useCallback((user) => {
    setSelectedUserForEdit(user);
    handleViewTransition('userEdit');
  }, [handleViewTransition]);

  const handleEditFile = useCallback((file) => {
    setSelectedFileForEdit(file);
    handleViewTransition('editFile');
  }, [handleViewTransition]);

  const handleCreateFile = useCallback(() => {
    setSelectedFileForEdit(null);
    handleViewTransition('createFile');
  }, [handleViewTransition]);

  const handleViewFileDetails = useCallback((file) => {
    setSelectedFileForDetails(file);
    handleViewTransition('fileDetails');
  }, [handleViewTransition]);

  const handleAddFileNote = useCallback((fileId, note) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const existingNotes = file.notes || '';
        const updatedNotes = existingNotes ? `${existingNotes}\n${note}` : note;
        return { ...file, notes: updatedNotes, updatedAt: new Date().toISOString() };
      }
      return file;
    }));
  }, []);



  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="App">      
      <header className="App-header">
        <div className="company-header">
          <div className="logo-company-section">
            <img 
              src={logoImg} 
              alt="Logo" 
              className="header-logo clickable-logo" 
              onClick={() => handleViewTransition('dashboard')}
              title="Go to Home"
            />
            <h1 className="company-name">S Sen & Associates</h1>
          </div>
          
          <div className="header-nav">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleViewTransition('dashboard')}
            >
              Home
            </button>
            <button 
              className={`nav-btn ${currentView === 'advancedSearch' ? 'active' : ''}`}
              onClick={() => handleViewTransition('advancedSearch')}
              title="Find a File"
            >
              Find a File
            </button>
            {currentUser?.role === 'admin' && (
              <button 
                className={`nav-btn ${currentView === 'management' ? 'active' : ''}`}
                onClick={() => handleViewTransition('management')}
              >
                Accounting
              </button>
            )}
            {(currentUser?.role === 'admin' || currentUser?.role === 'computer-operator') && (
              <button 
                className={`nav-btn ${currentView === 'banks' ? 'active' : ''}`}
                onClick={() => handleViewTransition('banks')}
              >
                Bank Accounts
              </button>
            )}
            {currentUser?.role === 'admin' && (
              <button 
                className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
                onClick={() => handleViewTransition('admin')}
              >
                Admin Panel
              </button>
            )}
            
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


      <main className={`main-content ${isTransitioning ? 'transitioning' : ''}`}>
        {currentView === 'dashboard' ? (
          <Home 
            files={files}
            currentUser={currentUser}
            onCreateFile={handleCreateFile}
            onViewProfile={() => handleViewTransition('profile')}
            onViewFileDetails={handleViewFileDetails}
            onLogout={handleLogout}
          />
        ) : currentView === 'createInvoice' ? (
          <InvoiceForm addInvoice={addInvoice} invoices={invoices} currentUser={currentUser} />
        ) : currentView === 'createFile' ? (
          <FileForm 
            onSave={(file) => {
              addFile(file);
              handleViewTransition('dashboard');
            }}
            onCancel={() => handleViewTransition('dashboard')}
            banks={banks}
            files={files}
            currentUser={currentUser}
          />
        ) : currentView === 'editFile' ? (
          <FileForm 
            onSave={(file) => {
              updateFile(file.id, file);
              handleViewTransition('dashboard');
            }}
            onCancel={() => handleViewTransition('dashboard')}
            editingFile={selectedFileForEdit}
            banks={banks}
            files={files}
            currentUser={currentUser}
          />
        ) : currentView === 'management' && currentUser?.role === 'admin' ? (
          <InvoiceManagement 
            invoices={invoices}
            updateInvoice={updateInvoice}
            deleteInvoice={deleteInvoice}
            currentUser={currentUser}
          />
        ) : currentView === 'banks' && (currentUser?.role === 'admin' || currentUser?.role === 'computer-operator') ? (
          <BankManagement
            banks={banks}
            addBank={addBank}
            updateBank={updateBank}
            deleteBank={deleteBank}
            currentUser={currentUser}
          />
        ) : currentView === 'fileManagement' ? (
          <FileManagement
            files={files}
            addFile={addFile}
            updateFile={updateFile}
            deleteFile={deleteFile}
            onEditFile={handleEditFile}
            onCreateFile={handleCreateFile}
            currentUser={currentUser}
            banks={banks}
          />
        ) : currentView === 'admin' && currentUser?.role === 'admin' ? (
          <AdminPanel onViewUserProfile={handleViewUserProfile} />
        ) : currentView === 'userEdit' && currentUser?.role === 'admin' ? (
          <UserProfile 
            currentUser={selectedUserForEdit}
            onBack={() => handleViewTransition('admin')}
            isEditable={true}
          />
        ) : currentView === 'profile' ? (
          <UserProfile 
            currentUser={currentUser}
            onBack={() => handleViewTransition('dashboard')}
          />
        ) : currentView === 'fileDetails' ? (
          <FileDetails 
            file={selectedFileForDetails}
            onBack={() => handleViewTransition('dashboard')}
            onUpdate={updateFile}
            onAddNote={handleAddFileNote}
            onDelete={deleteFile}
            currentUser={currentUser}
          />
        ) : currentView === 'advancedSearch' ? (
          <AdvancedSearch
            files={files}
            onViewFileDetails={handleViewFileDetails}
            onEditFile={handleEditFile}
            onDeleteFile={deleteFile}
            currentUser={currentUser}
          />
        ) : (
          <div>Access Denied</div>
        )}
      </main>
      
      <footer className="simple-footer">
        <p>© 2025 S. Sen & Associates. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
