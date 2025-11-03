import React, { useState, useEffect, useCallback } from 'react';
import { notificationAPI, emailAPI } from '../../services/api';
import './NotificationsEmail.css';

const NotificationsEmail = () => {
  // Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState(null);

  // Email State
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [emailForm, setEmailForm] = useState({
    type: 'custom',
    reservationId: '',
    to: '',
    subject: '',
    message: ''
  });

  // UI State
  const [activeSection, setActiveSection] = useState('notifications'); // notifications, email
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    setNotifError(null);

    try {
      const response = await notificationAPI.getAll();

      if (response.data.success) {
        setNotifications(response.data.data.notifications);
        setUnreadCount(response.data.data.unreadCount);
      } else {
        setNotifError(response.data.message || 'Failed to load notifications');
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifError(err.response?.data?.message || 'Failed to load notifications');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      const response = await notificationAPI.markAsRead(id);

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await notificationAPI.markAllAsRead();

      if (response.data.success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
        setUnreadCount(0);
        showNotification('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
      showNotification('Failed to mark all as read', 'error');
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const response = await notificationAPI.delete(id);

      if (response.data.success) {
        const deletedNotif = notifications.find(n => n.id === id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        showNotification('Notification deleted');
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      showNotification('Failed to delete notification', 'error');
    }
  }, [notifications]);

  // Send email
  const handleSendEmail = useCallback(async (e) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);

    try {
      let response;

      switch (emailForm.type) {
        case 'confirmation':
          response = await emailAPI.sendConfirmation(emailForm.reservationId);
          break;
        case 'reminder':
          response = await emailAPI.sendReminder(emailForm.reservationId);
          break;
        case 'custom':
          response = await emailAPI.sendCustom({
            to: emailForm.to,
            subject: emailForm.subject,
            message: emailForm.message
          });
          break;
        default:
          throw new Error('Invalid email type');
      }

      if (response.data.success) {
        showNotification('Email sent successfully!');
        setEmailForm({
          type: 'custom',
          reservationId: '',
          to: '',
          subject: '',
          message: ''
        });
      } else {
        setEmailError(response.data.message || 'Failed to send email');
        showNotification(response.data.message || 'Failed to send email', 'error');
      }
    } catch (err) {
      console.error('Error sending email:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send email';
      setEmailError(errorMsg);
      showNotification(errorMsg, 'error');
    } finally {
      setEmailLoading(false);
    }
  }, [emailForm]);

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

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

  // Get priority badge class
  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-badge priority-high';
      case 'medium': return 'priority-badge priority-medium';
      case 'low': return 'priority-badge priority-low';
      default: return 'priority-badge';
    }
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'reservation': return '📅';
      case 'payment': return '💰';
      case 'inventory': return '📦';
      case 'maintenance': return '🔧';
      case 'guest': return '👤';
      default: return '🔔';
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (activeSection === 'notifications') {
      loadNotifications();
    }
  }, [activeSection, loadNotifications]);

  return (
    <div className="notifications-email-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`toast-notification toast-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="ne-header">
        <h1>Notifications & Email</h1>
        <div className="header-tabs">
          <button
            className={`header-tab ${activeSection === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveSection('notifications')}
          >
            🔔 Notifications {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button
            className={`header-tab ${activeSection === 'email' ? 'active' : ''}`}
            onClick={() => setActiveSection('email')}
          >
            📧 Email Management
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="notifications-section">
          {/* Actions Bar */}
          <div className="notifications-actions">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All ({notifications.length})
              </button>
              <button
                className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread ({unreadCount})
              </button>
              <button
                className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                onClick={() => setFilter('read')}
              >
                Read ({notifications.length - unreadCount})
              </button>
            </div>
            <div className="action-buttons">
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="mark-all-btn">
                  Mark All as Read
                </button>
              )}
              <button onClick={loadNotifications} className="refresh-btn">
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {notifLoading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifError ? (
            <div className="error-message">{notifError}</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔔</div>
              <p>No notifications to display</p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-card ${notif.read ? 'read' : 'unread'}`}
                >
                  <div className="notif-icon">{getNotificationIcon(notif.type)}</div>
                  <div className="notif-content">
                    <div className="notif-header">
                      <h3>{notif.title}</h3>
                      <span className={getPriorityClass(notif.priority)}>
                        {notif.priority}
                      </span>
                    </div>
                    <p className="notif-message">{notif.message}</p>
                    <div className="notif-footer">
                      <span className="notif-time">{formatDate(notif.createdAt)}</span>
                      <div className="notif-actions">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="notif-action-btn"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="notif-action-btn delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Management Section */}
      {activeSection === 'email' && (
        <div className="email-section">
          <h2>Send Email</h2>

          <form onSubmit={handleSendEmail} className="email-form">
            <div className="form-group">
              <label>Email Type</label>
              <select
                value={emailForm.type}
                onChange={(e) => setEmailForm({ ...emailForm, type: e.target.value })}
              >
                <option value="custom">Custom Email</option>
                <option value="confirmation">Booking Confirmation</option>
                <option value="reminder">Reminder</option>
              </select>
            </div>

            {(emailForm.type === 'confirmation' || emailForm.type === 'reminder') && (
              <div className="form-group">
                <label>Reservation ID *</label>
                <input
                  type="text"
                  value={emailForm.reservationId}
                  onChange={(e) => setEmailForm({ ...emailForm, reservationId: e.target.value })}
                  placeholder="Enter reservation ID"
                  required
                />
              </div>
            )}

            {emailForm.type === 'custom' && (
              <>
                <div className="form-group">
                  <label>To (Email Address) *</label>
                  <input
                    type="email"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    placeholder="Email subject"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={emailForm.message}
                    onChange={(e) => setEmailForm({ ...emailForm, message: e.target.value })}
                    placeholder="Email message..."
                    rows="8"
                    required
                  />
                </div>
              </>
            )}

            {emailError && <div className="error-message">{emailError}</div>}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setEmailForm({
                  type: 'custom',
                  reservationId: '',
                  to: '',
                  subject: '',
                  message: ''
                })}
                className="btn-secondary"
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={emailLoading}
              >
                {emailLoading ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </form>

          {/* Email Templates Info */}
          <div className="email-templates-info">
            <h3>Available Email Templates</h3>
            <div className="template-cards">
              <div className="template-card">
                <div className="template-icon">📅</div>
                <h4>Booking Confirmation</h4>
                <p>Automatically sends confirmation with reservation details, check-in/out dates, and property information.</p>
              </div>
              <div className="template-card">
                <div className="template-icon">⏰</div>
                <h4>Reminder</h4>
                <p>Sends a reminder email to guests about their upcoming reservation.</p>
              </div>
              <div className="template-card">
                <div className="template-icon">✉️</div>
                <h4>Custom Email</h4>
                <p>Send personalized emails with your own subject and message content.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsEmail;
