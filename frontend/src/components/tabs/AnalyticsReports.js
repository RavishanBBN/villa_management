import React, { useState, useEffect } from 'react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { useReports } from '../../hooks/useReports';
import './AnalyticsReports.css';

const AnalyticsReports = () => {
  const analytics = useAnalytics();
  const auditLogs = useAuditLogs();
  const reports = useReports();

  // UI State
  const [activeSection, setActiveSection] = useState('analytics'); // analytics, audit, reports
  const [notification, setNotification] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Report form state
  const [reportType, setReportType] = useState('financial');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Format currency
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format percentage
  const formatPercentage = (value) => {
    return `${parseFloat(value || 0).toFixed(2)}%`;
  };

  // Load analytics data on mount
  useEffect(() => {
    if (activeSection === 'analytics') {
      analytics.loadDashboard();
      analytics.loadOccupancy(dateRange.startDate, dateRange.endDate);
      analytics.loadRevenue(dateRange.startDate, dateRange.endDate);
      analytics.loadGuestAnalytics();
    }
  }, [activeSection]);

  // Load audit logs on mount
  useEffect(() => {
    if (activeSection === 'audit') {
      auditLogs.loadLogs();
      auditLogs.loadSummary();
    }
  }, [activeSection]);

  // Handle generate report
  const handleGenerateReport = async () => {
    let result;

    switch (reportType) {
      case 'financial':
        result = await reports.generateFinancialReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'occupancy':
        result = await reports.generateOccupancyReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'revenue':
        result = await reports.generateRevenueReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'guest':
        result = await reports.generateGuestReport(dateRange.startDate, dateRange.endDate);
        break;
      case 'monthly':
        result = await reports.generateMonthlyReport(reportMonth);
        break;
      default:
        showNotification('Invalid report type', 'error');
        return;
    }

    if (result) {
      showNotification('Report generated successfully!');
    } else {
      showNotification(reports.error || 'Failed to generate report', 'error');
    }
  };

  // Get action badge class
  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN': return 'action-badge action-info';
      case 'CREATE_RESERVATION': return 'action-badge action-success';
      case 'UPDATE_PAYMENT': return 'action-badge action-warning';
      case 'DELETE_ITEM': return 'action-badge action-danger';
      default: return 'action-badge';
    }
  };

  return (
    <div className="analytics-reports-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="analytics-header">
        <h1>Analytics & Reports</h1>
        <div className="header-tabs">
          <button
            className={`header-tab ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveSection('analytics')}
          >
            📊 Analytics Dashboard
          </button>
          <button
            className={`header-tab ${activeSection === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveSection('audit')}
          >
            🔍 Audit Logs
          </button>
          <button
            className={`header-tab ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            📄 Report Generator
          </button>
        </div>
      </div>

      {/* Analytics Dashboard Section */}
      {activeSection === 'analytics' && (
        <div className="analytics-section">
          {/* Date Range Filter */}
          <div className="date-range-filter">
            <label>Start Date:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
            <label>End Date:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
            <button
              onClick={() => {
                analytics.loadOccupancy(dateRange.startDate, dateRange.endDate);
                analytics.loadRevenue(dateRange.startDate, dateRange.endDate);
              }}
              className="refresh-btn"
            >
              Refresh Data
            </button>
          </div>

          {/* Dashboard Stats */}
          {analytics.dashboard && (
            <div className="analytics-dashboard">
              <h2>Dashboard Overview</h2>
              <div className="dashboard-grid">
                {/* Reservations */}
                <div className="stat-card stat-primary">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.dashboard.reservations.total}</div>
                    <div className="stat-label">Total Reservations</div>
                    <div className="stat-details">
                      <span>✓ {analytics.dashboard.reservations.confirmed} Confirmed</span>
                      <span>🏠 {analytics.dashboard.reservations.checkedIn} Checked In</span>
                    </div>
                  </div>
                </div>

                {/* Revenue */}
                <div className="stat-card stat-success">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <div className="stat-value">{formatCurrency(analytics.dashboard.revenue.total, analytics.dashboard.revenue.currency)}</div>
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-details">
                      <span>This Month: {formatCurrency(analytics.dashboard.revenue.monthly, analytics.dashboard.revenue.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Guests */}
                <div className="stat-card stat-info">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.dashboard.guests.total}</div>
                    <div className="stat-label">Total Guests</div>
                    <div className="stat-details">
                      <span>⭐ {analytics.dashboard.guests.vip} VIP Guests</span>
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="stat-card stat-warning">
                  <div className="stat-icon">📦</div>
                  <div className="stat-content">
                    <div className="stat-value">{analytics.dashboard.inventory.total}</div>
                    <div className="stat-label">Inventory Items</div>
                    <div className="stat-details">
                      <span>⚠️ {analytics.dashboard.inventory.lowStock} Low Stock</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Occupancy Analytics */}
          {analytics.occupancy && (
            <div className="analytics-occupancy">
              <h2>Occupancy Analytics</h2>
              <div className="occupancy-card">
                <div className="occupancy-rate-circle">
                  <svg viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray={`${2 * Math.PI * 80 * (analytics.occupancy.occupancy.rate / 100)} ${2 * Math.PI * 80}`}
                      transform="rotate(-90 100 100)"
                    />
                    <text x="100" y="100" textAnchor="middle" dy="7" fontSize="32" fontWeight="bold" fill="#1f2937">
                      {formatPercentage(analytics.occupancy.occupancy.rate)}
                    </text>
                  </svg>
                </div>
                <div className="occupancy-details">
                  <div className="occupancy-stat">
                    <span className="occupancy-label">Period:</span>
                    <span className="occupancy-value">{analytics.occupancy.period.days} days</span>
                  </div>
                  <div className="occupancy-stat">
                    <span className="occupancy-label">Total Room-Nights:</span>
                    <span className="occupancy-value">{analytics.occupancy.occupancy.totalRoomNights}</span>
                  </div>
                  <div className="occupancy-stat">
                    <span className="occupancy-label">Occupied Nights:</span>
                    <span className="occupancy-value">{analytics.occupancy.occupancy.occupiedNights}</span>
                  </div>
                  <div className="occupancy-stat">
                    <span className="occupancy-label">Available Nights:</span>
                    <span className="occupancy-value">{analytics.occupancy.occupancy.availableNights}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Analytics */}
          {analytics.revenue && (
            <div className="analytics-revenue">
              <h2>Revenue Analytics</h2>
              <div className="revenue-summary">
                <div className="revenue-stat">
                  <div className="revenue-label">Total Revenue</div>
                  <div className="revenue-value">{formatCurrency(analytics.revenue.summary.totalRevenue, analytics.revenue.summary.currency)}</div>
                </div>
                <div className="revenue-stat">
                  <div className="revenue-label">Total Transactions</div>
                  <div className="revenue-value">{analytics.revenue.summary.totalTransactions}</div>
                </div>
                <div className="revenue-stat">
                  <div className="revenue-label">Average Payment</div>
                  <div className="revenue-value">{formatCurrency(analytics.revenue.summary.averagePayment, analytics.revenue.summary.currency)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Guest Analytics */}
          {analytics.guestAnalytics && (
            <div className="analytics-guests">
              <h2>Guest Analytics</h2>
              <div className="guest-summary">
                <div className="guest-stat-card">
                  <div className="guest-stat-value">{analytics.guestAnalytics.summary.total}</div>
                  <div className="guest-stat-label">Total Guests</div>
                </div>
                <div className="guest-stat-card">
                  <div className="guest-stat-value">{analytics.guestAnalytics.summary.vip}</div>
                  <div className="guest-stat-label">VIP Guests</div>
                </div>
                <div className="guest-stat-card">
                  <div className="guest-stat-value">{analytics.guestAnalytics.summary.blacklisted}</div>
                  <div className="guest-stat-label">Blacklisted</div>
                </div>
              </div>

              {analytics.guestAnalytics.topCountries && analytics.guestAnalytics.topCountries.length > 0 && (
                <div className="top-countries">
                  <h3>Top Countries</h3>
                  <div className="countries-list">
                    {analytics.guestAnalytics.topCountries.map((country, index) => (
                      <div key={index} className="country-item">
                        <span className="country-rank">#{index + 1}</span>
                        <span className="country-name">{country.country}</span>
                        <span className="country-count">{country.count} guests</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {analytics.loading && <div className="loading">Loading analytics...</div>}
          {analytics.error && <div className="error-message">{analytics.error}</div>}
        </div>
      )}

      {/* Audit Logs Section */}
      {activeSection === 'audit' && (
        <div className="audit-section">
          <h2>Audit Logs</h2>

          {/* Audit Summary */}
          {auditLogs.summary && (
            <div className="audit-summary">
              <div className="summary-card">
                <div className="summary-value">{auditLogs.summary.totalLogs}</div>
                <div className="summary-label">Total Logs</div>
              </div>
              <div className="summary-card">
                <div className="summary-value">{auditLogs.summary.todayLogs}</div>
                <div className="summary-label">Today's Logs</div>
              </div>
              <div className="summary-card summary-actions">
                <h4>Actions Breakdown</h4>
                {Object.entries(auditLogs.summary.byAction).map(([action, count]) => (
                  <div key={action} className="action-count">
                    <span>{action}:</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          {auditLogs.logs.length > 0 ? (
            <div className="audit-table-container">
              <table className="audit-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.logs.map(log => (
                    <tr key={log.id}>
                      <td>{formatDate(log.timestamp)}</td>
                      <td>{log.username}</td>
                      <td>
                        <span className={getActionBadgeClass(log.action)}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.resource}</td>
                      <td>{log.details}</td>
                      <td className="ip-address">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">No audit logs found</div>
          )}

          {auditLogs.loading && <div className="loading">Loading audit logs...</div>}
          {auditLogs.error && <div className="error-message">{auditLogs.error}</div>}
        </div>
      )}

      {/* Reports Section */}
      {activeSection === 'reports' && (
        <div className="reports-section">
          <h2>Report Generator</h2>

          {/* Report Form */}
          <div className="report-form">
            <div className="form-group">
              <label>Report Type</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
              >
                <option value="financial">Financial Report</option>
                <option value="occupancy">Occupancy Report</option>
                <option value="revenue">Revenue Report</option>
                <option value="guest">Guest Report</option>
                <option value="monthly">Monthly Comprehensive Report</option>
              </select>
            </div>

            {reportType !== 'monthly' ? (
              <>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Month (YYYY-MM)</label>
                <input
                  type="month"
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                />
              </div>
            )}

            <button
              onClick={handleGenerateReport}
              className="generate-report-btn"
              disabled={reports.loading}
            >
              {reports.loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>

          {/* Financial Report */}
          {reports.financialReport && reportType === 'financial' && (
            <div className="report-result">
              <h3>Financial Report</h3>
              <div className="report-grid">
                <div className="report-section">
                  <h4>Income</h4>
                  <div className="report-row">
                    <span>Payments (LKR):</span>
                    <span>{formatCurrency(reports.financialReport.income.paymentsLKR, 'LKR')}</span>
                  </div>
                  <div className="report-row">
                    <span>Payments (USD):</span>
                    <span>{formatCurrency(reports.financialReport.income.paymentsUSD, 'USD')}</span>
                  </div>
                  <div className="report-row total">
                    <span>Total Income (LKR):</span>
                    <span>{formatCurrency(reports.financialReport.income.totalLKR, 'LKR')}</span>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Expenses</h4>
                  <div className="report-row">
                    <span>Total (LKR):</span>
                    <span>{formatCurrency(reports.financialReport.expenses.totalLKR, 'LKR')}</span>
                  </div>
                  <div className="report-row">
                    <span>Total (USD):</span>
                    <span>{formatCurrency(reports.financialReport.expenses.totalUSD, 'USD')}</span>
                  </div>
                </div>

                <div className="report-section">
                  <h4>Net Profit</h4>
                  <div className="report-row profit">
                    <span>LKR:</span>
                    <span>{formatCurrency(reports.financialReport.netProfitLKR, 'LKR')}</span>
                  </div>
                  <div className="report-row profit">
                    <span>USD:</span>
                    <span>{formatCurrency(reports.financialReport.netProfitUSD, 'USD')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Occupancy Report */}
          {reports.occupancyReport && reportType === 'occupancy' && (
            <div className="report-result">
              <h3>Occupancy Report</h3>
              <div className="report-summary">
                <p><strong>Total Reservations:</strong> {reports.occupancyReport.totalReservations}</p>
                <p><strong>Period:</strong> {reports.occupancyReport.period.startDate} to {reports.occupancyReport.period.endDate}</p>
              </div>
              <div className="property-occupancy">
                {Object.entries(reports.occupancyReport.byProperty).map(([property, stats]) => (
                  <div key={property} className="property-stats">
                    <h4>{property}</h4>
                    <p>Reservations: {stats.reservations}</p>
                    <p>Occupied Nights: {stats.occupiedNights}</p>
                    <p>Occupancy Rate: {formatPercentage(stats.occupancyRate)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest Report */}
          {reports.guestReport && reportType === 'guest' && (
            <div className="report-result">
              <h3>Guest Report</h3>
              <div className="report-summary">
                <p><strong>Total Guests:</strong> {reports.guestReport.totalGuests}</p>
                <p><strong>Repeat Guests:</strong> {reports.guestReport.repeatGuests}</p>
              </div>

              {reports.guestReport.topSpenders && reports.guestReport.topSpenders.length > 0 && (
                <div className="top-spenders">
                  <h4>Top Spenders</h4>
                  <table className="spenders-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Guest</th>
                        <th>Country</th>
                        <th>Reservations</th>
                        <th>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.guestReport.topSpenders.map((guest, index) => (
                        <tr key={guest.id}>
                          <td>#{index + 1}</td>
                          <td>{guest.name}</td>
                          <td>{guest.country || 'N/A'}</td>
                          <td>{guest.reservations}</td>
                          <td>{formatCurrency(guest.totalSpent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reports.loading && <div className="loading">Generating report...</div>}
          {reports.error && <div className="error-message">{reports.error}</div>}
        </div>
      )}
    </div>
  );
};

export default AnalyticsReports;
