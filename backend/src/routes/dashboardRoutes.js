/**
 * Dashboard Routes
 * Dashboard and analytics endpoints
 */

const express = require('express');
const router = express.Router();
const dataStore = require('../services/dataStore');
const pricingService = require('../services/pricingService');
const currencyService = require('../services/currencyService');
const { getISTDate, getISTDateString, getISTWeekStart, getISTMonthStart } = require('../utils/dateHelper');
const { calculateFinancialSummary } = require('../utils/financialHelper');
const { successResponse } = require('../utils/responseHelper');

// Main dashboard
router.get('/', (req, res) => {
  const istToday = getISTDate();
  const todayStr = getISTDateString();
  const thisMonthStart = getISTMonthStart();
  
  const todayArrivals = dataStore.reservations.filter(r => 
    r.dates.checkIn === todayStr && r.status !== 'cancelled'
  );
  
  const todayDepartures = dataStore.reservations.filter(r => 
    r.dates.checkOut === todayStr && r.status !== 'cancelled'
  );
  
  const stayOvers = dataStore.reservations.filter(r => 
    new Date(r.dates.checkIn) < istToday && 
    new Date(r.dates.checkOut) > istToday && 
    r.status === 'checked-in'
  );
  
  const activeReservations = dataStore.reservations.filter(r => 
    r.status === 'confirmed' && 
    new Date(r.dates.checkIn) <= istToday && 
    new Date(r.dates.checkOut) > istToday
  );
  
  const monthlyReservations = dataStore.reservations.filter(r => 
    r.dates.checkIn >= thisMonthStart && r.status !== 'cancelled'
  );
  
  const monthlyRevenueLKR = monthlyReservations.reduce((sum, r) => 
    sum + (parseFloat(r.pricing?.totalLKR) || 0), 0
  );
  
  const lowStockItems = dataStore.inventory.filter(item => item.currentStock <= item.minStock);
  
  return successResponse(res, {
    overview: {
      totalUnits: pricingService.getUnits().length,
      activeReservations: activeReservations.length,
      monthlyReservations: monthlyReservations.length,
      occupancyRate: `${((activeReservations.length / pricingService.getUnits().length) * 100).toFixed(1)}%`
    },
    todayActivities: {
      arrivals: { count: todayArrivals.length, reservations: todayArrivals },
      departures: { count: todayDepartures.length, reservations: todayDepartures },
      stayOvers: { count: stayOvers.length, reservations: stayOvers }
    },
    revenue: {
      monthlyLKR: monthlyRevenueLKR,
      monthlyUSD: currencyService.convert(monthlyRevenueLKR, 'LKR', 'USD').toFixed(2)
    },
    alerts: {
      lowStockItems: lowStockItems.length,
      checkInsToday: todayArrivals.length,
      checkOutsToday: todayDepartures.length
    }
  });
});

// Financial dashboard
router.get('/financial', (req, res) => {
  const todayStr = getISTDateString();
  const thisWeekStartStr = getISTWeekStart();
  const thisMonthStr = getISTMonthStart();
  
  const todayRevenue = dataStore.revenueEntries
    .filter(r => r.date === todayStr)
    .reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  
  const todayExpenses = dataStore.financialExpenses
    .filter(e => e.expenseDate === todayStr && (e.status === 'approved' || e.status === 'paid'))
    .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  const weeklyFinancial = calculateFinancialSummary(
    dataStore.revenueEntries,
    dataStore.financialExpenses,
    thisWeekStartStr,
    todayStr,
    currencyService.getRate()
  );
  
  const monthlyFinancial = calculateFinancialSummary(
    dataStore.revenueEntries,
    dataStore.financialExpenses,
    thisMonthStr,
    todayStr,
    currencyService.getRate()
  );
  
  const pendingExpenses = dataStore.financialExpenses.filter(e => e.status === 'pending');
  const unpaidReservations = dataStore.reservations.filter(r => 
    r.paymentStatus === 'not-paid' && r.status !== 'cancelled'
  );
  
  return successResponse(res, {
    financialOverview: {
      today: {
        revenue: todayRevenue,
        expenses: todayExpenses,
        profit: todayRevenue - todayExpenses,
        profitMargin: todayRevenue > 0 ? ((todayRevenue - todayExpenses) / todayRevenue * 100).toFixed(2) : 0
      },
      thisWeek: weeklyFinancial,
      thisMonth: monthlyFinancial
    },
    alerts: {
      pendingExpenseApprovals: pendingExpenses.length,
      unpaidReservations: unpaidReservations.length,
      lowStockAlerts: dataStore.inventory.filter(i => i.currentStock <= i.minStock).length
    }
  });
});

module.exports = router;
