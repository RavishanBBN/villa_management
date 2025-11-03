import React, { useState, useCallback, useRef } from 'react';
import { useUpload } from '../../hooks/useUpload';
import { useExport } from '../../hooks/useExport';
import './UploadManagement.css';

const UploadManagement = () => {
  const upload = useUpload();
  const exportHook = useExport();

  // UI State
  const [activeSection, setActiveSection] = useState('upload'); // upload, export
  const [uploadType, setUploadType] = useState('image'); // image, invoice, receipt, multiple
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState(null);
  const [exportDates, setExportDates] = useState({
    startDate: '',
    endDate: ''
  });

  const fileInputRef = useRef(null);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      showNotification('Please select file(s) to upload', 'error');
      return;
    }

    let result;

    switch (uploadType) {
      case 'image':
        if (selectedFiles.length > 1) {
          showNotification('Please select only one image file', 'error');
          return;
        }
        result = await upload.uploadImage(selectedFiles[0]);
        break;

      case 'invoice':
        if (selectedFiles.length > 1) {
          showNotification('Please select only one invoice file', 'error');
          return;
        }
        result = await upload.uploadInvoice(selectedFiles[0]);
        break;

      case 'receipt':
        if (selectedFiles.length > 1) {
          showNotification('Please select only one receipt file', 'error');
          return;
        }
        result = await upload.uploadReceipt(selectedFiles[0]);
        break;

      case 'multiple':
        result = await upload.uploadMultiple(selectedFiles);
        break;

      default:
        showNotification('Invalid upload type', 'error');
        return;
    }

    if (result.success) {
      showNotification(
        uploadType === 'multiple'
          ? `${selectedFiles.length} file(s) uploaded successfully!`
          : 'File uploaded successfully!',
        'success'
      );
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      showNotification(result.error, 'error');
    }
  }, [selectedFiles, uploadType, upload]);

  // Handle delete file
  const handleDeleteFile = useCallback(async (type, filename) => {
    const result = await upload.deleteFile(type, filename);
    if (result.success) {
      showNotification('File deleted successfully!', 'success');
    } else {
      showNotification(result.error, 'error');
    }
  }, [upload]);

  // Handle export
  const handleExport = useCallback(async (exportType) => {
    const { startDate, endDate } = exportDates;

    let result;

    switch (exportType) {
      case 'reservations':
        result = await exportHook.exportReservations(startDate, endDate);
        break;
      case 'inventory':
        result = await exportHook.exportInventory();
        break;
      case 'financial':
        result = await exportHook.exportFinancial(startDate, endDate);
        break;
      case 'revenue':
        result = await exportHook.exportRevenue(startDate, endDate);
        break;
      case 'expenses':
        result = await exportHook.exportExpenses(startDate, endDate);
        break;
      case 'profitLoss':
        result = await exportHook.exportProfitLoss(startDate, endDate);
        break;
      case 'summary':
        result = await exportHook.exportSummaryJSON(startDate, endDate);
        break;
      default:
        showNotification('Invalid export type', 'error');
        return;
    }

    if (result.success) {
      showNotification(`Exported ${result.filename} successfully!`, 'success');
    } else {
      showNotification(result.error, 'error');
    }
  }, [exportDates, exportHook]);

  // Get accept attribute based on upload type
  const getAcceptAttribute = () => {
    switch (uploadType) {
      case 'image':
        return 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
      case 'invoice':
      case 'receipt':
        return 'application/pdf,image/jpeg,image/jpg,image/png';
      case 'multiple':
        return '*';
      default:
        return '*';
    }
  };

  // Get file type icon
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return '🖼️';
    if (mimetype === 'application/pdf') return '📄';
    return '📎';
  };

  return (
    <div className="upload-management-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification toast-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="um-header">
        <h1>File Management & Export</h1>
        <div className="header-tabs">
          <button
            className={`header-tab ${activeSection === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveSection('upload')}
          >
            📤 Upload Files
          </button>
          <button
            className={`header-tab ${activeSection === 'export' ? 'active' : ''}`}
            onClick={() => setActiveSection('export')}
          >
            📥 Export Data
          </button>
        </div>
      </div>

      {/* Upload Section */}
      {activeSection === 'upload' && (
        <div className="upload-section">
          {/* Upload Form */}
          <div className="upload-form-card">
            <h2>Upload Files</h2>

            <div className="form-group">
              <label>Upload Type</label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
              >
                <option value="image">Property/Guest Images</option>
                <option value="invoice">Invoice Documents</option>
                <option value="receipt">Receipt Documents</option>
                <option value="multiple">Multiple Files (up to 10)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Select File(s)</label>
              <div className="file-input-wrapper">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={getAcceptAttribute()}
                  multiple={uploadType === 'multiple'}
                  onChange={handleFileSelect}
                  className="file-input"
                />
                <div className="file-input-display">
                  {selectedFiles.length === 0 ? (
                    <span className="placeholder">No file selected</span>
                  ) : (
                    <div className="selected-files">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="selected-file">
                          <span className="file-icon">{getFileIcon(file.type)}</span>
                          <span className="file-name">{file.name}</span>
                          <span className="file-size">({upload.formatFileSize(file.size)})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {upload.error && (
              <div className="error-message">{upload.error}</div>
            )}

            {upload.progress > 0 && upload.progress < 100 && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${upload.progress}%` }} />
              </div>
            )}

            <div className="form-actions">
              <button
                onClick={() => {
                  setSelectedFiles([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-secondary"
                disabled={upload.loading || selectedFiles.length === 0}
              >
                Clear
              </button>
              <button
                onClick={handleUpload}
                className="btn-primary"
                disabled={upload.loading || selectedFiles.length === 0}
              >
                {upload.loading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>

          {/* Upload Info */}
          <div className="upload-info-card">
            <h3>Upload Guidelines</h3>
            <div className="info-content">
              <div className="info-item">
                <span className="info-icon">📏</span>
                <div>
                  <strong>File Size Limit:</strong>
                  <p>Maximum 10MB per file</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">📁</span>
                <div>
                  <strong>Supported Formats:</strong>
                  <p>Images: JPEG, PNG, GIF, WebP</p>
                  <p>Documents: PDF, JPEG, PNG</p>
                </div>
              </div>
              <div className="info-item">
                <span className="info-icon">🔢</span>
                <div>
                  <strong>Multiple Upload:</strong>
                  <p>Up to 10 files at once</p>
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Files List */}
          {upload.uploadedFiles.length > 0 && (
            <div className="uploaded-files-card">
              <h3>Recently Uploaded Files ({upload.uploadedFiles.length})</h3>
              <div className="uploaded-files-list">
                {upload.uploadedFiles.map((file, index) => (
                  <div key={index} className="uploaded-file-item">
                    <span className="file-icon">{getFileIcon(file.mimetype)}</span>
                    <div className="file-details">
                      <div className="file-name">{file.filename}</div>
                      <div className="file-meta">
                        {upload.formatFileSize(file.size)} • {file.mimetype}
                      </div>
                    </div>
                    <div className="file-actions">
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="btn-view"
                        title="View file"
                      >
                        👁️ View
                      </button>
                      <button
                        onClick={() => {
                          const type = file.url.split('/')[2]; // Extract type from URL
                          handleDeleteFile(type, file.filename);
                        }}
                        className="btn-delete"
                        title="Delete file"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={upload.clearFiles} className="btn-clear-all">
                Clear List
              </button>
            </div>
          )}
        </div>
      )}

      {/* Export Section */}
      {activeSection === 'export' && (
        <div className="export-section">
          {/* Date Range Filter */}
          <div className="export-filter-card">
            <h3>Date Range (Optional)</h3>
            <div className="date-range-inputs">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={exportDates.startDate}
                  onChange={(e) => setExportDates({ ...exportDates, startDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={exportDates.endDate}
                  onChange={(e) => setExportDates({ ...exportDates, endDate: e.target.value })}
                />
              </div>
              <button
                onClick={() => setExportDates({ startDate: '', endDate: '' })}
                className="btn-clear"
              >
                Clear Dates
              </button>
            </div>
          </div>

          {/* Export Options */}
          <div className="export-options">
            <h2>Available Exports</h2>

            <div className="export-grid">
              {/* Reservations */}
              <div className="export-card">
                <div className="export-icon">📅</div>
                <h3>Reservations</h3>
                <p>Export all reservations with guest details, dates, and payment status</p>
                <button
                  onClick={() => handleExport('reservations')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Inventory */}
              <div className="export-card">
                <div className="export-icon">📦</div>
                <h3>Inventory</h3>
                <p>Export complete inventory list with stock levels and suppliers</p>
                <button
                  onClick={() => handleExport('inventory')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Financial */}
              <div className="export-card">
                <div className="export-icon">💰</div>
                <h3>Financial Report</h3>
                <p>Export comprehensive financial report with revenue and expenses</p>
                <button
                  onClick={() => handleExport('financial')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Revenue */}
              <div className="export-card">
                <div className="export-icon">📈</div>
                <h3>Revenue</h3>
                <p>Export revenue entries with payment methods and status</p>
                <button
                  onClick={() => handleExport('revenue')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Expenses */}
              <div className="export-card">
                <div className="export-icon">💸</div>
                <h3>Expenses</h3>
                <p>Export all expenses with categories, vendors, and approval status</p>
                <button
                  onClick={() => handleExport('expenses')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Profit & Loss */}
              <div className="export-card">
                <div className="export-icon">📊</div>
                <h3>Profit & Loss</h3>
                <p>Export P&L statement with revenue, expenses, and profit margin</p>
                <button
                  onClick={() => handleExport('profitLoss')}
                  className="btn-export"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export CSV'}
                </button>
              </div>

              {/* Summary JSON */}
              <div className="export-card">
                <div className="export-icon">📋</div>
                <h3>Financial Summary</h3>
                <p>Export complete financial summary as JSON for integrations</p>
                <button
                  onClick={() => handleExport('summary')}
                  className="btn-export btn-export-json"
                  disabled={exportHook.loading}
                >
                  {exportHook.loading ? 'Exporting...' : 'Export JSON'}
                </button>
              </div>
            </div>
          </div>

          {exportHook.error && (
            <div className="error-message">{exportHook.error}</div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadManagement;
