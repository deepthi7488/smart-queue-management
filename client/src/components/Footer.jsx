import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <p style={{ fontWeight: 600, color: '#1e293b' }}>
          Smart Queue Management System for Hospital Management
        </p>
        <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#64748b' }}>
          Design Thinking & Engineering (DT&E) Academic Project • 2nd Year Computer Science & Engineering
        </p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: '#94a3b8' }}>
          Dynamic wait-time recalculation engine • Unified online & offline queue architecture
        </p>
      </div>
    </footer>
  );
};

export default Footer;
