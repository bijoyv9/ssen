import React, { useState, useCallback, useMemo } from 'react';

const BankManagement = ({ banks, addBank, updateBank, deleteBank, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bank, setBank] = useState({
    bankName: '',
    branchName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'Current',
    accountHolderName: 'S. Sen & Associates',
    isDefault: false
  });
  const [errors, setErrors] = useState({});

  const resetForm = useCallback(() => {
    setBank({
      bankName: '',
      branchName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'Current',
      accountHolderName: 'S. Sen & Associates',
      isDefault: false
    });
    setErrors({});
    setEditingBank(null);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};
    
    if (!bank.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }
    if (!bank.branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    }
    if (!bank.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!bank.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bank.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format';
    }
    if (!bank.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [bank]);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setBank(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value.toUpperCase()
    }));
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const bankData = {
      ...bank,
      id: editingBank ? editingBank.id : Date.now().toString(),
      createdAt: editingBank ? editingBank.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingBank) {
      // If editing and setting as default, remove default from others
      if (bank.isDefault) {
        banks.forEach(existingBank => {
          if (existingBank.id !== editingBank.id && existingBank.isDefault) {
            updateBank({ ...existingBank, isDefault: false });
          }
        });
      }
      updateBank(bankData);
    } else {
      // If adding new bank and marked as default, remove default from others
      if (bank.isDefault) {
        banks.forEach(existingBank => {
          if (existingBank.isDefault) {
            updateBank({ ...existingBank, isDefault: false });
          }
        });
      }
      addBank(bankData);
    }

    resetForm();
    setShowForm(false);
  }, [bank, editingBank, banks, addBank, updateBank, validateForm, resetForm]);

  const handleEdit = useCallback((bankToEdit) => {
    setBank(bankToEdit);
    setEditingBank(bankToEdit);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((bankId) => {
    if (window.confirm('Are you sure you want to delete this bank account?')) {
      deleteBank(bankId);
    }
  }, [deleteBank]);

  const handleSetDefault = useCallback((bankId) => {
    // Remove default status from all banks
    banks.forEach(existingBank => {
      if (existingBank.isDefault) {
        updateBank({ ...existingBank, isDefault: false });
      }
    });
    
    // Set the selected bank as default
    const bankToUpdate = banks.find(b => b.id === bankId);
    if (bankToUpdate) {
      updateBank({ ...bankToUpdate, isDefault: true });
    }
  }, [banks, updateBank]);

  const defaultBank = useMemo(() => {
    return banks.find(b => b.isDefault) || banks[0];
  }, [banks]);

  return (
    <div className="bank-management">
      <div className="bank-header">
        <h2>Bank Account Management</h2>
        {currentUser?.role === 'admin' && (
          <button 
            onClick={() => setShowForm(true)}
            className="add-bank-btn"
          >
            + Add Bank Account
          </button>
        )}
      </div>

      {showForm && (
        <div className="bank-form-overlay">
          <div className="bank-form-container">
            <div className="bank-form-header">
              <h3>{editingBank ? 'Edit Bank Account' : 'Add New Bank Account'}</h3>
              <button 
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="close-form-btn"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="bank-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="bankName">Bank Name *</label>
                  <input
                    id="bankName"
                    type="text"
                    name="bankName"
                    value={bank.bankName}
                    onChange={handleChange}
                    className={errors.bankName ? 'error' : ''}
                    placeholder="e.g., State Bank of India"
                  />
                  {errors.bankName && <span className="error-message">{errors.bankName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="branchName">Branch Name *</label>
                  <input
                    id="branchName"
                    type="text"
                    name="branchName"
                    value={bank.branchName}
                    onChange={handleChange}
                    className={errors.branchName ? 'error' : ''}
                    placeholder="e.g., Fort Branch, Mumbai"
                  />
                  {errors.branchName && <span className="error-message">{errors.branchName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="accountNumber">Account Number *</label>
                  <input
                    id="accountNumber"
                    type="text"
                    name="accountNumber"
                    value={bank.accountNumber}
                    onChange={handleChange}
                    className={errors.accountNumber ? 'error' : ''}
                    placeholder="Enter account number"
                  />
                  {errors.accountNumber && <span className="error-message">{errors.accountNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="ifscCode">IFSC Code *</label>
                  <input
                    id="ifscCode"
                    type="text"
                    name="ifscCode"
                    value={bank.ifscCode}
                    onChange={handleChange}
                    className={errors.ifscCode ? 'error' : ''}
                    placeholder="e.g., SBIN0000123"
                    maxLength="11"
                  />
                  {errors.ifscCode && <span className="error-message">{errors.ifscCode}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="accountType">Account Type</label>
                  <select
                    id="accountType"
                    name="accountType"
                    value={bank.accountType}
                    onChange={handleChange}
                  >
                    <option value="Current">Current Account</option>
                    <option value="Savings">Savings Account</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="accountHolderName">Account Holder Name *</label>
                  <input
                    id="accountHolderName"
                    type="text"
                    name="accountHolderName"
                    value={bank.accountHolderName}
                    onChange={handleChange}
                    className={errors.accountHolderName ? 'error' : ''}
                  />
                  {errors.accountHolderName && <span className="error-message">{errors.accountHolderName}</span>}
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isDefault"
                    checked={bank.isDefault}
                    onChange={handleChange}
                  />
                  Set as default bank account
                </label>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-bank-btn">
                  {editingBank ? 'Update Bank Account' : 'Add Bank Account'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="cancel-bank-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="banks-list">
        {banks.length === 0 ? (
          <div className="no-banks">
            <p>No bank accounts added yet. Add your first bank account to get started.</p>
          </div>
        ) : (
          <>
            {defaultBank && (
              <div className="default-bank-info">
                <h3>Default Bank Account</h3>
                <div className="bank-card default">
                  <div className="bank-info">
                    <h4>{defaultBank.bankName}</h4>
                    <p><strong>Branch:</strong> {defaultBank.branchName}</p>
                    <p><strong>Account:</strong> {defaultBank.accountNumber}</p>
                    <p><strong>IFSC:</strong> {defaultBank.ifscCode}</p>
                    <p><strong>Type:</strong> {defaultBank.accountType}</p>
                    <p><strong>Holder:</strong> {defaultBank.accountHolderName}</p>
                  </div>
                  {currentUser?.role === 'admin' && (
                    <div className="bank-actions">
                      <button 
                        onClick={() => handleEdit(defaultBank)}
                        className="edit-bank-btn"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="all-banks-section">
              <h3>All Bank Accounts ({banks.length})</h3>
              <div className="banks-grid">
                {banks.map((bankItem) => (
                  <div 
                    key={bankItem.id} 
                    className={`bank-card ${bankItem.isDefault ? 'is-default' : ''}`}
                  >
                    <div className="bank-info">
                      <h4>
                        {bankItem.bankName}
                        {bankItem.isDefault && <span className="default-badge">Default</span>}
                      </h4>
                      <p><strong>Branch:</strong> {bankItem.branchName}</p>
                      <p><strong>Account:</strong> {bankItem.accountNumber}</p>
                      <p><strong>IFSC:</strong> {bankItem.ifscCode}</p>
                      <p><strong>Type:</strong> {bankItem.accountType}</p>
                      <p><strong>Holder:</strong> {bankItem.accountHolderName}</p>
                    </div>
                    {currentUser?.role === 'admin' ? (
                      <div className="bank-actions">
                        {!bankItem.isDefault && (
                          <button 
                            onClick={() => handleSetDefault(bankItem.id)}
                            className="set-default-btn"
                          >
                            Set Default
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(bankItem)}
                          className="edit-bank-btn"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(bankItem.id)}
                          className="delete-bank-btn"
                          disabled={bankItem.isDefault}
                          title={bankItem.isDefault ? 'Cannot delete default bank account' : 'Delete bank account'}
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <div className="bank-actions">
                        <span className="view-only-text">View Only</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BankManagement;