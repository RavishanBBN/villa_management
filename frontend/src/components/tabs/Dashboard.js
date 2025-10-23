import React from 'react';
import { useDashboard, useReservations, useProperties, useFinancial } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils';
import { Line, Bar } from 'react-chartjs-2';
import { getChartOptions, generateChartData, colorPalettes } from '../../utils/chartConfig';

export const Dashboard = () => {
  const { dashboardData, loading: dashboardLoading } = useDashboard();
  const { reservations } = useReservations();
  const { properties } = useProperties();
  const { revenue, expenses, realtimeMetrics } = useFinancial();

  // Calculate statistics
  const stats = {
    totalUnits: properties.length,
    occupiedUnits: reservations.filter(r => r.status === 'checked_in').length,
    totalReservations: reservations.filter(r => r.status !== 'cancelled').length,
    monthlyRevenue: realtimeMetrics?.thisMonth?.revenue || 0,
    monthlyProfit: realtimeMetrics?.thisMonth?.profit || 0,
  };

  // Recent reservations
  const recentReservations = reservations
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  // Revenue chart data (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  const revenueChartData = generateChartData(last6Months, [
    {
      label: 'Revenue',
      data: [450000, 520000, 480000, 610000, 580000, 650000],
      borderColor: colorPalettes.borders[0],
      backgroundColor: colorPalettes.primary[0],
    }
  ]);

  return (
    <div className="dashboard page-transition">
      {/* Stats Grid */}
      <div className="stats-grid stats-grid-professional">
        <div className="stat-card">
          <div className="stat-icon text-blue-500" style={{ fontSize: '2rem' }}>
            🏠
          </div>
          <div className="stat-info">
            <div className="stat-label">Total Units</div>
            <div className="stat-value">{stats.totalUnits}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-green-500" style={{ fontSize: '2rem' }}>
            👥
          </div>
          <div className="stat-info">
            <div className="stat-label">Occupied</div>
            <div className="stat-value">{stats.occupiedUnits}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-purple-500" style={{ fontSize: '2rem' }}>
            📅
          </div>
          <div className="stat-info">
            <div className="stat-label">Reservations</div>
            <div className="stat-value">{stats.totalReservations}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon text-emerald-500" style={{ fontSize: '2rem' }}>
            💰
          </div>
          <div className="stat-info">
            <div className="stat-label">Monthly Revenue</div>
            <div className="stat-value">{formatCurrency(stats.monthlyRevenue, 'LKR')}</div>
            {stats.monthlyProfit > 0 && (
              <div className="stat-secondary" style={{ fontSize: '0.75rem', color: '#059669' }}>
                Profit: {formatCurrency(stats.monthlyProfit, 'LKR')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="dashboard-charts" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {/* Revenue Trend */}
          <div className="chart-card" style={{ 
            background: 'white', 
            padding: '1.5rem', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)' 
          }}>
            <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>
              📈 Revenue Trend
            </h3>
            <div style={{ height: '300px' }}>
              <Line data={revenueChartData} options={getChartOptions('line')} />
            </div>
          </div>

          {/* Occupancy Status */}
          <div className="stat-card" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            padding: '2rem',
            borderRadius: '12px'
          }}>
            <h3 style={{ marginBottom: '1rem' }}>🏠 Occupancy Status</h3>
            <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>
              {stats.totalUnits > 0 
                ? ((stats.occupiedUnits / stats.totalUnits) * 100).toFixed(1)
                : 0}%
            </div>
            <div style={{ marginTop: '0.5rem', opacity: 0.9 }}>
              {stats.occupiedUnits} of {stats.totalUnits} units occupied
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reservations */}
      <div className="recent-section" style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>
          📅 Recent Reservations
        </h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Property</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentReservations.map(reservation => (
                <tr key={reservation.id}>
                  <td>{reservation.guestInfo?.bookerName || 'N/A'}</td>
                  <td>{reservation.propertyId}</td>
                  <td>{formatDate(reservation.checkIn)}</td>
                  <td>{formatDate(reservation.checkOut)}</td>
                  <td>
                    <span className={`status-badge ${reservation.status}`}>
                      {reservation.status}
                    </span>
                  </td>
                  <td>{formatCurrency(reservation.pricing?.totalLKR || 0, 'LKR')}</td>
                </tr>
              ))}
              {recentReservations.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No recent reservations
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Metrics */}
      {realtimeMetrics && (
        <div className="realtime-metrics" style={{ 
          marginTop: '2rem', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem' 
        }}>
          <div className="metric-card" style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Today's Revenue</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
              {formatCurrency(realtimeMetrics.today?.revenue || 0, 'LKR')}
            </div>
          </div>

          <div className="metric-card" style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>This Week</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {formatCurrency(realtimeMetrics.thisWeek?.revenue || 0, 'LKR')}
            </div>
          </div>

          <div className="metric-card" style={{ 
            background: 'white', 
            padding: '1rem', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>This Month</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {formatCurrency(realtimeMetrics.thisMonth?.revenue || 0, 'LKR')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
