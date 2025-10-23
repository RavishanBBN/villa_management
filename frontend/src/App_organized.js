import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './styles/ProfessionalStyles.css';
import './styles/Animations.css';
import './styles/ResponsiveDesign.css';

// Components
import LoadingScreen from './components/LoadingScreen';
import ProfessionalBackground from './components/ProfessionalBackground';

// Context
import { AppProvider, useAppContext } from './context/AppContext';

// Custom hooks
import { useProperties } from './hooks/useProperties';
import { useReservations } from './hooks/useReservations';
import { useFinancial } from './hooks/useFinancial';
import { useMessages } from './hooks/useMessages';
import { useDashboard } from './hooks/useDashboard';

// Chart.js setup
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  RadialLinearScale
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  RadialLinearScale
);

// Main App Component (wrapped with context)
function AppContent() {
  const {
    activeTab,
    setActiveTab,
    currencyRate,
    error,
    success,
    initialLoading,
    setInitialLoading,
    loadCurrencyRate,
    clearMessages,
  } = useAppContext();

  // Custom hooks for data management
  const { properties, loadProperties } = useProperties();
  const { reservations, loadReservations } = useReservations();
  const { loadRevenue, loadExpenses, loadPendingExpenses } = useFinancial();
  const { loadMessages, loadConversations } = useMessages();
  const { dashboardData, loadDashboardData } = useDashboard();

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  // Initialize app data
  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 Initializing application...');
      
      try {
        await Promise.all([
          loadProperties(),
          loadReservations(),
          loadDashboardData(),
          loadMessages(),
          loadConversations(),
          loadRevenue(),
          loadExpenses(),
          loadPendingExpenses(),
          loadCurrencyRate(),
        ]);

        console.log('✅ Application initialized successfully');
        
        // Hide loading screen after data is loaded
        setTimeout(() => {
          setInitialLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error initializing application:', error);
        setInitialLoading(false);
      }
    };

    initializeApp();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success, clearMessages]);

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    console.log('🔄 Refreshing all data...');
    await Promise.all([
      loadProperties(),
      loadReservations(),
      loadDashboardData(),
      loadMessages(),
      loadConversations(),
      loadCurrencyRate(),
    ]);
  }, [loadProperties, loadReservations, loadDashboardData, loadMessages, loadConversations, loadCurrencyRate]);

  // Calculate statistics
  const stats = {
    totalUnits: properties.length,
    occupiedUnits: reservations.filter(r => r.status === 'checked_in').length,
    totalReservations: reservations.filter(r => r.status !== 'cancelled').length,
    monthlyRevenue: reservations.reduce((sum, r) => {
      const amount = parseFloat(r.pricing?.totalLKR) || 0;
      return sum + amount;
    }, 0)
  };

  // Show loading screen on initial load
  if (initialLoading) {
    return <LoadingScreen message="Initializing Halcyon Rest Management System..." />;
  }

  return (
    <ProfessionalBackground>
      <div className="app app-professional">
        {/* Header */}
        <header className="header header-professional">
          <div className="header-content header-content-professional">
            <div className="logo-professional">
              <div className="logo-icon-professional">🏖️</div>
              <h1 className="logo-text-professional">Halcyon Rest Management</h1>
            </div>
            <div className="header-actions-professional">
              <button
                onClick={handleRefresh}
                className="btn-secondary btn-professional-secondary"
                style={{ marginRight: '1rem' }}
              >
                🔄 Refresh
              </button>
              <div className="currency-rate">
                Rate: 1 USD = {currencyRate.toFixed(2)} LKR
              </div>
              <button
                onClick={() => setShowBookingModal(true)}
                className="btn-primary btn-professional-primary"
              >
                <span>➕</span>
                <span>New Reservation</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="navigation">
          <div className="nav-content">
            <div className="nav-tabs nav-tabs-professional">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'properties', label: 'Properties', icon: '🏠' },
                { id: 'reservations', label: 'Reservations', icon: '📅' },
                { id: 'financial', label: 'Financial', icon: '💰' },
                { id: 'calendar', label: 'Calendar', icon: '🗓️' },
                { id: 'pricing', label: 'Pricing', icon: '💵' },
                { id: 'messages', label: 'Messages', icon: '📨' }
              ].map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`nav-tab ${activeTab === id ? 'active' : ''}`}
                >
                  <span className="tab-icon">{icon}</span>
                  <span className="tab-label">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Alert Messages */}
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            <span>{success}</span>
            <button onClick={clearMessages} className="alert-close">
              <span className="close-icon">✕</span>
            </button>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button onClick={clearMessages} className="alert-close">
              <span className="close-icon">✕</span>
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="main-content main-content-professional">
          {activeTab === 'dashboard' && (
            <div className="dashboard page-transition">
              <div className="stats-grid stats-grid-professional">
                <div className="stat-card">
                  <div className="stat-icon text-blue-500">🏠</div>
                  <div className="stat-info">
                    <div className="stat-label">Total Units</div>
                    <div className="stat-value">{stats.totalUnits}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon text-green-500">👥</div>
                  <div className="stat-info">
                    <div className="stat-label">Occupied</div>
                    <div className="stat-value">{stats.occupiedUnits}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon text-purple-500">📅</div>
                  <div className="stat-info">
                    <div className="stat-label">Reservations</div>
                    <div className="stat-value">{stats.totalReservations}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon text-emerald-500">💰</div>
                  <div className="stat-info">
                    <div className="stat-label">Monthly Revenue</div>
                    <div className="stat-value">
                      LKR {stats.monthlyRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="section-header">
                <h2>Dashboard Overview</h2>
                <p>Your property management system at a glance</p>
              </div>
            </div>
          )}

          {activeTab === 'properties' && (
            <div className="properties page-transition">
              <div className="section-header">
                <h2>Properties Management</h2>
              </div>
              <p>Properties content coming from separate component...</p>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="reservations page-transition">
              <div className="section-header">
                <h2>Reservations Management</h2>
              </div>
              <p>Reservations content coming from separate component...</p>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="financial page-transition">
              <div className="section-header">
                <h2>Financial Management</h2>
                <div className="header-actions">
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="btn-primary btn-professional-primary"
                  >
                    <span>💸</span>
                    <span>Add Expense</span>
                  </button>
                  <button
                    onClick={() => setShowRevenueModal(true)}
                    className="btn-primary btn-professional-primary"
                  >
                    <span>💰</span>
                    <span>Add Revenue</span>
                  </button>
                </div>
              </div>
              <p>Financial content coming from separate component...</p>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="calendar page-transition">
              <div className="section-header">
                <h2>Calendar Management</h2>
              </div>
              <p>Calendar content coming from separate component...</p>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="pricing page-transition">
              <div className="section-header">
                <h2>Pricing Management</h2>
              </div>
              <p>Pricing content coming from separate component...</p>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="messages page-transition">
              <div className="section-header">
                <h2>Messages & Communication</h2>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="btn-primary btn-professional-primary"
                >
                  <span>✉️</span>
                  <span>New Message</span>
                </button>
              </div>
              <p>Messages content coming from separate component...</p>
            </div>
          )}
        </main>

        {/* Modals will be added here */}
        {showBookingModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>New Booking</h3>
              <p>Booking modal coming from separate component...</p>
              <button onClick={() => setShowBookingModal(false)}>Close</button>
            </div>
          </div>
        )}

        {showAvailabilityModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>Check Availability</h3>
              <p>Availability modal coming from separate component...</p>
              <button onClick={() => setShowAvailabilityModal(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </ProfessionalBackground>
  );
}

// App wrapper with context provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
