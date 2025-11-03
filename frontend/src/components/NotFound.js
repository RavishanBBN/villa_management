import React from 'react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        
        <div className="action-buttons">
          <button onClick={() => window.location.href = '/'} className="btn-primary">
            🏠 Go Home
          </button>
          <button onClick={() => window.history.back()} className="btn-secondary">
            ← Go Back
          </button>
        </div>

        <div className="helpful-links">
          <h3>Try these instead:</h3>
          <ul>
            <li><a href="/">Dashboard</a></li>
            <li><a href="/#reservations">Reservations</a></li>
            <li><a href="/#inventory">Inventory</a></li>
            <li><a href="/#financial">Financial</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
