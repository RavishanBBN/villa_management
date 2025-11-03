import React, { useState, useEffect } from 'react';
import { useGuests } from '../../hooks/useGuests';
import './GuestManagement.css';

const GuestManagement = () => {
  const {
    guests,
    selectedGuest,
    guestReservations,
    guestStatistics,
    loading,
    error,
    filters,
    pagination,
    loadGuests,
    loadGuestById,
    loadGuestReservations,
    createGuest,
    updateGuest,
    deleteGuest,
    // searchGuests, // Unused - kept for future use
    updateFilters,
    clearFilters,
    setSelectedGuest,
    calculateOverallStatistics,
    getRecentGuests,
    getTopGuests
  } = useGuests();

  // UI State
  const [activeSection, setActiveSection] = useState('list'); // list, create, edit, view
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // delete
  const [notification, setNotification] = useState(null);

  // Form state
  const [guestForm, setGuestForm] = useState({
    bookerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    passportNumber: '',
    dateOfBirth: '',
    nationality: '',
    notes: ''
  });

  // Statistics
  const overallStats = calculateOverallStatistics();
  const recentGuests = getRecentGuests();
  const topGuests = getTopGuests(5);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Reset form
  const resetForm = () => {
    setGuestForm({
      bookerName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      passportNumber: '',
      dateOfBirth: '',
      nationality: '',
      notes: ''
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value, page: 1 });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    clearFilters();
    loadGuests();
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    updateFilters({ page: newPage });
    loadGuests({ page: newPage });
  };

  // Handle view guest
  const handleViewGuest = async (guest) => {
    await loadGuestById(guest.id, true);
    await loadGuestReservations(guest.id);
    setActiveSection('view');
  };

  // Handle edit guest
  const handleEditGuest = async (guest) => {
    await loadGuestById(guest.id, false);
    setGuestForm({
      bookerName: guest.bookerName || '',
      email: guest.email || '',
      phone: guest.phone || '',
      address: guest.address || '',
      city: guest.city || '',
      country: guest.country || '',
      passportNumber: guest.passportNumber || '',
      dateOfBirth: guest.dateOfBirth || '',
      nationality: guest.nationality || '',
      notes: guest.notes || ''
    });
    setActiveSection('edit');
  };

  // Handle create guest
  const handleCreateGuest = async (e) => {
    e.preventDefault();

    const result = await createGuest(guestForm);

    if (result.success) {
      showNotification('Guest created successfully!');
      setActiveSection('list');
      resetForm();
    } else {
      showNotification(result.error || 'Failed to create guest', 'error');
    }
  };

  // Handle update guest
  const handleUpdateGuest = async (e) => {
    e.preventDefault();

    const result = await updateGuest(selectedGuest.id, guestForm);

    if (result.success) {
      showNotification('Guest updated successfully!');
      setActiveSection('list');
      resetForm();
      setSelectedGuest(null);
    } else {
      showNotification(result.error || 'Failed to update guest', 'error');
    }
  };

  // Handle delete guest
  const handleDeleteGuest = async () => {
    const result = await deleteGuest(selectedGuest.id);

    if (result.success) {
      showNotification('Guest deleted successfully!');
      setShowModal(false);
      setSelectedGuest(null);
      if (activeSection === 'view') {
        setActiveSection('list');
      }
    } else {
      showNotification(result.error || 'Failed to delete guest', 'error');
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'LKR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Get reservation status badge class
  const getReservationStatusClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-badge status-confirmed';
      case 'checked_in': return 'status-badge status-checked-in';
      case 'checked_out': return 'status-badge status-checked-out';
      case 'cancelled': return 'status-badge status-cancelled';
      default: return 'status-badge';
    }
  };

  // Apply filters when they change
  useEffect(() => {
    loadGuests(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search, filters.email, filters.country, filters.sortBy, filters.order]);

  return (
    <div className="guest-management-container">
      {/* Notification */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="guest-header">
        <h1>Guest Management</h1>
        <div className="header-actions">
          <button
            className={`tab-button ${activeSection === 'list' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('list');
              setSelectedGuest(null);
              resetForm();
            }}
          >
            Guest List
          </button>
          <button
            className={`tab-button ${activeSection === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveSection('create');
              setSelectedGuest(null);
              resetForm();
            }}
          >
            Add Guest
          </button>
        </div>
      </div>

      {/* Statistics Section */}
      {activeSection === 'list' && (
        <div className="guest-statistics">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.totalGuests}</div>
              <div className="stat-label">Total Guests</div>
            </div>
          </div>
          <div className="stat-card stat-info">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.totalReservations}</div>
              <div className="stat-label">Total Reservations</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{overallStats.averageReservationsPerGuest}</div>
              <div className="stat-label">Avg. Reservations/Guest</div>
            </div>
          </div>
          <div className="stat-card stat-warning">
            <div className="stat-icon">🆕</div>
            <div className="stat-content">
              <div className="stat-value">{recentGuests.length}</div>
              <div className="stat-label">New Guests (30 days)</div>
            </div>
          </div>
        </div>
      )}

      {/* Guest List Section */}
      {activeSection === 'list' && (
        <>
          {/* Filters */}
          <div className="guest-filters">
            <input
              type="text"
              placeholder="Search by name, email, phone, or country..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
            <input
              type="text"
              placeholder="Filter by email..."
              value={filters.email}
              onChange={(e) => handleFilterChange('email', e.target.value)}
              className="filter-input"
            />
            <input
              type="text"
              placeholder="Filter by country..."
              value={filters.country}
              onChange={(e) => handleFilterChange('country', e.target.value)}
              className="filter-input"
            />
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Sort by: Created Date</option>
              <option value="bookerName">Sort by: Name</option>
              <option value="country">Sort by: Country</option>
            </select>
            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="filter-select"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
            <button onClick={handleClearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>

          {/* Guest Table */}
          {loading ? (
            <div className="loading">Loading guests...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : guests.length === 0 ? (
            <div className="empty-state">
              <p>No guests found. Add your first guest!</p>
            </div>
          ) : (
            <>
              <div className="guest-table-container">
                <table className="guest-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Country</th>
                      <th>Reservations</th>
                      <th>Joined Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map(guest => (
                      <tr key={guest.id}>
                        <td className="guest-name">{guest.bookerName}</td>
                        <td>{guest.email || 'N/A'}</td>
                        <td>{guest.phone || 'N/A'}</td>
                        <td>
                          <span className="country-badge">{guest.country || 'N/A'}</span>
                        </td>
                        <td className="reservations-count">
                          {guest.reservations ? guest.reservations.length : 0}
                        </td>
                        <td>{formatDate(guest.createdAt)}</td>
                        <td className="actions-cell">
                          <button
                            className="action-btn view-btn"
                            onClick={() => handleViewGuest(guest)}
                            title="View Details"
                          >
                            👁️
                          </button>
                          <button
                            className="action-btn edit-btn"
                            onClick={() => handleEditGuest(guest)}
                            title="Edit Guest"
                          >
                            ✏️
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => {
                              setSelectedGuest(guest);
                              setModalType('delete');
                              setShowModal(true);
                            }}
                            title="Delete Guest"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="pagination">
                  <button
                    disabled={pagination.page === 1}
                    onClick={() => handlePageChange(pagination.page - 1)}
                    className="pagination-btn"
                  >
                    Previous
                  </button>
                  <span className="pagination-info">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <button
                    disabled={pagination.page === pagination.pages}
                    onClick={() => handlePageChange(pagination.page + 1)}
                    className="pagination-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* Top Guests Section */}
          {topGuests.length > 0 && (
            <div className="top-guests-section">
              <h2>Top Guests</h2>
              <div className="top-guests-grid">
                {topGuests.map((guest, index) => (
                  <div key={guest.id} className="top-guest-card">
                    <div className="rank-badge">#{index + 1}</div>
                    <h3>{guest.bookerName}</h3>
                    <p className="guest-country">{guest.country || 'N/A'}</p>
                    <div className="guest-stats">
                      <span>{guest.reservations.length} reservations</span>
                    </div>
                    <button
                      onClick={() => handleViewGuest(guest)}
                      className="view-guest-btn"
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create/Edit Guest Form Section */}
      {(activeSection === 'create' || activeSection === 'edit') && (
        <div className="guest-form-section">
          <h2>{activeSection === 'create' ? 'Add New Guest' : 'Edit Guest'}</h2>
          <form
            onSubmit={activeSection === 'create' ? handleCreateGuest : handleUpdateGuest}
            className="guest-form"
          >
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={guestForm.bookerName}
                  onChange={(e) => setGuestForm({ ...guestForm, bookerName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={guestForm.email}
                  onChange={(e) => setGuestForm({ ...guestForm, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  value={guestForm.country}
                  onChange={(e) => setGuestForm({ ...guestForm, country: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={guestForm.city}
                  onChange={(e) => setGuestForm({ ...guestForm, city: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Passport Number</label>
                <input
                  type="text"
                  value={guestForm.passportNumber}
                  onChange={(e) => setGuestForm({ ...guestForm, passportNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={guestForm.dateOfBirth}
                  onChange={(e) => setGuestForm({ ...guestForm, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nationality</label>
                <input
                  type="text"
                  value={guestForm.nationality}
                  onChange={(e) => setGuestForm({ ...guestForm, nationality: e.target.value })}
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={guestForm.address}
                  onChange={(e) => setGuestForm({ ...guestForm, address: e.target.value })}
                  rows="2"
                />
              </div>

              <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                  value={guestForm.notes}
                  onChange={(e) => setGuestForm({ ...guestForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about the guest..."
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="button"
                onClick={() => {
                  setActiveSection('list');
                  resetForm();
                  setSelectedGuest(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : activeSection === 'create' ? 'Create Guest' : 'Update Guest'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Guest Section */}
      {activeSection === 'view' && selectedGuest && (
        <div className="guest-view-section">
          <div className="view-header">
            <button
              onClick={() => {
                setActiveSection('list');
                setSelectedGuest(null);
              }}
              className="back-btn"
            >
              ← Back to List
            </button>
            <h2>Guest Profile</h2>
            <div className="view-actions">
              <button
                onClick={() => handleEditGuest(selectedGuest)}
                className="btn-action"
              >
                Edit Guest
              </button>
              <button
                onClick={() => {
                  setModalType('delete');
                  setShowModal(true);
                }}
                className="btn-danger"
              >
                Delete Guest
              </button>
            </div>
          </div>

          <div className="guest-detail-card">
            {/* Guest Information */}
            <div className="guest-info-section">
              <div className="guest-avatar">
                <div className="avatar-icon">
                  {selectedGuest.bookerName ? selectedGuest.bookerName.charAt(0).toUpperCase() : 'G'}
                </div>
              </div>
              <div className="guest-info-details">
                <h1>{selectedGuest.bookerName}</h1>
                <div className="guest-contact">
                  {selectedGuest.email && <p>📧 {selectedGuest.email}</p>}
                  {selectedGuest.phone && <p>📱 {selectedGuest.phone}</p>}
                  {selectedGuest.country && <p>🌍 {selectedGuest.country}</p>}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="guest-additional-info">
              <h3>Additional Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">City:</span>
                  <span className="info-value">{selectedGuest.city || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{selectedGuest.address || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Passport:</span>
                  <span className="info-value">{selectedGuest.passportNumber || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Nationality:</span>
                  <span className="info-value">{selectedGuest.nationality || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Date of Birth:</span>
                  <span className="info-value">{formatDate(selectedGuest.dateOfBirth)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Member Since:</span>
                  <span className="info-value">{formatDate(selectedGuest.createdAt)}</span>
                </div>
              </div>
              {selectedGuest.notes && (
                <div className="guest-notes">
                  <h4>Notes:</h4>
                  <p>{selectedGuest.notes}</p>
                </div>
              )}
            </div>

            {/* Reservation Statistics */}
            {guestStatistics && (
              <div className="guest-statistics-section">
                <h3>Reservation Statistics</h3>
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-number">{guestStatistics.totalReservations}</div>
                    <div className="stat-text">Total Reservations</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{guestStatistics.upcomingReservations}</div>
                    <div className="stat-text">Upcoming</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{guestStatistics.completedReservations}</div>
                    <div className="stat-text">Completed</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{guestStatistics.cancelledReservations}</div>
                    <div className="stat-text">Cancelled</div>
                  </div>
                  {guestStatistics.totalSpentLKR > 0 && (
                    <div className="stat-item">
                      <div className="stat-number">{formatCurrency(guestStatistics.totalSpentLKR, 'LKR')}</div>
                      <div className="stat-text">Total Spent (LKR)</div>
                    </div>
                  )}
                  {guestStatistics.totalSpentUSD > 0 && (
                    <div className="stat-item">
                      <div className="stat-number">{formatCurrency(guestStatistics.totalSpentUSD, 'USD')}</div>
                      <div className="stat-text">Total Spent (USD)</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reservation History */}
            {guestReservations && guestReservations.length > 0 && (
              <div className="reservation-history-section">
                <h3>Reservation History</h3>
                <div className="reservation-list">
                  {guestReservations.map(reservation => (
                    <div key={reservation.id} className="reservation-card">
                      <div className="reservation-header">
                        <h4>{reservation.property?.name || 'Unknown Property'}</h4>
                        <span className={getReservationStatusClass(reservation.status)}>
                          {reservation.status}
                        </span>
                      </div>
                      <div className="reservation-details">
                        <p><strong>Confirmation:</strong> {reservation.confirmationNumber}</p>
                        <p><strong>Check-in:</strong> {formatDate(reservation.checkIn)}</p>
                        <p><strong>Check-out:</strong> {formatDate(reservation.checkOut)}</p>
                        <p><strong>Guests:</strong> {reservation.adults} adults, {reservation.children} children</p>
                        <p><strong>Total:</strong> {formatCurrency(reservation.totalAmount, reservation.currency)}</p>
                        {reservation.payments && reservation.payments.length > 0 && (
                          <p><strong>Paid:</strong> {formatCurrency(reservation.totalPaid, reservation.paymentCurrency)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showModal && modalType === 'delete' && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Delete Guest</h2>
            <p>
              Are you sure you want to delete <strong>{selectedGuest?.bookerName}</strong>?
              {selectedGuest?.reservations?.length > 0 && (
                <span className="warning-text">
                  <br /><br />
                  Note: This guest has {selectedGuest.reservations.length} reservation(s).
                  You can only delete guests without active reservations.
                </span>
              )}
            </p>
            <div className="modal-actions">
              <button onClick={() => setShowModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleDeleteGuest} className="btn-danger" disabled={loading}>
                {loading ? 'Deleting...' : 'Delete Guest'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestManagement;
