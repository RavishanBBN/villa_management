const db = require('../database/db');

// Get dashboard overview statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Total reservations
    const totalReservations = await db.get(
      'SELECT COUNT(*) as count FROM reservations'
    );

    // Active reservations
    const activeReservations = await db.get(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE status IN ('confirmed', 'checked_in') 
       AND checkOut >= ?`,
      [today]
    );

    // Today's check-ins
    const todayCheckIns = await db.get(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE DATE(checkIn) = ? AND status = 'confirmed'`,
      [today]
    );

    // Today's check-outs
    const todayCheckOuts = await db.get(
      `SELECT COUNT(*) as count FROM reservations 
       WHERE DATE(checkOut) = ? AND status = 'checked_in'`,
      [today]
    );

    // Total revenue (this month)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const monthRevenue = await db.get(
      `SELECT SUM(amount) as total FROM payments 
       WHERE paymentStatus = 'completed' 
       AND DATE(paymentDate) >= ?`,
      [monthStart]
    );

    // Pending payments
    const pendingPayments = await db.get(
      `SELECT COUNT(*) as count, SUM(totalAmount) as amount 
       FROM reservations 
       WHERE paymentStatus IN ('pending', 'partial')`
    );

    // Occupancy rate
    const properties = require('../config/properties.json');
    const totalUnits = properties.units.length;
    const occupiedUnits = await db.get(
      `SELECT COUNT(DISTINCT propertyId) as count FROM reservations 
       WHERE status = 'checked_in' 
       AND checkIn <= ? AND checkOut > ?`,
      [today, today]
    );
    
    const occupancyRate = totalUnits > 0 ? (occupiedUnits.count / totalUnits) * 100 : 0;

    // Recent reservations
    const recentReservations = await db.all(
      `SELECT r.*, g.firstName, g.lastName, g.email 
       FROM reservations r
       LEFT JOIN guests g ON r.guestId = g.id
       ORDER BY r.createdAt DESC
       LIMIT 5`
    );

    // Upcoming check-ins
    const upcomingCheckIns = await db.all(
      `SELECT r.*, g.firstName, g.lastName, g.email 
       FROM reservations r
       LEFT JOIN guests g ON r.guestId = g.id
       WHERE r.status = 'confirmed' AND r.checkIn > ?
       ORDER BY r.checkIn ASC
       LIMIT 5`,
      [today]
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalReservations: totalReservations.count,
          activeReservations: activeReservations.count,
          todayCheckIns: todayCheckIns.count,
          todayCheckOuts: todayCheckOuts.count,
          monthRevenue: monthRevenue.total || 0,
          pendingPayments: {
            count: pendingPayments.count,
            amount: pendingPayments.amount || 0
          },
          occupancyRate: occupancyRate.toFixed(2),
          totalUnits,
          occupiedUnits: occupiedUnits.count
        },
        recentReservations: recentReservations.map(r => ({
          ...r,
          guestInfo: JSON.parse(r.guestInfo || '{}')
        })),
        upcomingCheckIns: upcomingCheckIns.map(r => ({
          ...r,
          guestInfo: JSON.parse(r.guestInfo || '{}')
        }))
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
};

// Get revenue analytics
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'month', year, month } = req.query;
    
    let groupBy = "strftime('%Y-%m', paymentDate)";
    let dateFilter = '';
    const params = [];

    if (period === 'year' && year) {
      groupBy = "strftime('%Y-%m', paymentDate)";
      dateFilter = "AND strftime('%Y', paymentDate) = ?";
      params.push(year);
    } else if (period === 'month' && year && month) {
      groupBy = "strftime('%Y-%m-%d', paymentDate)";
      dateFilter = "AND strftime('%Y', paymentDate) = ? AND strftime('%m', paymentDate) = ?";
      params.push(year, month.toString().padStart(2, '0'));
    }

    const revenueData = await db.all(
      `SELECT 
        ${groupBy} as period,
        SUM(amount) as revenue,
        COUNT(*) as transactions
       FROM payments
       WHERE paymentStatus = 'completed' ${dateFilter}
       GROUP BY ${groupBy}
       ORDER BY period ASC`,
      params
    );

    res.json({
      success: true,
      data: revenueData
    });
  } catch (error) {
    console.error('Error getting revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue analytics',
      error: error.message
    });
  }
};

// Get occupancy analytics
exports.getOccupancyAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'startDate and endDate are required'
      });
    }

    const properties = require('../config/properties.json');
    const totalUnits = properties.units.length;

    // Get daily occupancy
    const occupancyData = await db.all(
      `SELECT 
        DATE(date) as date,
        COUNT(DISTINCT propertyId) as occupied
       FROM (
         SELECT 
           r.propertyId,
           date(julianday(?) + (seq * 1)) as date
         FROM reservations r
         CROSS JOIN (
           SELECT 0 as seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL 
           SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
         )
         WHERE r.status IN ('confirmed', 'checked_in')
         AND date BETWEEN r.checkIn AND r.checkOut
         AND date BETWEEN ? AND ?
       )
       GROUP BY date
       ORDER BY date`,
      [startDate, startDate, endDate]
    );

    const dataWithRate = occupancyData.map(d => ({
      ...d,
      occupancyRate: ((d.occupied / totalUnits) * 100).toFixed(2)
    }));

    res.json({
      success: true,
      data: {
        occupancy: dataWithRate,
        totalUnits
      }
    });
  } catch (error) {
    console.error('Error getting occupancy analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve occupancy analytics',
      error: error.message
    });
  }
};
