import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // warning, danger, info
}) => {
  if (!isOpen) return null;

  const icons = {
    warning: '⚠️',
    danger: '🚨',
    info: 'ℹ️',
    success: '✅'
  };

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon confirm-${type}`}>
          {icons[type]}
        </div>
        
        <h2 className="confirm-title">{title}</h2>
        <p className="confirm-message">{message}</p>
        
        <div className="confirm-actions">
          <button 
            onClick={onClose} 
            className="btn-cancel"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className={`btn-confirm btn-confirm-${type}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
