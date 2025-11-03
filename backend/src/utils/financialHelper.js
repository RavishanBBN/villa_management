/**
 * Financial Helper Utilities
 * Reusable financial calculation and formatting functions
 */

const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.00';
  }
  return parseFloat(value).toFixed(decimals);
};

const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const convertCurrency = (amount, fromCurrency, toCurrency, exchangeRate) => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'USD' && toCurrency === 'LKR') {
    return amount * exchangeRate;
  }
  
  if (fromCurrency === 'LKR' && toCurrency === 'USD') {
    return amount / exchangeRate;
  }
  
  return amount;
};

const validateRevenueEntry = (entry) => {
  const errors = [];
  
  if (!entry.amount || isNaN(entry.amount) || entry.amount <= 0) {
    errors.push('Invalid amount');
  }
  
  if (!entry.type || !['accommodation', 'services', 'other'].includes(entry.type)) {
    errors.push('Invalid revenue type');
  }
  
  if (!entry.description || entry.description.length < 3) {
    errors.push('Description too short');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const calculateFinancialSummary = (revenueEntries, financialExpenses, startDate, endDate, exchangeRate) => {
  const periodRevenue = revenueEntries.filter(r => {
    const inRange = r.date >= startDate && r.date <= endDate;
    return inRange;
  });
  
  const periodExpenses = financialExpenses.filter(e => {
    const inRange = e.expenseDate >= startDate && e.expenseDate <= endDate;
    const validStatus = (e.status === 'approved' || e.status === 'paid');
    return inRange && validStatus;
  });
  
  const totalRevenue = periodRevenue.reduce((sum, r) => {
    const amount = parseFloat(r.amount) || 0;
    return sum + amount;
  }, 0);
  
  const totalExpenses = periodExpenses.reduce((sum, e) => {
    const amount = parseFloat(e.amount) || 0;
    return sum + amount;
  }, 0);
  
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;
  
  return {
    period: { startDate, endDate },
    revenue: {
      total: totalRevenue,
      totalUSD: totalRevenue / exchangeRate,
      byType: {
        accommodation: periodRevenue.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
        services: periodRevenue.filter(r => r.type === 'services').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0),
        other: periodRevenue.filter(r => r.type === 'other').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0)
      },
      count: periodRevenue.length
    },
    expenses: {
      total: totalExpenses,
      totalUSD: totalExpenses / exchangeRate,
      byCategory: {
        utilities: periodExpenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        maintenance: periodExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        supplies: periodExpenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        staff: periodExpenses.filter(e => e.category === 'staff').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        marketing: periodExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        services: periodExpenses.filter(e => e.category === 'services').reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
      },
      count: periodExpenses.length
    },
    profit: {
      gross: grossProfit,
      grossUSD: grossProfit / exchangeRate,
      margin: profitMargin.toFixed(2)
    },
    calculatedAt: new Date().toISOString()
  };
};

module.exports = {
  safeToFixed,
  safeParseFloat,
  convertCurrency,
  validateRevenueEntry,
  calculateFinancialSummary
};
