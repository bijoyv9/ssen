import React, { useState, useEffect, useCallback } from 'react';

const AdminPanel = ({ onViewUserProfile }) => {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    role: 'computer-operator'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setUsers(storedUsers);
  }, []);

  const saveUsers = useCallback((updatedUsers) => {
    console.log('Saving users to localStorage:', updatedUsers); // Debug log
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    
    // Verify save
    const saved = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Verified saved users:', saved); // Debug log
  }, []);

  const validateUser = (user) => {
    const newErrors = {};
    
    if (!user.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (users.some(u => u.username === user.username && u.id !== user.id)) {
      newErrors.username = 'Username already exists';
    }
    
    if (!user.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (user.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!user.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    
    return newErrors;
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    
    const validationErrors = validateUser(newUser);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    const user = {
      ...newUser,
      id: 'user_' + Date.now(),
      createdAt: new Date().toISOString()
    };
    
    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    
    setNewUser({ username: '', password: '', fullName: '', role: 'user' });
    setShowAddUser(false);
    setErrors({});
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
    }
  };

  const handleRoleChange = (userId, newRole) => {
    const updatedUsers = users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    );
    saveUsers(updatedUsers);
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>👨‍💼 Admin Panel</h2>
        <button 
          className="add-user-btn"
          onClick={() => setShowAddUser(true)}
        >
          ➕ Add New User
        </button>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Add New User</h3>
              <button 
                className="close-modal-btn"
                onClick={() => {
                  setShowAddUser(false);
                  setErrors({});
                  setNewUser({ username: '', password: '', fullName: '', role: 'user' });
                }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="user-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                  className={errors.fullName ? 'error' : ''}
                />
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="username">Username *</label>
                <input
                  id="username"
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  rows="3"
                  placeholder="Enter full address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="computer-operator">Computer Operator</option>
                  <option value="inspector">Inspector</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-user-btn">
                  Add User
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => {
                    setShowAddUser(false);
                    setErrors({});
                    setNewUser({ username: '', password: '', fullName: '', email: '', phone: '', address: '', role: 'user' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="users-section">
        <h3>System Users</h3>
        
        {users.length === 0 ? (
          <div className="no-users">
            <p>No users created yet. Add your first user above!</p>
          </div>
        ) : (
          <div className="users-table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="admin-user-row">
                  <td><strong>Administrator</strong></td>
                  <td><strong>admin</strong></td>
                  <td>
                    <span className="role-badge admin">Admin</span>
                  </td>
                  <td>System Default</td>
                  <td>
                    <span className="system-user">System User</span>
                  </td>
                </tr>
                {users.map(user => (
                  <tr key={user.id} className="user-row">
                    <td>
                      <button 
                        className="user-name-link"
                        onClick={() => onViewUserProfile(user)}
                        title="View/Edit User Profile"
                      >
                        {user.fullName}
                      </button>
                    </td>
                    <td>{user.username}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="computer-operator">Computer Operator</option>
                        <option value="inspector">Inspector</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="delete-user-btn"
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Data for Testing */}
      <div className="testing-section" style={{marginTop: '2rem', padding: '1rem', border: '2px solid #dc3545', borderRadius: '8px', backgroundColor: '#fff5f5'}}>
        <h3 style={{color: '#dc3545', margin: '0 0 1rem 0'}}>🧪 Testing Tools</h3>
        <p style={{margin: '0 0 1rem 0', color: '#666'}}>Clear all data to test user permission filtering</p>
        <button 
          onClick={() => {
            if (window.confirm('Clear all data for testing? This will delete invoices, users, and banks.')) {
              localStorage.clear();
              alert('✅ Data cleared! Page will reload.');
              window.location.reload();
            }
          }}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🗑️ Clear All Data
        </button>
      </div>

      <div className="admin-info">
        <h4>👥 User Permissions:</h4>
        <ul>
          <li><strong>Admin:</strong> Full access to all features including user management</li>
          <li><strong>User:</strong> Dashboard access, view banks (no edit), manage only own invoices</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminPanel;