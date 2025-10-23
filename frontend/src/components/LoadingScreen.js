import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <div className="loading-screen">
      <div className="loading-container">
        <div className="loading-logo">
          <div className="logo-icon">🏖️</div>
          <div className="logo-text">Halcyon Rest</div>
        </div>

        <div className="loading-spinner">
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>

        <div className="loading-text">{message}</div>

        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;