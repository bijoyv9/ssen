import React, { useState } from 'react';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
      setError(`Invalid username or password. Found ${users.length} users in system.`);
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-header">
          <h2>S. Sen & Associates</h2>
          <p>Invoice Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        
        <div className="login-info">
          <p><strong>Default Admin:</strong></p>
          <p>Username: admin | Password: admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;