import React from 'react';
import './ProfessionalBackground.css';

const ProfessionalBackground = ({ children }) => {
  return (
    <div className="professional-background">
      <div className="background-overlay"></div>
      <div className="background-pattern"></div>
      <div className="content-wrapper">
        {children}
      </div>
    </div>
  );
};

export default ProfessionalBackground;