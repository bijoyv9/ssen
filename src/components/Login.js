import React, { useState } from 'react';
import '../styles/login.css';
import logoImg from '../assets/logo.png';
import companyNameImg from '../assets/cname.png';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Default admin credentials
    if (username === 'admin' && password === 'admin123') {
      onLogin({ 
        username: 'admin', 
        role: 'admin', 
        fullName: 'Administrator',
        id: 'admin_001'
      });
      return;
    }
    
    // Check stored users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Stored users:', users); // Debug log
    console.log('Attempting login with:', { username, password }); // Debug log
    
    const user = users.find(u => u.username === username && u.password === password);
    console.log('Found user:', user); // Debug log
    
    if (user) {
      onLogin({
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        id: user.id
      });
    } else {
      setError("Incorrect username or password.");
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container login-split-layout">
        {/* Branding Section */}
        <div className="login-branding">
          <div className="login-branding-header">
            <img src={logoImg} alt="Logo" className="login-logo" />
            <img src={companyNameImg} alt="S. Sen & Associates" className="company-name-image" />
          </div>
        </div>
        
        {/* Form Section */}
        <div className="login-form-container">
          <div className="login-form-box">
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder="Username"
                />
              </div>
              
              <div className="form-group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Password"
                />
              </div>
              
              {error && <div className="error-message">{error}</div>}
              
              <button type="submit" className="login-btn">
                Login
              </button>
              
              <div className="forgot-password-section">
                <button 
                  type="button" 
                  className="forgot-password-btn"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot Password?
                </button>
              </div>
            </form>
            
          </div>
        </div>
      </div>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="forgot-password-modal-overlay">
          <div className="forgot-password-modal">
            <button 
              className="modal-close-btn"
              onClick={() => setShowForgotPassword(false)}
            >
              ×
            </button>
            <div className="forgot-password-modal-content">
              <p>Please contact the system administrator to reset the password.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;