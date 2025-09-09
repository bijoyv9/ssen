import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import InvoiceForm from './components/InvoiceForm';
import InvoiceManagement from './components/InvoiceManagement';
import InvoiceDetails from './components/InvoiceDetails';
import BankManagement from './components/BankManagement';
import AdminPanel from './components/AdminPanel';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import FileForm from './components/FileForm';
import FileManagement from './components/FileManagement';
import AdvancedSearch from './components/AdvancedSearch';
import logoImg from './assets/logo.png';
import { ROLES, hasAdminAccess, hasComputerOperatorAccess } from './constants/roles';
import { getParsedLocalStorage, setLocalStorage, getStorageVersion } from './utils/localStorage';
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
  const [selectedFileForInvoice, setSelectedFileForInvoice] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Version tracking for optimized change detection
  const [invoicesVersion, setInvoicesVersion] = useState(0);
  const [banksVersion, setBanksVersion] = useState(0);
  const [filesVersion, setFilesVersion] = useState(0);

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

    // Load initial data using utility functions
    const loadedInvoices = getParsedLocalStorage('invoices', []);
    const loadedBanks = getParsedLocalStorage('banks', []);
    const loadedFiles = getParsedLocalStorage('files', []);
    
    setInvoices(loadedInvoices);
    setBanks(loadedBanks);
    setFiles(loadedFiles);
    
    // Initialize version tracking
    setInvoicesVersion(getStorageVersion('invoices'));
    setBanksVersion(getStorageVersion('banks'));
    setFilesVersion(getStorageVersion('files'));

    // Disable scroll wheel increment/decrement on number inputs
    const preventNumberInputScroll = (e) => {
      if (e.target.type === 'number' && e.target.matches(':focus')) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', preventNumberInputScroll, { passive: false });

    return () => {
      document.removeEventListener('wheel', preventNumberInputScroll);
    };
  }, []);

  // Save data to localStorage with version tracking
  useEffect(() => {
    if (setLocalStorage('invoices', invoices)) {
      setInvoicesVersion(getStorageVersion('invoices'));
    }
  }, [invoices]);

  useEffect(() => {
    if (setLocalStorage('banks', banks)) {
      setBanksVersion(getStorageVersion('banks'));
    }
  }, [banks]);

  useEffect(() => {
    if (setLocalStorage('files', files)) {
      setFilesVersion(getStorageVersion('files'));
    }
  }, [files]);

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

  // Version-based change detection for multi-tab sync
  useEffect(() => {
    const pollForUpdates = () => {
      const currentInvoicesVersion = getStorageVersion('invoices');
      const currentBanksVersion = getStorageVersion('banks');
      const currentFilesVersion = getStorageVersion('files');
      
      if (currentInvoicesVersion > invoicesVersion) {
        const loadedInvoices = getParsedLocalStorage('invoices', []);
        setInvoices(loadedInvoices);
        setInvoicesVersion(currentInvoicesVersion);
      }
      
      if (currentBanksVersion > banksVersion) {
        const loadedBanks = getParsedLocalStorage('banks', []);
        setBanks(loadedBanks);
        setBanksVersion(currentBanksVersion);
      }
      
      if (currentFilesVersion > filesVersion) {
        const loadedFiles = getParsedLocalStorage('files', []);
        setFiles(loadedFiles);
        setFilesVersion(currentFilesVersion);
      }
    };

    const interval = setInterval(pollForUpdates, 5000);
    return () => clearInterval(interval);
  }, [invoicesVersion, banksVersion, filesVersion]);

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
      id: file.id || (Date.now() + Math.random()), // Preserve existing ID or generate new one
      createdAt: file.createdAt || new Date().toISOString(),
      createdBy: currentUser?.id || 'unknown',
      createdByName: currentUser?.fullName || 'Unknown User',
      notes: file.notes ? `${file.notes}\n\n${date} - ${userName} created file ${file.fileNumber} for ₹${parseFloat(file.amount || 0).toLocaleString('en-IN')}` : `${date} - ${userName} created file ${file.fileNumber} for ₹${parseFloat(file.amount || 0).toLocaleString('en-IN')}`
    };
    setFiles(prev => [...prev, fileWithId]);
  }, [currentUser]);

  const updateFile = useCallback((fileId, updatedFile) => {
    console.log('updateFile called with:', { fileId, updatedFile });
    setFiles(prev => {
      const fileExists = prev.find(f => f.id === fileId);
      console.log('File exists in array:', !!fileExists);
      console.log('Total files in array:', prev.length);
      if (!fileExists) {
        console.log('Available file IDs:', prev.map(f => f.id));
      }
      return prev.map(file => 
        file.id === fileId ? { ...file, ...updatedFile } : file
      );
    });
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

  // Helper function to render main content
  const renderMainContent = useCallback(() => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Home 
            files={files}
            currentUser={currentUser}
            onCreateFile={handleCreateFile}
            onViewProfile={() => handleViewTransition('profile')}
            onEditFile={handleEditFile}
            onLogout={handleLogout}
            onProfileUpdate={setCurrentUser}
            onViewInvoice={(file) => {
              // Find the invoice for this file and show invoice details
              const fileInvoice = invoices.find(inv => 
                inv.currentFile?.id === file.id || 
                inv.additionalFiles?.some(af => af.id === file.id)
              );
              if (fileInvoice) {
                setSelectedInvoice(fileInvoice);
                handleViewTransition('viewInvoice');
              }
            }}
          />
        );
      
      case 'createInvoice':
        return (
          <InvoiceForm 
            addInvoice={addInvoice} 
            invoices={invoices} 
            files={files} 
            selectedFileForInvoice={selectedFileForInvoice} 
            currentUser={currentUser}
            onBackToFiles={() => {
              setSelectedFileForEdit(selectedFileForInvoice);
              setCurrentView('editFile');
            }}
            onInvoiceSubmitted={(fileId, invoiceAmount) => {
              updateFile(fileId, { 
                status: 'completed',
                invoiceAmount: invoiceAmount,
                billAmount: invoiceAmount,
                completedAt: new Date().toISOString()
              });
            }}
          />
        );
      
      case 'createFile':
        return (
          <FileForm 
            onSave={(file) => {
              addFile(file);
            }}
            onUpdate={(fileId, updatedFile) => {
              updateFile(fileId, updatedFile);
            }}
            onCancel={() => handleViewTransition('dashboard')}
            onGenerateInvoice={(fileData) => {
              setSelectedFileForInvoice(fileData);
              handleViewTransition('createInvoice');
            }}
            files={files}
            currentUser={currentUser}
          />
        );
      
      case 'editFile':
        return (
          <FileForm 
            onSave={(file) => {
              updateFile(file.id, file);
            }}
            onUpdate={(fileId, updatedFile) => {
              updateFile(fileId, updatedFile);
            }}
            onCancel={() => handleViewTransition('dashboard')}
            onGenerateInvoice={(fileData) => {
              setSelectedFileForInvoice(fileData);
              handleViewTransition('createInvoice');
            }}
            editingFile={selectedFileForEdit}
            files={files}
            currentUser={currentUser}
          />
        );
      
      case 'management':
        return hasAdminAccess(currentUser) ? (
          <InvoiceManagement 
            invoices={invoices} 
            currentUser={currentUser}
            updateInvoice={updateInvoice}
            deleteInvoice={deleteInvoice}
          />
        ) : <div>Access Denied</div>;
      
      case 'banks':
        return hasComputerOperatorAccess(currentUser) ? (
          <BankManagement 
            banks={banks} 
            addBank={addBank}
            updateBank={updateBank} 
            deleteBank={deleteBank}
            currentUser={currentUser}
          />
        ) : <div>Access Denied</div>;
      
      case 'search':
        return (
          <AdvancedSearch 
            files={files}
            currentUser={currentUser}
            onEditFile={handleEditFile}
          />
        );
      
      case 'admin':
        return hasAdminAccess(currentUser) ? (
          <AdminPanel 
            currentUser={currentUser}
            onEditUser={handleViewUserProfile}
          />
        ) : <div>Access Denied</div>;
      
      case 'userEdit':
        return hasAdminAccess(currentUser) ? (
          <UserProfile 
            currentUser={currentUser}
            editingUser={selectedUserForEdit}
            onCancel={() => handleViewTransition('admin')}
            onUserUpdated={() => handleViewTransition('admin')}
          />
        ) : <div>Access Denied</div>;
      
      case 'profile':
        return (
          <UserProfile 
            currentUser={currentUser}
            onCancel={() => handleViewTransition('dashboard')}
          />
        );
      
      case 'viewInvoice':
        return (
          <InvoiceDetails 
            invoice={selectedInvoice}
            onBack={() => handleViewTransition('dashboard')}
          />
        );
      
      default:
        return <div>Access Denied</div>;
    }
  }, [
    currentView, files, currentUser, invoices, selectedFileForInvoice, 
    selectedFileForEdit, selectedUserForEdit, banks, handleCreateFile, 
    handleViewTransition, handleEditFile, handleLogout, addInvoice, 
    updateFile, addFile, updateInvoice, deleteInvoice, addBank, 
    updateBank, deleteBank, handleViewUserProfile
  ]);




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
              title="Go to Dashboard"
            />
            <h1 className="company-name">S Sen & Associates</h1>
          </div>
          
          <div className="header-nav">
            <button 
              className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleViewTransition('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-btn ${currentView === 'advancedSearch' ? 'active' : ''}`}
              onClick={() => handleViewTransition('advancedSearch')}
              title="Find a File"
            >
              Find a File
            </button>
            {hasAdminAccess(currentUser) && (
              <button 
                className={`nav-btn ${currentView === 'management' ? 'active' : ''}`}
                onClick={() => handleViewTransition('management')}
              >
                Accounting
              </button>
            )}
            {hasComputerOperatorAccess(currentUser) && (
              <button 
                className={`nav-btn ${currentView === 'banks' ? 'active' : ''}`}
                onClick={() => handleViewTransition('banks')}
              >
                Bank Accounts
              </button>
            )}
            {hasAdminAccess(currentUser) && (
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
            onEditFile={handleEditFile}
            onLogout={handleLogout}
            onViewInvoice={(file) => {
              // Find the invoice for this file and show invoice details
              const fileInvoice = invoices.find(inv => 
                inv.currentFile?.id === file.id || 
                inv.additionalFiles?.some(af => af.id === file.id)
              );
              if (fileInvoice) {
                setSelectedInvoice(fileInvoice);
                handleViewTransition('viewInvoice');
              }
            }}
          />
        ) : currentView === 'createInvoice' ? (
          <InvoiceForm 
            addInvoice={addInvoice} 
            invoices={invoices} 
            files={files} 
            selectedFileForInvoice={selectedFileForInvoice} 
            currentUser={currentUser}
            onBackToFiles={() => {
              setSelectedFileForEdit(selectedFileForInvoice);
              setCurrentView('editFile');
            }}
            onInvoiceSubmitted={(fileId, invoiceAmount) => {
              updateFile(fileId, { 
                status: 'completed',
                invoiceAmount: invoiceAmount,
                billAmount: invoiceAmount,
                completedAt: new Date().toISOString()
              });
            }}
          />
        ) : currentView === 'createFile' ? (
          <FileForm 
            onSave={(file) => {
              addFile(file);
            }}
            onUpdate={(fileId, updatedFile) => {
              updateFile(fileId, updatedFile);
            }}
            onCancel={() => handleViewTransition('dashboard')}
            onGenerateInvoice={(fileData) => {
              setSelectedFileForInvoice(fileData);
              handleViewTransition('createInvoice');
            }}
            files={files}
            currentUser={currentUser}
          />
        ) : currentView === 'editFile' ? (
          <FileForm 
            onSave={(file) => {
              updateFile(file.id, file);
            }}
            onUpdate={(fileId, updatedFile) => {
              updateFile(fileId, updatedFile);
            }}
            onCancel={() => handleViewTransition('dashboard')}
            onGenerateInvoice={(fileData) => {
              setSelectedFileForInvoice(fileData);
              handleViewTransition('createInvoice');
            }}
            editingFile={selectedFileForEdit}
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
        ) : currentView === 'advancedSearch' ? (
          <AdvancedSearch
            files={files}
            onEditFile={handleEditFile}
            onDeleteFile={deleteFile}
            currentUser={currentUser}
          />
        ) : currentView === 'viewInvoice' ? (
          <InvoiceDetails 
            invoice={selectedInvoice}
            onBack={() => handleViewTransition('dashboard')}
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
