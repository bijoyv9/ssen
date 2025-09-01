import React, { useState, useCallback } from 'react';

const UserProfile = ({ currentUser, onBack, isEditable = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(currentUser || {});

  const handleSave = useCallback(() => {
    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const updatedUsers = users.map(user => 
      user.id === editedUser.id ? editedUser : user
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setIsEditing(false);
    alert('User profile updated successfully!');
  }, [editedUser]);

  const handleCancel = useCallback(() => {
    setEditedUser(currentUser);
    setIsEditing(false);
  }, [currentUser]);
  if (!currentUser) {
    return (
      <div className="user-profile">
        <div className="profile-header">
          <button onClick={onBack} className="back-btn">← Back</button>
          <h2>User Profile</h2>
        </div>
        <div className="profile-content">
          <p>No user information available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>👤 User Profile</h2>
        {isEditable && !isEditing && (
          <button 
            className="edit-mode-indicator"
            onClick={() => setIsEditing(true)}
          >
            ✏️ Edit Profile
          </button>
        )}
        {isEditing && (
          <div className="edit-actions">
            <button 
              className="save-btn"
              onClick={handleSave}
            >
              💾 Save Changes
            </button>
            <button 
              className="cancel-btn"
              onClick={handleCancel}
            >
              ❌ Cancel
            </button>
          </div>
        )}
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            {currentUser.fullName?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          
          <div className="profile-info">
            <div className="name-and-role">
              <h3>{currentUser.fullName || 'Unknown User'}</h3>
              <span className={`role-badge ${currentUser.role || 'user'}`}>
                {(currentUser.role || 'user').toUpperCase()}
              </span>
            </div>
            <div className="account-created">
              <small>Member since: {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}</small>
            </div>
          </div>
        </div>

        <div className="profile-details">
          <div className="details-grid">
            <div className="detail-item">
              <div className="detail-label">Username</div>
              {isEditing ? (
                <input
                  type="text"
                  className="detail-input"
                  value={editedUser.username || ''}
                  onChange={(e) => setEditedUser({...editedUser, username: e.target.value})}
                />
              ) : (
                <div className="detail-value">{currentUser.username || 'N/A'}</div>
              )}
            </div>
            
            <div className="detail-item">
              <div className="detail-label">User ID</div>
              <div className="detail-value">#{currentUser.id || 'N/A'}</div>
            </div>
            
            <div className="detail-item full-width">
              <div className="detail-label">Full Name</div>
              {isEditing ? (
                <input
                  type="text"
                  className="detail-input"
                  value={editedUser.fullName || ''}
                  onChange={(e) => setEditedUser({...editedUser, fullName: e.target.value})}
                />
              ) : (
                <div className="detail-value">{currentUser.fullName || 'N/A'}</div>
              )}
            </div>
            
            <div className="detail-item full-width">
              <div className="detail-label">Address</div>
              {isEditing ? (
                <textarea
                  className="detail-textarea"
                  value={editedUser.address || ''}
                  onChange={(e) => setEditedUser({...editedUser, address: e.target.value})}
                  rows="3"
                />
              ) : (
                <div className="detail-value">{currentUser.address || 'Not registered'}</div>
              )}
            </div>
            
            <div className="detail-item">
              <div className="detail-label">Phone Number</div>
              {isEditing ? (
                <input
                  type="tel"
                  className="detail-input"
                  value={editedUser.phone || ''}
                  onChange={(e) => setEditedUser({...editedUser, phone: e.target.value})}
                />
              ) : (
                <div className="detail-value">{currentUser.phone || 'Not registered'}</div>
              )}
            </div>
            
            <div className="detail-item">
              <div className="detail-label">Email Address</div>
              {isEditing ? (
                <input
                  type="email"
                  className="detail-input"
                  value={editedUser.email || ''}
                  onChange={(e) => setEditedUser({...editedUser, email: e.target.value})}
                />
              ) : (
                <div className="detail-value">{currentUser.email || 'Not registered'}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;