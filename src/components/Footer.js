import React from 'react';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section company-info">
          <h4>S. Sen & Associates</h4>
          <p className="company-description">Professional consulting services with three decades of excellence in financial advisory and business solutions.</p>
          <p className="company-established">Established 1990</p>
        </div>
        
        <div className="footer-section contact-info">
          <h5>Contact</h5>
          <div className="contact-item">
            <span className="contact-label">Email</span>
            <span className="contact-value">info@ssenassociates.com</span>
          </div>
          <div className="contact-item">
            <span className="contact-label">Phone</span>
            <span className="contact-value">+91 (011) 2345-6789</span>
          </div>
          <div className="contact-item">
            <span className="contact-label">Location</span>
            <span className="contact-value">New Delhi, India</span>
          </div>
        </div>
        
        <div className="footer-section services">
          <h5>Services</h5>
          <ul>
            <li>Financial Consulting</li>
            <li>Business Advisory</li>
            <li>Tax Planning & Compliance</li>
            <li>Audit & Assurance</li>
            <li>Corporate Restructuring</li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} S. Sen & Associates. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;