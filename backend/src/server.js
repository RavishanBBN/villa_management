// backend/src/server.js
// Fixed Halcyon Rest Management System - Path Parameter Error Resolved

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

// Import database (this should be at the top of your file)
const db = require('./models');
const app = express();
const PORT = process.env.PORT || 3001;
process.env.TZ = 'Asia/Kolkata';

// Import routes
const inventoryRoutes = require('./routes/inventoryRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Currency conversion service
let exchangeRate = 300; // Fallback rate
const updateExchangeRate = async () => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    if (response.data && response.data.rates && response.data.rates.LKR) {
      exchangeRate = response.data.rates.LKR;
      console.log(`💱 Exchange rate updated: 1 USD = ${exchangeRate} LKR`);
      
      // Update pricing data with new exchange rate
      pricingData.units.forEach(unit => {
        Object.keys(unit.basePricing).forEach(guestType => {
          unit.basePricing[guestType].LKR = Math.round(unit.basePricing[guestType].USD * exchangeRate);
        });
      });
    }
  } catch (error) {
    console.log('⚠️ Using fallback exchange rate:', exchangeRate);
  }
};

// Update exchange rate every hour
setInterval(updateExchangeRate, 3600000);
updateExchangeRate(); // Initial fetch

// Enhanced Halcyon Rest property data with correct pricing
const halcyonRestUnits = [
  {
    id: 'ground-floor',
    name: 'Halcyon Rest - Ground Floor',
    type: 'unit',
    maxAdults: 4,
    maxChildren: 3,
    maxOccupancy: 4,
    // Updated pricing - Ground Floor is MORE expensive
    basePriceLKR: Math.round(112 * exchangeRate), // ~US$112 average
    priceRangeUSD: { min: 104, max: 122 },
    checkInTime: '14:00',
    checkOutTime: '11:00',
    amenities: [
      '2 Bedrooms with attached bathrooms',
      'Kitchen',
      'Living area', 
      'Garden access',
      'Washing machine',
      'Air conditioning',
      'Free WiFi',
      'Ground floor access'
    ],
    status: 'available'
  },
  {
    id: 'first-floor',
    name: 'Halcyon Rest - First Floor',
    type: 'unit',
    maxAdults: 4,
    maxChildren: 3,
    maxOccupancy: 4,
    // Updated pricing - First Floor is LESS expensive
    basePriceLKR: Math.round(111 * exchangeRate), // ~US$111 average
    priceRangeUSD: { min: 102, max: 120 },
    checkInTime: '14:00',
    checkOutTime: '11:00',
    amenities: [
      '2 Bedrooms with attached bathrooms',
      'Kitchen',
      'Living area',
      'Balcony with view',
      'Washing machine', 
      'Air conditioning',
      'Free WiFi',
      'First floor with stairs'
    ],
    status: 'available'
  }
];
// NEW: Calendar and Pricing Management Data Stores
let calendarOverrides = []; // For date blocks and custom pricing
let externalCalendars = []; // For external calendar integrations
let seasonalRates = []; // For seasonal pricing rules
let pricingData = {
  units: [
    {
      id: 'ground-floor',
      name: 'Halcyon Rest - Ground Floor',
      lastUpdated: new Date().toISOString(),
      priceRangeUSD: { min: 104, max: 122 },
      basePricing: {
        guest1: { USD: 104, LKR: Math.round(104 * exchangeRate) },
        guest2: { USD: 112, LKR: Math.round(112 * exchangeRate) },
        guest3: { USD: 122, LKR: Math.round(122 * exchangeRate) },
        guest4: { USD: 122, LKR: Math.round(122 * exchangeRate) }
      }
    },
    {
      id: 'first-floor',
      name: 'Halcyon Rest - First Floor',
      lastUpdated: new Date().toISOString(),
      priceRangeUSD: { min: 102, max: 120 },
      basePricing: {
        guest1: { USD: 102, LKR: Math.round(102 * exchangeRate) },
        guest2: { USD: 110, LKR: Math.round(110 * exchangeRate) },
        guest3: { USD: 120, LKR: Math.round(120 * exchangeRate) },
        guest4: { USD: 120, LKR: Math.round(120 * exchangeRate) }
      }
    }
  ]
};
// Mock data stores
// ===== FINANCIAL MANAGEMENT DATA STRUCTURES =====
// Add this RIGHT AFTER the inventory array (around line 95)

// Revenue tracking - automatically captures all income
let revenueEntries = [
  {
    id: 'rev_sample_001',
    type: 'accommodation', // accommodation, services, other
    source: 'reservation', // reservation, manual
    sourceId: null,
    description: 'Sample accommodation revenue',
    amount: 90000, // LKR
    amountUSD: 300,
    currency: 'LKR',
    exchangeRate: 300,
    date: '2024-12-15',
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    guestName: 'Sample Guest',
    confirmationNumber: 'HR12345678',
    tags: ['accommodation', 'sample'],
    notes: 'Sample revenue entry for testing',
    createdAt: '2024-12-15T10:00:00Z',
    updatedAt: '2024-12-15T10:00:00Z'
  }
];

// Comprehensive expense tracking with mandatory invoices
let financialExpenses = [
  {
    id: 'exp_sample_001',
    category: 'utilities', // utilities, maintenance, supplies, staff, marketing, services
    subcategory: 'electricity',
    description: 'Monthly electricity bill - December 2024',
    amount: 25000,
    amountUSD: 83.33,
    currency: 'LKR',
    expenseDate: '2024-12-15',
    paymentMethod: 'bank_transfer',
    vendor: 'Ceylon Electricity Board',
    invoiceNumber: 'CEB_DEC_2024_001',
    invoiceFile: '/uploads/invoices/sample_electricity.pdf', // MANDATORY
    receiptFile: null,
    approvedBy: 'staff_1',
    approvedDate: '2024-12-15T09:00:00Z',
    status: 'approved', // pending, approved, rejected, paid
    isRecurring: true,
    recurringFrequency: 'monthly',
    nextDueDate: '2025-01-15',
    budgetCategory: 'operations',
    taxDeductible: true,
    tags: ['monthly', 'utilities', 'fixed-cost'],
    notes: 'Regular monthly electricity expense',
    createdBy: 'staff_2',
    createdAt: '2024-12-15T08:00:00Z'
  },
  {
    id: 'exp_sample_002',
    category: 'maintenance',
    subcategory: 'plumbing',
    description: 'Bathroom faucet repair - Ground Floor',
    amount: 8500,
    amountUSD: 28.33,
    currency: 'LKR',
    expenseDate: '2024-12-14',
    paymentMethod: 'cash',
    vendor: 'Local Plumber',
    invoiceNumber: 'PLUMB_001',
    invoiceFile: '/uploads/invoices/sample_plumbing.pdf', // MANDATORY
    receiptFile: '/uploads/receipts/plumbing_receipt.jpg',
    approvedBy: 'staff_1',
    approvedDate: '2024-12-14T15:00:00Z',
    status: 'paid',
    isRecurring: false,
    recurringFrequency: null,
    nextDueDate: null,
    budgetCategory: 'maintenance',
    taxDeductible: true,
    tags: ['one-time', 'maintenance', 'ground-floor'],
    notes: 'Emergency repair - guest reported issue',
    createdBy: 'staff_3',
    createdAt: '2024-12-14T14:00:00Z'
  }
];

// Invoice management for guests and internal records
let financialInvoices = [];

// Financial periods for reporting (weekly, monthly summaries)
let financialPeriods = [];

// Helper function to automatically create revenue from reservation payments
// Note: autoCreateRevenueFromReservation function is defined later in the file with better validation
// Helper function to calculate financial summary for periods
// ===== MISSING VALIDATION MIDDLEWARE =====
// Add this RIGHT AFTER the helper functions section (around line 250, before the routes)
const getISTDate = () => {
  const now = new Date();
  // Convert to IST by adding 5 hours 30 minutes (UTC+05:30) to UTC
  const istTime = new Date(now.getTime() + (5 * 60 * 60 * 1000) + (30 * 60 * 1000));
  return istTime;
};

const getISTDateString = () => {
  const istDate = getISTDate();
  return istDate.toISOString().split('T')[0];
};

const getISTWeekStart = () => {
  const istDate = getISTDate();
  const weekStart = new Date(istDate);
  weekStart.setDate(istDate.getDate() - istDate.getDay());
  return weekStart.toISOString().split('T')[0];
};

const getISTMonthStart = () => {
  const istDate = getISTDate();
  const monthStart = new Date(istDate.getFullYear(), istDate.getMonth(), 1);
  return monthStart.toISOString().split('T')[0];
};

const getISTYearStart = () => {
  const istDate = getISTDate();
  const yearStart = new Date(istDate.getFullYear(), 0, 1);
  return yearStart.toISOString().split('T')[0];
};
// Validation middleware for revenue data
const validateRevenueData = (req, res, next) => {
  const { type, description, amount, currency = 'LKR' } = req.body;
  
  // Required fields validation
  if (!type || !description || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['type', 'description', 'amount'],
      provided: {
        type: !!type,
        description: !!description,
        amount: !!amount
      },
      timestamp: new Date().toISOString()
    });
  }
  
  // Type validation
  const validTypes = ['accommodation', 'services', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid revenue type',
      validTypes: validTypes,
      provided: type,
      timestamp: new Date().toISOString()
    });
  }
  
  // Amount validation
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
      provided: amount,
      timestamp: new Date().toISOString()
    });
  }
  
  // Currency validation
  const validCurrencies = ['LKR', 'USD'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid currency',
      validCurrencies: validCurrencies,
      provided: currency,
      timestamp: new Date().toISOString()
    });
  }
  
  // Description length validation
  if (description.length < 3 || description.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Description must be between 3 and 200 characters',
      provided: description.length,
      timestamp: new Date().toISOString()
    });
  }
  
  // Optional payment method validation
  if (req.body.paymentMethod) {
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'online'];
    if (!validPaymentMethods.includes(req.body.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
        validPaymentMethods: validPaymentMethods,
        provided: req.body.paymentMethod,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // If all validations pass, continue to the route handler
  next();
};

// ===== ADDITIONAL HELPER FUNCTIONS =====
// Add these helper functions if they're missing

// Handle revenue-specific errors
const handleRevenueError = (error, operation, res) => {
  console.error(`Revenue ${operation} error:`, error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error in revenue operation',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
  
  if (error.name === 'NotFoundError') {
    return res.status(404).json({
      success: false,
      message: 'Revenue entry not found',
      timestamp: new Date().toISOString()
    });
  }
  
  return res.status(500).json({
    success: false,
    message: `Internal server error in revenue ${operation}`,
    timestamp: new Date().toISOString()
  });
};

// Generate revenue analytics summary
const generateRevenueAnalytics = (revenueEntries, period = 'month') => {
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = now.toISOString().split('T')[0];
      endDate = startDate;
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      startDate = weekStart.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
      break;
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
      break;
  }
  
  const periodRevenue = revenueEntries.filter(r => 
    r.date >= startDate && r.date <= endDate && r.paymentStatus === 'completed'
  );
  
  return {
    totalRevenue: periodRevenue.reduce((sum, r) => sum + r.amount, 0),
    totalTransactions: periodRevenue.length,
    averageTransaction: periodRevenue.length > 0 ? 
      periodRevenue.reduce((sum, r) => sum + r.amount, 0) / periodRevenue.length : 0,
    byType: {
      accommodation: periodRevenue.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
      services: periodRevenue.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
      other: periodRevenue.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0)
    },
    period: { startDate, endDate }
  };
};

const calculateFinancialSummary = (startDate, endDate) => {
  console.log(`💰 Calculating financial summary from ${startDate} to ${endDate}`);
  
  // Filter revenue entries for the period
  const periodRevenue = revenueEntries.filter(r => {
    const inRange = r.date >= startDate && r.date <= endDate;
    console.log(`Revenue ${r.id}: date=${r.date}, inRange=${inRange}, status=${r.paymentStatus}`);
    return inRange;
  });
  
  // Filter expenses for the period  
  const periodExpenses = financialExpenses.filter(e => {
    const inRange = e.expenseDate >= startDate && e.expenseDate <= endDate;
    const validStatus = (e.status === 'approved' || e.status === 'paid');
    console.log(`Expense ${e.id}: date=${e.expenseDate}, inRange=${inRange}, status=${e.status}, validStatus=${validStatus}`);
    return inRange && validStatus;
  });
  
  console.log(`Found ${periodRevenue.length} revenue entries and ${periodExpenses.length} expense entries`);
  
  const totalRevenue = periodRevenue.reduce((sum, r) => {
    const amount = parseFloat(r.amount) || 0;
    console.log(`Adding revenue: ${amount}`);
    return sum + amount;
  }, 0);
  
  const totalExpenses = periodExpenses.reduce((sum, e) => {
    const amount = parseFloat(e.amount) || 0;
    console.log(`Adding expense: ${amount}`);
    return sum + amount;
  }, 0);
  
  const grossProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100) : 0;
  
  console.log(`Financial Summary: Revenue=${totalRevenue}, Expenses=${totalExpenses}, Profit=${grossProfit}`);
  
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
let reservations = [];
let guests = [];
let messages = []; // Message store
let inventory = [
  { id: 1, item: 'Bed Sheets', category: 'housekeeping', currentStock: 20, minStock: 5, unit: 'sets' },
  { id: 2, item: 'Towels', category: 'housekeeping', currentStock: 15, minStock: 8, unit: 'pieces' },
  { id: 3, item: 'Toilet Paper', category: 'housekeeping', currentStock: 30, minStock: 10, unit: 'rolls' },
  { id: 4, item: 'Cleaning Supplies', category: 'housekeeping', currentStock: 5, minStock: 3, unit: 'bottles' },
  { id: 5, item: 'Coffee', category: 'kitchen', currentStock: 3, minStock: 2, unit: 'kg' },
  { id: 6, item: 'Tea Bags', category: 'kitchen', currentStock: 100, minStock: 20, unit: 'pieces' }
];

// Helper functions
const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  if (fromCurrency === 'USD' && toCurrency === 'LKR') {
    return amount * exchangeRate;
  }
  
  if (fromCurrency === 'LKR' && toCurrency === 'USD') {
    return amount / exchangeRate;
  }
  
  return amount;
};

const calculateNights = (checkIn, checkOut) => {
  const diffTime = Math.abs(new Date(checkOut) - new Date(checkIn));
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

const isUnitAvailable = (unitId, checkIn, checkOut) => {
  const conflictingReservations = reservations.filter(r => 
    r.unitId === unitId && 
    r.status !== 'cancelled' &&
    (
      (new Date(checkIn) >= new Date(r.dates.checkIn) && new Date(checkIn) < new Date(r.dates.checkOut)) ||
      (new Date(checkOut) > new Date(r.dates.checkIn) && new Date(checkOut) <= new Date(r.dates.checkOut)) ||
      (new Date(checkIn) <= new Date(r.dates.checkIn) && new Date(checkOut) >= new Date(r.dates.checkOut))
    )
  );
  return conflictingReservations.length === 0;
};

// Enhanced guest capacity calculation with age consideration
const calculateGuestCapacity = (adults, children, childrenAges = []) => {
  let effectiveAdults = parseInt(adults);
  let effectiveChildren = 0;
  
  // Count children over 11 as adults
  if (Array.isArray(childrenAges)) {
    childrenAges.forEach(age => {
      if (parseInt(age) > 11) {
        effectiveAdults += 1;
      } else {
        effectiveChildren += 1;
      }
    });
  } else {
    // If no ages provided, assume all children are under 11
    effectiveChildren = parseInt(children) || 0;
  }
  
  return {
    effectiveAdults,
    effectiveChildren,
    totalGuests: effectiveAdults + effectiveChildren
  };
};

// Dynamic pricing based on occupancy/season
const getDynamicPrice = (unitId, checkIn, checkOut, adults, children) => {
  const unit = halcyonRestUnits.find(u => u.id === unitId);
  if (!unit) return { basePriceLKR: 20000, basePriceUSD: 66 };
  
  const checkInDate = new Date(checkIn);
  const month = checkInDate.getMonth() + 1;
  const totalGuests = parseInt(adults) + parseInt(children || 0);
  
  // Base price based on occupancy (matching your images)
  let basePriceUSD;
  
  if (unit.id === 'ground-floor') {
    // Ground Floor pricing
    if (totalGuests === 1) basePriceUSD = 104;
    else if (totalGuests === 2) basePriceUSD = 112;
    else if (totalGuests >= 3) basePriceUSD = 122;
    else basePriceUSD = 112; // default
  } else {
    // First Floor pricing  
    if (totalGuests === 1) basePriceUSD = 102;
    else if (totalGuests === 2) basePriceUSD = 110;
    else if (totalGuests >= 3) basePriceUSD = 120;
    else basePriceUSD = 110; // default
  }
  
  let priceLKR = basePriceUSD * exchangeRate;
  
  // Seasonal adjustments
  if (month >= 12 || month <= 3) {
    priceLKR *= 1.2; // Peak season
  } else if (month >= 7 && month <= 9) {
    priceLKR *= 1.1; // High season
  }
  
  return {
    basePriceLKR: Math.round(priceLKR),
    basePriceUSD: Math.round(basePriceUSD * 100) / 100,
    seasonalFactor: month >= 12 || month <= 3 ? 'peak' : month >= 7 && month <= 9 ? 'high' : 'standard'
  };
};
// Routes
// NEW: Calendar Management Helper Functions
const isDateBlocked = (unitId, date) => {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return calendarOverrides.some(override => 
    override.unitId === unitId &&
    override.type === 'block' &&
    dateStr >= override.startDate &&
    dateStr <= override.endDate
  );
};
// Initialize and fix existing data on server start
const initializeFinancialData = () => {
  console.log('🔧 Initializing financial data...');
  
  // Fix existing revenue entries
  revenueEntries.forEach((entry, index) => {
    // Ensure numeric values
    entry.amount = parseFloat(entry.amount) || 0;
    entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / exchangeRate;
    entry.exchangeRate = parseFloat(entry.exchangeRate) || exchangeRate;
    
    // Ensure required fields
    if (!entry.id) entry.id = 'rev_fix_' + Date.now() + '_' + index;
    if (!entry.date) entry.date = new Date().toISOString().split('T')[0];
    if (!entry.paymentStatus) entry.paymentStatus = 'completed';
    if (!entry.currency) entry.currency = 'LKR';
  });
  
  // Fix existing expense entries
  financialExpenses.forEach((entry, index) => {
    // Ensure numeric values
    entry.amount = parseFloat(entry.amount) || 0;
    entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / exchangeRate;
    
    // Ensure required fields
    if (!entry.id) entry.id = 'exp_fix_' + Date.now() + '_' + index;
    if (!entry.expenseDate) entry.expenseDate = new Date().toISOString().split('T')[0];
    if (!entry.status) entry.status = 'pending';
  });
  
  console.log(`✅ Fixed ${revenueEntries.length} revenue entries and ${financialExpenses.length} expense entries`);
};
const getCustomPricing = (unitId, date) => {
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const pricingOverride = calendarOverrides.find(override => 
    override.unitId === unitId &&
    override.type === 'pricing' &&
    dateStr >= override.startDate &&
    dateStr <= override.endDate
  );
  return pricingOverride ? pricingOverride.pricing : null;
};

const generateCalendarDays = (startDate, endDate, unitId) => {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    const isBlocked = isDateBlocked(unitId, dateStr);
    const customPricing = getCustomPricing(unitId, dateStr);
    
    // Check if date has existing reservation
    const hasReservation = reservations.some(r => 
      r.unitId === unitId && 
      r.status !== 'cancelled' &&
      dateStr >= r.dates.checkIn &&
      dateStr < r.dates.checkOut
    );
    
    const guestName = hasReservation ? 
      reservations.find(r => 
        r.unitId === unitId && 
        r.status !== 'cancelled' &&
        dateStr >= r.dates.checkIn &&
        dateStr < r.dates.checkOut
      )?.guestInfo?.bookerName : null;
    
    days.push({
      date: dateStr,
      available: !isBlocked && !hasReservation,
      source: isBlocked ? 'manual_block' : hasReservation ? 'reserved' : 'available',
      pricing: customPricing || {
        USD: pricingData.units.find(u => u.id === unitId)?.basePricing?.guest2?.USD || 110
      },
      hasOverride: !!customPricing,
      guestName: guestName
    });
  }
  
  return days;
};
// Main API info
app.get('/', (req, res) => {
  res.json({
    name: '🏨 Halcyon Rest Management System',
    description: 'Complete management system for Halcyon Rest villa',
    property: 'Halcyon Rest - Two Floor Villa',
    location: 'Sri Lanka',
    units: 2,
    capacity: '4 adults or 2 adults + 3 children per floor',
    currencies: ['LKR', 'USD'],
    currentExchangeRate: `1 USD = ${exchangeRate} LKR`,
    childrenPolicy: 'Children ≤11 years: Free | Children >11 years: Counted as adult',
    pricing: {
      groundFloor: `US$${halcyonRestUnits[0].priceRangeUSD.min}-${halcyonRestUnits[0].priceRangeUSD.max}`,
      firstFloor: `US$${halcyonRestUnits[1].priceRangeUSD.min}-${halcyonRestUnits[1].priceRangeUSD.max}`
    },
    version: '2.0.0',
    status: 'Active'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected',
    exchangeRate: exchangeRate,
    totalReservations: reservations.length,
    totalMessages: messages.length
  });
});

// Currency endpoints
app.get('/api/currency/rate', (req, res) => {
  res.json({
    baseCurrency: 'USD',
    targetCurrency: 'LKR',
    rate: exchangeRate,
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/currency/rates', (req, res) => {
  res.json({
    success: true,
    data: {
      baseCurrency: 'USD',
      rates: {
        LKR: exchangeRate,
        USD: 1
      },
      lastUpdated: new Date().toISOString()
    }
  });
});

// ===== INVENTORY MANAGEMENT ROUTES =====
app.use('/api/inventory', inventoryRoutes);

// ===== INVOICE MANAGEMENT ROUTES =====
app.use('/api/invoices', invoiceRoutes);

// ===== AUTHENTICATION ROUTES =====
app.use('/api/auth', authRoutes);

// ===== USER MANAGEMENT ROUTES =====
app.use('/api/users', userRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Enhanced revenue analytics endpoint
app.get('/api/revenue/enhanced-analytics', (req, res) => {
  const { period = 'month', includeProjections = false } = req.query;
  
  try {
    const analytics = generateRevenueAnalytics(revenueEntries, period);
    
    // Add projections if requested
    let projections = null;
    if (includeProjections === 'true') {
      const monthlyAverage = analytics.totalRevenue / 12; // Simplified projection
      projections = {
        nextMonth: monthlyAverage * 1.1, // 10% growth assumption
        nextQuarter: monthlyAverage * 3 * 1.05, // 5% growth
        confidence: 0.7
      };
    }
    
    res.json({
      success: true,
      data: {
        ...analytics,
        projections,
        trends: {
          growth: analytics.totalRevenue > 0 ? 'stable' : 'none',
          seasonality: 'low',
          volatility: 'medium'
        }
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Enhanced revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate enhanced revenue analytics',
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced property endpoints with dynamic pricing
app.get('/api/properties', (req, res) => {
  const { currency = 'LKR', checkIn, checkOut, adults = 2, children = 0 } = req.query;
  
  const unitsWithPricing = halcyonRestUnits.map(unit => {
    let pricing;
    
    if (checkIn && checkOut) {
      // Dynamic pricing based on dates and occupancy
      pricing = getDynamicPrice(unit.id, checkIn, checkOut, adults, children);
    } else {
      // Base pricing
      pricing = {
        basePriceLKR: unit.basePriceLKR,
        basePriceUSD: convertCurrency(unit.basePriceLKR, 'LKR', 'USD').toFixed(2)
      };
    }
    
    return {
      ...unit,
      basePriceLkr: pricing.basePriceLKR, // For compatibility
      pricing: {
        basePriceLKR: pricing.basePriceLKR,
        basePriceUSD: pricing.basePriceUSD,
        priceRangeUSD: unit.priceRangeUSD,
        currency: currency,
        displayPrice: currency === 'USD' ? pricing.basePriceUSD : pricing.basePriceLKR,
        seasonalFactor: pricing.seasonalFactor || 'standard'
      }
    };
  });
  
  res.json({
    success: true,
    data: {
      property: 'Halcyon Rest',
      totalUnits: halcyonRestUnits.length,
      units: unitsWithPricing,
      exchangeRate: `1 USD = ${exchangeRate} LKR`,
      childrenPolicy: 'Children ≤11 years: Free | Children >11 years: Counted as adult'
    }
  });
});

// Enhanced availability check with child age consideration
app.get('/api/reservations/availability/check', (req, res) => {
  const { checkIn, checkOut, unitId, adults = 2, children = 0, childrenAges } = req.query;
  
  if (!checkIn || !checkOut) {
    return res.status(400).json({
      success: false,
      message: 'checkIn and checkOut dates are required',
      timestamp: new Date().toISOString()
    });
  }

  console.log(`✅ Checking availability for ${checkIn} to ${checkOut}`);
  
  let unitsToCheck = halcyonRestUnits;
  if (unitId) {
    unitsToCheck = halcyonRestUnits.filter(u => u.id === unitId);
  }
  
  if (unitsToCheck.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'No units found. Valid IDs: ground-floor, first-floor',
      timestamp: new Date().toISOString()
    });
  }
  
  const availability = unitsToCheck.map(unit => {
    const available = isUnitAvailable(unit.id, checkIn, checkOut);
    const nights = calculateNights(checkIn, checkOut);
    
    // Calculate capacity with age consideration
    const parsedChildrenAges = childrenAges ? JSON.parse(childrenAges) : [];
    const guestCapacity = calculateGuestCapacity(adults, children, parsedChildrenAges);
    
    // Check if unit can accommodate guests
    const canAccommodate = guestCapacity.effectiveAdults <= unit.maxAdults && 
                           guestCapacity.totalGuests <= unit.maxOccupancy;
    
    // Get dynamic pricing
    const dynamicPricing = getDynamicPrice(unit.id, checkIn, checkOut, adults, children);
    const totalLKR = dynamicPricing.basePriceLKR * nights;
    const totalUSD = convertCurrency(totalLKR, 'LKR', 'USD');
    
    return {
      property: {
        id: unit.id,
        name: unit.name,
        unit: unit.name.includes('Ground') ? 'Ground Floor' : 'First Floor',
        maxAdults: unit.maxAdults,
        maxChildren: unit.maxChildren,
        amenities: unit.amenities,
        priceRange: unit.priceRangeUSD
      },
      available: available && canAccommodate,
      capacityIssue: !canAccommodate,
      guestBreakdown: guestCapacity,
      pricing: {
        nights,
        basePriceLKR: dynamicPricing.basePriceLKR,
        totalLKR,
        totalUSD: parseFloat(totalUSD.toFixed(2)),
        exchangeRate,
        seasonalFactor: dynamicPricing.seasonalFactor
      },
      conflictingReservations: !available ? reservations.filter(r => 
        r.unitId === unit.id && 
        r.status !== 'cancelled' &&
        (
          (new Date(checkIn) >= new Date(r.dates.checkIn) && new Date(checkIn) < new Date(r.dates.checkOut)) ||
          (new Date(checkOut) > new Date(r.dates.checkIn) && new Date(checkOut) <= new Date(r.dates.checkOut)) ||
          (new Date(checkIn) <= new Date(r.dates.checkIn) && new Date(checkOut) >= new Date(r.dates.checkOut))
        )
      ).map(r => ({
        id: r.id,
        checkIn: r.dates.checkIn,
        checkOut: r.dates.checkOut,
        status: r.status
      })) : []
    };
  });
  
  res.json({
    success: true,
    data: {
      checkIn,
      checkOut,
      availability,
      childrenPolicy: 'Children ≤11 years: Free | Children >11 years: Counted as adult'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced reservation creation with child age handling
app.post('/api/reservations', (req, res) => {
  const {
    propertyId,
    unitId,
    guestInfo,
    checkIn,
    checkOut,
    adults,
    children,
    childrenAges = [], // Array of children ages
    paymentCurrency = 'USD',
    specialRequests,
    source = 'direct',
    totalAmount,
    notes
  } = req.body;
  
  const actualUnitId = propertyId || unitId;
  
  // Validation
  if (!actualUnitId || !guestInfo || !checkIn || !checkOut || !adults) {
    return res.status(400).json({ 
      success: false,
      message: 'Missing required fields: propertyId/unitId, guestInfo, checkIn, checkOut, adults',
      timestamp: new Date().toISOString()
    });
  }
  
  const unit = halcyonRestUnits.find(u => u.id === actualUnitId);
  if (!unit) {
    return res.status(404).json({ 
      success: false,
      message: 'Unit not found. Valid IDs: ground-floor, first-floor',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check availability
  if (!isUnitAvailable(actualUnitId, checkIn, checkOut)) {
    return res.status(409).json({ 
      success: false,
      message: 'Unit not available for selected dates',
      timestamp: new Date().toISOString()
    });
  }
  
  // Enhanced capacity check with age consideration
  const guestCapacity = calculateGuestCapacity(adults, children, childrenAges);
  if (guestCapacity.effectiveAdults > unit.maxAdults || guestCapacity.totalGuests > unit.maxOccupancy) {
    return res.status(400).json({ 
      success: false,
      message: `Exceeds unit capacity. Max: ${unit.maxAdults} adults OR ${unit.maxOccupancy} total guests. Children >11 count as adults.`,
      guestBreakdown: guestCapacity,
      timestamp: new Date().toISOString()
    });
  }
  
  const nights = calculateNights(checkIn, checkOut);
  const dynamicPricing = getDynamicPrice(actualUnitId, checkIn, checkOut, adults, children);
  const totalLKR = dynamicPricing.basePriceLKR * nights;
  const totalUSD = convertCurrency(totalLKR, 'LKR', 'USD');
  const confirmationNumber = 'HR' + Date.now().toString().slice(-8);
  
  // Create enhanced reservation
  const reservation = {
    id: Date.now().toString(),
    confirmationNumber,
    unitId: actualUnitId,
    propertyId: actualUnitId,
    unitName: unit.name,
    guestInfo: {
      bookerName: guestInfo.bookerName,
      country: guestInfo.country,
      email: guestInfo.email,
      phone: guestInfo.phone,
      adults: parseInt(adults),
      children: parseInt(children || 0),
      childrenAges: childrenAges || [],
      effectiveAdults: guestCapacity.effectiveAdults,
      effectiveChildren: guestCapacity.effectiveChildren,
      passportPhotos: guestInfo.passportPhotos || []
    },
    dates: {
      checkIn,
      checkOut,
      nights
    },
    pricing: {
      basePriceLKR: dynamicPricing.basePriceLKR,
      totalLKR,
      totalUSD: totalUSD.toFixed(2),
      currency: paymentCurrency,
      exchangeRateUsed: exchangeRate,
      seasonalFactor: dynamicPricing.seasonalFactor
    },
    status: 'pending',
    paymentStatus: 'not-paid', // Default payment status
    source,
    specialRequests: specialRequests || notes || '',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    
    // Compatibility objects
    property: {
      id: actualUnitId,
      name: unit.name,
      unit: unit.name.includes('Ground') ? 'Ground Floor' : 'First Floor',
      basePrice: dynamicPricing.basePriceLKR,
      checkInTime: unit.checkInTime,
      checkOutTime: unit.checkOutTime
    },
    guest: {
      id: 'guest-' + Date.now(),
      bookerName: guestInfo.bookerName,
      country: guestInfo.country,
      email: guestInfo.email,
      phone: guestInfo.phone
    }
  };
  
  reservations.push(reservation);
  
  console.log(`✅ Created reservation ${confirmationNumber} for ${guestInfo.bookerName}`);
  
  res.status(201).json({
    success: true,
    data: reservation,
    message: 'Reservation created successfully',
    timestamp: new Date().toISOString()
  });
});
app.post('/api/test-data/create-today-enhanced', (req, res) => {
  const todayStr = getISTDateString();
  const istToday = getISTDate();
  
  console.log('🧪 Creating enhanced test data for today (IST):', todayStr);
  
  // Create test revenue for today
  const testRevenue = {
    id: 'rev_test_today_' + Date.now(),
    type: 'accommodation',
    source: 'manual',
    sourceId: null,
    description: 'Test revenue for today (IST) - Enhanced',
    amount: 50000,
    amountUSD: 166.67,
    currency: 'LKR',
    exchangeRate: exchangeRate,
    date: todayStr,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    guestName: 'Test Guest Today',
    confirmationNumber: 'HR' + Date.now().toString().slice(-8),
    tags: ['accommodation', 'test', 'today'],
    notes: 'Test revenue entry for today (IST) - Enhanced',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Create test expense for today
  const testExpense = {
    id: 'exp_test_today_' + Date.now(),
    category: 'utilities',
    subcategory: 'electricity',
    description: 'Test electricity bill for today (IST) - Enhanced',
    amount: 20000,
    amountUSD: 66.67,
    currency: 'LKR',
    expenseDate: todayStr, // This is the key field for expenses
    paymentMethod: 'bank_transfer',
    vendor: 'Test Electric Company Enhanced',
    invoiceNumber: 'TEST_TODAY_ENH_001',
    invoiceFile: '/test/invoice_today_enhanced.pdf',
    receiptFile: null,
    approvedBy: 'staff_1',
    approvedDate: new Date().toISOString(),
    status: 'paid', // This makes it count in today's metrics
    isRecurring: false,
    recurringFrequency: null,
    nextDueDate: null,
    budgetCategory: 'utilities',
    taxDeductible: true,
    tags: ['utilities', 'test', 'today', 'enhanced'],
    notes: 'Test expense for today (IST) - Enhanced',
    createdBy: 'staff_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to arrays
  revenueEntries.push(testRevenue);
  financialExpenses.push(testExpense);
  
  console.log('✅ Created enhanced test data for today:', {
    revenue: testRevenue.amount,
    expense: testExpense.amount,
    date: todayStr,
    revenueId: testRevenue.id,
    expenseId: testExpense.id
  });
  
  res.status(201).json({
    success: true,
    data: {
      revenue: testRevenue,
      expense: testExpense,
      todayString: todayStr,
      istTime: istToday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    },
    message: 'Enhanced test data created for today (IST)',
    timestamp: new Date().toISOString()
  });
});

// ADD THIS DEBUGGING ENDPOINT
app.get('/api/debug/timezone', (req, res) => {
  const utcNow = new Date();
  const istNow = getISTDate();
  
  res.json({
    success: true,
    debug: {
      serverTimezone: process.env.TZ || 'UTC',
      utcTime: utcNow.toISOString(),
      utcDateString: utcNow.toISOString().split('T')[0],
      istTime: istNow.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      istDateString: getISTDateString(),
      istWeekStart: getISTWeekStart(),
      istMonthStart: getISTMonthStart(),
      difference: `IST is UTC+05:30 (5 hours 30 minutes ahead of UTC)`
    },
    timestamp: new Date().toISOString()
  });
});


// Get all reservations (enhanced)
app.get('/api/reservations', (req, res) => {
  const { status, unitId, from, to, paymentStatus } = req.query;
  
  let filteredReservations = reservations;
  
  if (status) {
    filteredReservations = filteredReservations.filter(r => r.status === status);
  }
  
  if (paymentStatus) {
    filteredReservations = filteredReservations.filter(r => r.paymentStatus === paymentStatus);
  }
  
  if (unitId) {
    filteredReservations = filteredReservations.filter(r => r.unitId === unitId);
  }
  
  if (from) {
    filteredReservations = filteredReservations.filter(r => new Date(r.dates.checkIn) >= new Date(from));
  }
  
  if (to) {
    filteredReservations = filteredReservations.filter(r => new Date(r.dates.checkOut) <= new Date(to));
  }
  
  console.log(`📍 GET /api/reservations - Found ${filteredReservations.length} reservations`);
  
  res.json({
    success: true,
    data: filteredReservations,
    count: filteredReservations.length,
    timestamp: new Date().toISOString()
  });
});

// ===== INTEGRATION: MODIFY EXISTING RESERVATION UPDATE ENDPOINT =====
// REPLACE your existing app.put('/api/reservations/:reservationId', ...) endpoint (around line 573)
// with this enhanced version that auto-creates revenue entries
app.post('/api/reservations/:reservationId/advance-payment', (req, res) => {
  const { reservationId } = req.params;
  const { amount, paymentMethod = 'cash', notes } = req.body;
  
  if (!amount || amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid advance payment amount is required',
      timestamp: new Date().toISOString()
    });
  }
  
  const reservation = reservations.find(r => r.id === reservationId);
  
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
      timestamp: new Date().toISOString()
    });
  }
  
  if (reservation.paymentStatus !== 'not-paid') {
    return res.status(400).json({
      success: false,
      message: 'Can only accept advance payment for unpaid reservations',
      currentStatus: reservation.paymentStatus,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update reservation
  reservation.paymentStatus = 'advance-payment';
  reservation.lastUpdated = new Date().toISOString();
  
  // Create revenue entry
  const revenueEntry = {
    id: 'rev_adv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: 'accommodation',
    source: 'reservation',
    sourceId: reservationId,
    description: `${reservation.unitName || reservation.propertyId} - Advance Payment`,
    amount: parseFloat(amount),
    amountUSD: parseFloat(amount) / exchangeRate,
    currency: 'LKR',
    exchangeRate: exchangeRate,
    date: getISTDateString(), // Use IST date
    paymentMethod: paymentMethod,
    paymentStatus: 'completed',
    guestName: reservation.guestInfo?.bookerName || 'Unknown Guest',
    confirmationNumber: reservation.confirmationNumber,
    tags: ['accommodation', 'advance-payment', reservation.unitId || reservation.propertyId],
    notes: notes || `Advance payment received - Balance: LKR ${((reservation.pricing?.totalLKR || 0) - amount).toLocaleString()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  revenueEntries.push(revenueEntry);
  
  console.log(`💰 ADVANCE PAYMENT: LKR ${amount.toLocaleString()} for ${reservation.confirmationNumber}`);
  
  res.json({
    success: true,
    data: {
      reservation,
      revenueEntry,
      balanceRemaining: (reservation.pricing?.totalLKR || 0) - amount
    },
    message: 'Advance payment processed successfully',
    timestamp: new Date().toISOString()
  });
});
// Update reservation status and payment - ENHANCED WITH FINANCIAL INTEGRATION
app.put('/api/reservations/:reservationId', (req, res) => {
  const { reservationId } = req.params;
  const { 
    status, 
    paymentStatus, 
    specialRequests, 
    notes, 
    paymentAmount, 
    advanceAmount, // NEW: Support for advance payment amount
    paymentMethod = 'cash' 
  } = req.body;
  
  const reservationIndex = reservations.findIndex(r => r.id === reservationId);
  
  if (reservationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
      timestamp: new Date().toISOString()
    });
  }
  
  const reservation = reservations[reservationIndex];
  const previousPaymentStatus = reservation.paymentStatus;
  
  // Update fields
  if (status) reservation.status = status;
  if (paymentStatus) reservation.paymentStatus = paymentStatus;
  if (specialRequests) reservation.specialRequests = specialRequests;
  if (notes) reservation.notes = notes;
  
  reservation.lastUpdated = new Date().toISOString();
  
  // ENHANCED REVENUE MANAGEMENT
  let revenueEntry = null;
  let revenueAction = null;
  
  if (paymentStatus && paymentStatus !== previousPaymentStatus) {
    console.log(`💳 Payment status change: ${previousPaymentStatus} → ${paymentStatus} for ${reservation.confirmationNumber}`);
    
    // CASE 1: Payment received (not-paid → advance-payment or full-payment)
    if ((paymentStatus === 'full-payment' || paymentStatus === 'advance-payment') && 
        previousPaymentStatus === 'not-paid') {
      
      // Determine payment amount
      let amountToRecord = paymentAmount;
      if (!amountToRecord) {
        if (paymentStatus === 'full-payment') {
          amountToRecord = reservation.pricing?.totalLKR || reservation.totalAmount || 0;
        } else if (paymentStatus === 'advance-payment') {
          // Use provided advance amount or default to 50%
          amountToRecord = advanceAmount || (reservation.pricing?.totalLKR || reservation.totalAmount || 0) * 0.5;
        }
      }
      
      if (amountToRecord > 0) {
        // Check if revenue entry already exists
        const existingRevenue = revenueEntries.find(r => r.sourceId === reservationId);
        
        if (!existingRevenue) {
          // Create new revenue entry
          revenueEntry = {
            id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'accommodation',
            source: 'reservation',
            sourceId: reservationId,
            description: `${reservation.unitName || reservation.propertyId} - ${paymentStatus === 'advance-payment' ? 'Advance Payment' : 'Full Payment'}`,
            amount: parseFloat(amountToRecord),
            amountUSD: parseFloat(amountToRecord) / exchangeRate,
            currency: 'LKR',
            exchangeRate: exchangeRate,
            date: getISTDateString(), // Use IST date
            paymentMethod: paymentMethod,
            paymentStatus: 'completed',
            guestName: reservation.guestInfo?.bookerName || 'Unknown Guest',
            confirmationNumber: reservation.confirmationNumber,
            tags: ['accommodation', paymentStatus, reservation.unitId || reservation.propertyId],
            notes: `Auto-created from reservation ${paymentStatus.replace('_', ' ')} - Amount: LKR ${amountToRecord.toLocaleString()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          revenueEntries.push(revenueEntry);
          revenueAction = 'created';
          
          console.log(`💰 REVENUE CREATED: ${paymentStatus} - LKR ${amountToRecord.toLocaleString()} for ${reservation.confirmationNumber}`);
        }
      }
    }
    
    // CASE 2: Advance to Full Payment (advance-payment → full-payment)
    else if (paymentStatus === 'full-payment' && previousPaymentStatus === 'advance-payment') {
      const existingRevenue = revenueEntries.find(r => r.sourceId === reservationId);
      const totalAmount = reservation.pricing?.totalLKR || reservation.totalAmount || 0;
      
      if (existingRevenue) {
        const remainingAmount = totalAmount - existingRevenue.amount;
        
        if (remainingAmount > 0) {
          // Create balance payment entry
          const balanceRevenue = {
            id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: 'accommodation',
            source: 'reservation',
            sourceId: reservationId,
            description: `${reservation.unitName || reservation.propertyId} - Balance Payment`,
            amount: remainingAmount,
            amountUSD: remainingAmount / exchangeRate,
            currency: 'LKR',
            exchangeRate: exchangeRate,
            date: getISTDateString(), // Use IST date
            paymentMethod: paymentMethod,
            paymentStatus: 'completed',
            guestName: reservation.guestInfo?.bookerName || 'Unknown Guest',
            confirmationNumber: reservation.confirmationNumber,
            tags: ['accommodation', 'balance-payment', reservation.unitId || reservation.propertyId],
            notes: `Balance payment - Total: LKR ${totalAmount.toLocaleString()}, Advance: LKR ${existingRevenue.amount.toLocaleString()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          revenueEntries.push(balanceRevenue);
          revenueEntry = balanceRevenue;
          revenueAction = 'balance_created';
          
          // Update original entry description
          existingRevenue.description = `${reservation.unitName || reservation.propertyId} - Advance Payment`;
          existingRevenue.notes = `Advance payment - Full amount: LKR ${totalAmount.toLocaleString()}`;
          existingRevenue.updatedAt = new Date().toISOString();
          
          console.log(`💰 BALANCE PAYMENT: LKR ${remainingAmount.toLocaleString()} for ${reservation.confirmationNumber}`);
        }
      }
    }
    
    // CASE 3: Payment Cancellation/Refund (any paid status → not-paid)
    else if (paymentStatus === 'not-paid' && 
             (previousPaymentStatus === 'full-payment' || previousPaymentStatus === 'advance-payment')) {
      
      // Find and mark all revenue entries as refunded
      const existingRevenue = revenueEntries.filter(r => r.sourceId === reservationId);
      
      existingRevenue.forEach(revenue => {
        revenue.paymentStatus = 'refunded';
        revenue.notes = (revenue.notes || '') + `\n[REFUNDED: ${getISTDateString()}] - Reservation changed to not-paid`;
        revenue.updatedAt = new Date().toISOString();
      });
      
      if (existingRevenue.length > 0) {
        revenueAction = 'refunded';
        console.log(`🔄 REFUND: Marked ${existingRevenue.length} revenue entries as refunded for ${reservation.confirmationNumber}`);
      }
    }
  }
  
  // Log status changes
  if (status) {
    console.log(`📝 Reservation ${reservation.confirmationNumber} status updated to: ${status}`);
  }
  if (paymentStatus && paymentStatus !== previousPaymentStatus) {
    console.log(`💳 Reservation ${reservation.confirmationNumber} payment status: ${previousPaymentStatus} → ${paymentStatus}`);
  }
  
  // Prepare response
  const responseData = {
    reservation: reservation,
    revenueEntry: revenueEntry,
    revenueAction: revenueAction,
    changes: {
      statusChanged: status && status !== reservation.status,
      paymentStatusChanged: paymentStatus && paymentStatus !== previousPaymentStatus,
      revenueCreated: !!revenueEntry,
      revenueAction: revenueAction
    }
  };
  
  const message = revenueAction ? 
    `Reservation updated successfully and revenue ${revenueAction}` : 
    'Reservation updated successfully';
  
  res.json({
    success: true,
    data: responseData,
    message: message,
    timestamp: new Date().toISOString()
  });
});

// Get single reservation details - FIXED ROUTE
app.get('/api/reservations/:reservationId', (req, res) => {
  const { reservationId } = req.params;
  
  const reservation = reservations.find(r => r.id === reservationId);
  
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    success: true,
    data: reservation,
    timestamp: new Date().toISOString()
  });
});

// ===== MESSAGING SYSTEM ENDPOINTS =====

// Get all messages or filter by conversation
app.get('/api/messages', (req, res) => {
  const { conversationId, userId, type, unreadOnly } = req.query;
  
  let filteredMessages = messages;
  
  if (conversationId) {
    filteredMessages = filteredMessages.filter(m => m.conversationId === conversationId);
  }
  
  if (userId) {
    filteredMessages = filteredMessages.filter(m => 
      m.senderId === userId || m.receiverId === userId
    );
  }
  
  if (type) {
    filteredMessages = filteredMessages.filter(m => m.type === type);
  }
  
  if (unreadOnly === 'true') {
    filteredMessages = filteredMessages.filter(m => !m.read);
  }
  
  // Sort by newest first
  filteredMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  res.json({
    success: true,
    data: {
      total: filteredMessages.length,
      messages: filteredMessages
    },
    timestamp: new Date().toISOString()
  });
});

// Send a new message
app.post('/api/messages', (req, res) => {
  const {
    senderId,
    senderName,
    senderRole = 'staff',
    receiverId,
    receiverName,
    conversationId,
    subject,
    message,
    type = 'staff', // staff, guest, system, maintenance
    priority = 'normal', // low, normal, high, urgent
    attachments = [],
    reservationId
  } = req.body;
  
  if (!senderId || !message) {
    return res.status(400).json({
      success: false,
      message: 'senderId and message are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate conversation ID if not provided
  const actualConversationId = conversationId || 
    `conv_${senderId}_${receiverId || 'broadcast'}_${Date.now()}`;
  
  const newMessage = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    conversationId: actualConversationId,
    senderId,
    senderName,
    senderRole,
    receiverId: receiverId || null,
    receiverName: receiverName || null,
    subject: subject || null,
    message,
    type,
    priority,
    attachments,
    reservationId: reservationId || null,
    timestamp: new Date().toISOString(),
    read: false,
    delivered: true,
    edited: false,
    replies: []
  };
  
  messages.push(newMessage);
  
  console.log(`📨 New ${type} message from ${senderName}: ${message.substring(0, 50)}...`);
  
  res.status(201).json({
    success: true,
    data: newMessage,
    message: 'Message sent successfully',
    timestamp: new Date().toISOString()
  });
});

// Get conversations (grouped messages)
app.get('/api/messages/conversations', (req, res) => {
  const { userId, type } = req.query;
  
  let userMessages = messages;
  
  if (userId) {
    userMessages = userMessages.filter(m => 
      m.senderId === userId || m.receiverId === userId || !m.receiverId
    );
  }
  
  if (type) {
    userMessages = userMessages.filter(m => m.type === type);
  }
  
  // Group messages by conversation
  const conversationsMap = new Map();
  
  userMessages.forEach(message => {
    const convId = message.conversationId;
    
    if (!conversationsMap.has(convId)) {
      conversationsMap.set(convId, {
        conversationId: convId,
        participants: [],
        lastMessage: message,
        messageCount: 0,
        unreadCount: 0,
        type: message.type,
        priority: message.priority,
        reservationId: message.reservationId,
        createdAt: message.timestamp,
        updatedAt: message.timestamp
      });
    }
    
    const conversation = conversationsMap.get(convId);
    conversation.messageCount++;
    
    if (!message.read) {
      conversation.unreadCount++;
    }
    
    // Update last message if this one is newer
    if (new Date(message.timestamp) > new Date(conversation.lastMessage.timestamp)) {
      conversation.lastMessage = message;
      conversation.updatedAt = message.timestamp;
    }
    
    // Add participants
    if (message.senderId && !conversation.participants.find(p => p.id === message.senderId)) {
      conversation.participants.push({
        id: message.senderId,
        name: message.senderName,
        role: message.senderRole
      });
    }
    
    if (message.receiverId && !conversation.participants.find(p => p.id === message.receiverId)) {
      conversation.participants.push({
        id: message.receiverId,
        name: message.receiverName,
        role: 'staff' // Default
      });
    }
  });
  
  const conversations = Array.from(conversationsMap.values())
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  
  res.json({
    success: true,
    data: {
      total: conversations.length,
      conversations: conversations
    },
    timestamp: new Date().toISOString()
  });
});

// Mark messages as read - FIXED ROUTE
app.put('/api/messages/:messageId/read', (req, res) => {
  const { messageId } = req.params;
  const { userId } = req.body;
  
  const message = messages.find(m => m.id === messageId);
  
  if (!message) {
    return res.status(404).json({
      success: false,
      message: 'Message not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Only mark as read if user is receiver or it's a broadcast
  if (!message.receiverId || message.receiverId === userId) {
    message.read = true;
    message.readAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: message,
      message: 'Message marked as read',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(403).json({
      success: false,
      message: 'Not authorized to mark this message as read',
      timestamp: new Date().toISOString()
    });
  }
});

// Reply to a message - FIXED ROUTE
app.post('/api/messages/:messageId/reply', (req, res) => {
  const { messageId } = req.params;
  const {
    senderId,
    senderName,
    senderRole = 'staff',
    message: replyMessage,
    attachments = []
  } = req.body;
  
  const originalMessage = messages.find(m => m.id === messageId);

  if (!originalMessage) {
    return res.status(404).json({
      success: false,
      message: 'Original message not found',
      timestamp: new Date().toISOString()
    });
  }

  // Create reply
  const reply = {
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    senderId,
    senderName,
    senderRole,
    message: replyMessage,
    attachments,
    timestamp: new Date().toISOString(),
    isReply: true,
    parentMessageId: messageId
  };

  messages.push(reply);

  res.json({
    success: true,
    message: 'Reply sent successfully',
    data: reply,
    timestamp: new Date().toISOString()
  });
});

// ===== FINANCIAL REPORTS & CHARTS API ENDPOINTS =====
// Add these endpoints to your server.js after existing financial endpoints (around line 1400)

// Get comprehensive financial dashboard data for charts
app.get('/api/financial/dashboard-charts', (req, res) => {
  const { period = '6months' } = req.query;
  
  try {
    const now = new Date();
    let months = 6;
    
    switch (period) {
      case '3months': months = 3; break;
      case '6months': months = 6; break;
      case '12months': months = 12; break;
      case '24months': months = 24; break;
    }
    
    // Generate monthly data for the specified period
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthStart = monthDate.toISOString().split('T')[0];
      const monthEnd = new Date(nextMonth - 1).toISOString().split('T')[0];
      
      // Calculate monthly metrics
      const monthRevenue = revenueEntries.filter(r => 
        r.date >= monthStart && r.date <= monthEnd && r.paymentStatus === 'completed'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      const monthExpenses = financialExpenses.filter(e => 
        e.expenseDate >= monthStart && e.expenseDate <= monthEnd && 
        (e.status === 'approved' || e.status === 'paid')
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const monthReservations = reservations.filter(r => 
        r.dates?.checkIn >= monthStart && r.dates?.checkIn <= monthEnd
      ).length;
      
      monthlyData.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
        profitMargin: monthRevenue > 0 ? ((monthRevenue - monthExpenses) / monthRevenue * 100) : 0,
        reservations: monthReservations,
        averageRevenuePerReservation: monthReservations > 0 ? monthRevenue / monthReservations : 0
      });
    }
    
    // Revenue breakdown by type
    const revenueByType = {
      accommodation: revenueEntries.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
      services: revenueEntries.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
      other: revenueEntries.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0)
    };
    
    // Expense breakdown by category
    const expensesByCategory = {
      utilities: financialExpenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
      maintenance: financialExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
      supplies: financialExpenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0),
      staff: financialExpenses.filter(e => e.category === 'staff').reduce((sum, e) => sum + e.amount, 0),
      marketing: financialExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
      services: financialExpenses.filter(e => e.category === 'services').reduce((sum, e) => sum + e.amount, 0)
    };
    
    // Payment methods analysis
    const paymentMethods = {
      cash: revenueEntries.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.amount, 0),
      card: revenueEntries.filter(r => r.paymentMethod === 'card').reduce((sum, r) => sum + r.amount, 0),
      bank_transfer: revenueEntries.filter(r => r.paymentMethod === 'bank_transfer').reduce((sum, r) => sum + r.amount, 0),
      online: revenueEntries.filter(r => r.paymentMethod === 'online').reduce((sum, r) => sum + r.amount, 0)
    };
    
    // Occupancy vs Revenue correlation
    const occupancyData = monthlyData.map(month => ({
      month: month.month,
      occupancyRate: Math.min((month.reservations / 2) * 100, 100), // 2 units max
      revenue: month.revenue,
      revenuePerUnit: month.revenue / 2
    }));
    
    // Financial KPIs
    const totalRevenue = revenueEntries.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = financialExpenses.filter(e => e.status === 'paid' || e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
    const totalReservations = reservations.length;
    
    const kpis = {
      totalRevenue,
      totalExpenses,
      totalProfit: totalRevenue - totalExpenses,
      profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue * 100) : 0,
      averageRevenuePerReservation: totalReservations > 0 ? totalRevenue / totalReservations : 0,
      monthlyGrowthRate: monthlyData.length >= 2 ? 
        ((monthlyData[monthlyData.length - 1].revenue - monthlyData[monthlyData.length - 2].revenue) / 
         monthlyData[monthlyData.length - 2].revenue * 100) : 0,
      expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0
    };
    
    res.json({
      success: true,
      data: {
        period,
        monthlyData,
        revenueByType,
        expensesByCategory,
        paymentMethods,
        occupancyData,
        kpis,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Dashboard charts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard charts data',
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/financial/dashboard-comprehensive', (req, res) => {
  const { period = '6months', granularity = 'monthly' } = req.query;
  
  try {
    const now = new Date();
    let months = 6;
    
    switch (period) {
      case '3months': months = 3; break;
      case '6months': months = 6; break;
      case '12months': months = 12; break;
      case '24months': months = 24; break;
    }
    
    // Generate comprehensive monthly/weekly data
    const timeSeriesData = [];
    const increment = granularity === 'weekly' ? 7 : 30; // days
    const periods = granularity === 'weekly' ? Math.floor(months * 4.33) : months;
    
    for (let i = periods - 1; i >= 0; i--) {
      const periodEnd = new Date(now);
      periodEnd.setDate(now.getDate() - (i * increment));
      
      const periodStart = new Date(periodEnd);
      periodStart.setDate(periodEnd.getDate() - increment + 1);
      
      const startStr = periodStart.toISOString().split('T')[0];
      const endStr = periodEnd.toISOString().split('T')[0];
      
      // Calculate metrics for this period
      const periodRevenue = revenueEntries.filter(r => 
        r.date >= startStr && r.date <= endStr && r.paymentStatus === 'completed'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      const periodExpenses = financialExpenses.filter(e => 
        e.expenseDate >= startStr && e.expenseDate <= endStr && 
        (e.status === 'approved' || e.status === 'paid')
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const periodReservations = reservations.filter(r => 
        r.dates?.checkIn >= startStr && r.dates?.checkIn <= endStr
      ).length;
      
      const occupancyRate = Math.min((periodReservations / (2 * increment)) * 100, 100);
      
      timeSeriesData.push({
        period: granularity === 'weekly' ? 
          `Week ${periods - i}` : 
          periodStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: startStr,
        endDate: endStr,
        revenue: periodRevenue,
        expenses: periodExpenses,
        profit: periodRevenue - periodExpenses,
        profitMargin: periodRevenue > 0 ? ((periodRevenue - periodExpenses) / periodRevenue * 100) : 0,
        reservations: periodReservations,
        occupancyRate: occupancyRate,
        averageBookingValue: periodReservations > 0 ? periodRevenue / periodReservations : 0
      });
    }
    
    // Revenue breakdown by source
    const revenueBySource = {
      accommodation: revenueEntries.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
      services: revenueEntries.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
      other: revenueEntries.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0)
    };
    
    // Expense breakdown with detailed categories
    const expensesByCategory = {
      utilities: financialExpenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
      maintenance: financialExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
      supplies: financialExpenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0),
      staff: financialExpenses.filter(e => e.category === 'staff').reduce((sum, e) => sum + e.amount, 0),
      marketing: financialExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
      services: financialExpenses.filter(e => e.category === 'services').reduce((sum, e) => sum + e.amount, 0)
    };
    
    // Payment methods analysis
    const paymentMethodsBreakdown = {
      cash: revenueEntries.filter(r => r.paymentMethod === 'cash').reduce((sum, r) => sum + r.amount, 0),
      card: revenueEntries.filter(r => r.paymentMethod === 'card').reduce((sum, r) => sum + r.amount, 0),
      bank_transfer: revenueEntries.filter(r => r.paymentMethod === 'bank_transfer').reduce((sum, r) => sum + r.amount, 0),
      online: revenueEntries.filter(r => r.paymentMethod === 'online').reduce((sum, r) => sum + r.amount, 0)
    };
    
    // Performance KPIs
    const totalRevenue = revenueEntries.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = financialExpenses.filter(e => e.status === 'paid' || e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
    const totalProfit = totalRevenue - totalExpenses;
    
    const kpis = {
      totalRevenue,
      totalExpenses,
      totalProfit,
      profitMargin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0,
      totalBookings: reservations.length,
      averageBookingValue: reservations.length > 0 ? totalRevenue / reservations.length : 0,
      expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0,
      growthRate: timeSeriesData.length >= 2 ? 
        ((timeSeriesData[timeSeriesData.length - 1].revenue - timeSeriesData[timeSeriesData.length - 2].revenue) / 
         timeSeriesData[timeSeriesData.length - 2].revenue * 100) : 0
    };
    
    // Unit-wise performance
    const unitPerformance = halcyonRestUnits.map(unit => {
      const unitReservations = reservations.filter(r => r.unitId === unit.id);
      const unitRevenue = revenueEntries.filter(r => r.tags && r.tags.includes(unit.id)).reduce((sum, r) => sum + r.amount, 0);
      
      return {
        unitId: unit.id,
        unitName: unit.name,
        totalBookings: unitReservations.length,
        totalRevenue: unitRevenue,
        averageBookingValue: unitReservations.length > 0 ? unitRevenue / unitReservations.length : 0,
        occupancyRate: Math.min((unitReservations.length / (365 / 7)) * 100, 100), // Rough weekly occupancy
        lastBooking: unitReservations.length > 0 ? 
          unitReservations.sort((a, b) => new Date(b.dates.checkIn) - new Date(a.dates.checkIn))[0].dates.checkIn : null
      };
    });
    
    res.json({
      success: true,
      data: {
        period: { type: period, granularity, months },
        timeSeriesData,
        revenueBreakdown: {
          bySource: revenueBySource,
          byPaymentMethod: paymentMethodsBreakdown
        },
        expenseBreakdown: {
          byCategory: expensesByCategory
        },
        kpis,
        unitPerformance,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Comprehensive dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive dashboard data',
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/financial/profit-loss-interactive', (req, res) => {
  const { startDate, endDate, breakdown = 'category', compareWithPrevious = false } = req.query;
  
  try {
    const now = new Date();
    let calculatedStartDate, calculatedEndDate;
    
    if (startDate && endDate) {
      calculatedStartDate = startDate;
      calculatedEndDate = endDate;
    } else {
      calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      calculatedEndDate = now.toISOString().split('T')[0];
    }
    
    // Current period data
    const currentPeriodRevenue = revenueEntries.filter(r => 
      r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
    );
    
    const currentPeriodExpenses = financialExpenses.filter(e => 
      e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate && 
      (e.status === 'approved' || e.status === 'paid')
    );
    
    // Detailed revenue breakdown
    const revenueDetails = {
      accommodation: {
        total: currentPeriodRevenue.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
        transactions: currentPeriodRevenue.filter(r => r.type === 'accommodation').length,
        average: 0,
        breakdown: {}
      },
      services: {
        total: currentPeriodRevenue.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
        transactions: currentPeriodRevenue.filter(r => r.type === 'services').length,
        average: 0,
        breakdown: {}
      },
      other: {
        total: currentPeriodRevenue.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0),
        transactions: currentPeriodRevenue.filter(r => r.type === 'other').length,
        average: 0,
        breakdown: {}
      }
    };
    
    // Calculate averages
    Object.keys(revenueDetails).forEach(type => {
      revenueDetails[type].average = revenueDetails[type].transactions > 0 ? 
        revenueDetails[type].total / revenueDetails[type].transactions : 0;
    });
    
    // Detailed expense breakdown with subcategories
    const expenseDetails = {};
    const categories = ['utilities', 'maintenance', 'supplies', 'staff', 'marketing', 'services'];
    
    categories.forEach(category => {
      const categoryExpenses = currentPeriodExpenses.filter(e => e.category === category);
      const subcategories = {};
      
      categoryExpenses.forEach(expense => {
        if (expense.subcategory) {
          if (!subcategories[expense.subcategory]) {
            subcategories[expense.subcategory] = { total: 0, count: 0, items: [] };
          }
          subcategories[expense.subcategory].total += expense.amount;
          subcategories[expense.subcategory].count += 1;
          subcategories[expense.subcategory].items.push({
            description: expense.description,
            amount: expense.amount,
            vendor: expense.vendor,
            date: expense.expenseDate
          });
        }
      });
      
      expenseDetails[category] = {
        total: categoryExpenses.reduce((sum, e) => sum + e.amount, 0),
        transactions: categoryExpenses.length,
        average: categoryExpenses.length > 0 ? categoryExpenses.reduce((sum, e) => sum + e.amount, 0) / categoryExpenses.length : 0,
        subcategories: subcategories
      };
    });
    
    const totalRevenue = Object.values(revenueDetails).reduce((sum, r) => sum + r.total, 0);
    const totalExpenses = Object.values(expenseDetails).reduce((sum, e) => sum + e.total, 0);
    const grossProfit = totalRevenue - totalExpenses;
    
    // Comparison with previous period if requested
    let comparisonData = null;
    if (compareWithPrevious === 'true') {
      const periodLength = Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(calculatedStartDate);
      prevStartDate.setDate(prevStartDate.getDate() - periodLength);
      const prevEndDate = new Date(calculatedEndDate);
      prevEndDate.setDate(prevEndDate.getDate() - periodLength);
      
      const prevRevenue = revenueEntries.filter(r => 
        r.date >= prevStartDate.toISOString().split('T')[0] && 
        r.date <= prevEndDate.toISOString().split('T')[0] && 
        r.paymentStatus === 'completed'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      const prevExpenses = financialExpenses.filter(e => 
        e.expenseDate >= prevStartDate.toISOString().split('T')[0] && 
        e.expenseDate <= prevEndDate.toISOString().split('T')[0] && 
        (e.status === 'approved' || e.status === 'paid')
      ).reduce((sum, e) => sum + e.amount, 0);
      
      comparisonData = {
        previousPeriod: {
          startDate: prevStartDate.toISOString().split('T')[0],
          endDate: prevEndDate.toISOString().split('T')[0],
          revenue: prevRevenue,
          expenses: prevExpenses,
          profit: prevRevenue - prevExpenses
        },
        growth: {
          revenue: prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100) : 0,
          expenses: prevExpenses > 0 ? ((totalExpenses - prevExpenses) / prevExpenses * 100) : 0,
          profit: (prevRevenue - prevExpenses) !== 0 ? ((grossProfit - (prevRevenue - prevExpenses)) / Math.abs(prevRevenue - prevExpenses) * 100) : 0
        }
      };
    }
    
    const profitLossReport = {
      period: {
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        days: Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1
      },
      revenue: {
        details: revenueDetails,
        total: totalRevenue,
        totalUSD: totalRevenue / exchangeRate
      },
      expenses: {
        details: expenseDetails,
        total: totalExpenses,
        totalUSD: totalExpenses / exchangeRate
      },
      profitLoss: {
        grossProfit,
        grossProfitUSD: grossProfit / exchangeRate,
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0,
        netProfit: grossProfit, // Assuming no additional deductions
        netMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0
      },
      comparison: comparisonData,
      ratios: {
        expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0,
        profitPerDay: grossProfit / (Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1),
        revenuePerTransaction: currentPeriodRevenue.length > 0 ? totalRevenue / currentPeriodRevenue.length : 0
      }
    };
    
    console.log(`📊 Interactive P&L generated for ${calculatedStartDate} to ${calculatedEndDate}`);
    
    res.json({
      success: true,
      data: profitLossReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Interactive P&L report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate interactive P&L report',
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/financial/analytics-advanced', (req, res) => {
  const { period = '12months', includeForecasting = true } = req.query;
  
  try {
    const now = new Date();
    const months = period === '12months' ? 12 : period === '6months' ? 6 : 24;
    
    // Generate historical data for trend analysis
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const startStr = monthStart.toISOString().split('T')[0];
      const endStr = monthEnd.toISOString().split('T')[0];
      
      const monthRevenue = revenueEntries.filter(r => 
        r.date >= startStr && r.date <= endStr && r.paymentStatus === 'completed'
      ).reduce((sum, r) => sum + r.amount, 0);
      
      const monthExpenses = financialExpenses.filter(e => 
        e.expenseDate >= startStr && e.expenseDate <= endStr && 
        (e.status === 'approved' || e.status === 'paid')
      ).reduce((sum, e) => sum + e.amount, 0);
      
      const monthBookings = reservations.filter(r => 
        r.dates?.checkIn >= startStr && r.dates?.checkIn <= endStr
      ).length;
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        monthKey: `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`,
        revenue: monthRevenue,
        expenses: monthExpenses,
        profit: monthRevenue - monthExpenses,
        bookings: monthBookings,
        averageBookingValue: monthBookings > 0 ? monthRevenue / monthBookings : 0
      });
    }
    
    // Calculate trends and growth rates
    const trends = {
      revenue: { trend: 0, volatility: 0, seasonality: {} },
      expenses: { trend: 0, volatility: 0 },
      profit: { trend: 0, volatility: 0 },
      bookings: { trend: 0, volatility: 0 }
    };
    
    // Simple linear regression for trends
    Object.keys(trends).forEach(metric => {
      if (monthlyData.length >= 3) {
        const values = monthlyData.map(m => m[metric]);
        const n = values.length;
        const sumX = n * (n - 1) / 2; // 0+1+2+...+(n-1)
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
        const sumX2 = n * (n - 1) * (2 * n - 1) / 6; // 0²+1²+2²+...+(n-1)²
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        trends[metric].trend = slope;
        
        // Calculate volatility (standard deviation)
        const mean = sumY / n;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        trends[metric].volatility = Math.sqrt(variance);
      }
    });
    
    // Seasonal analysis for revenue
    const seasonalData = {};
    monthlyData.forEach(month => {
      const monthNum = new Date(month.monthKey + '-01').getMonth() + 1;
      if (!seasonalData[monthNum]) {
        seasonalData[monthNum] = { revenue: [], count: 0 };
      }
      seasonalData[monthNum].revenue.push(month.revenue);
      seasonalData[monthNum].count++;
    });
    
    Object.keys(seasonalData).forEach(month => {
      const monthData = seasonalData[month];
      trends.revenue.seasonality[month] = {
        averageRevenue: monthData.revenue.reduce((sum, val) => sum + val, 0) / monthData.count,
        count: monthData.count
      };
    });
    
    // Simple forecasting if enabled
    let forecastData = null;
    if (includeForecasting === 'true' && monthlyData.length >= 6) {
      const forecastMonths = 3;
      forecastData = [];
      
      for (let i = 1; i <= forecastMonths; i++) {
        const forecastMonth = new Date(now.getFullYear(), now.getMonth() + i, 1);
        
        // Simple linear extrapolation
        const forecastRevenue = monthlyData[monthlyData.length - 1].revenue + (trends.revenue.trend * i);
        const forecastExpenses = monthlyData[monthlyData.length - 1].expenses + (trends.expenses.trend * i);
        
        forecastData.push({
          month: forecastMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          forecastRevenue: Math.max(0, forecastRevenue),
          forecastExpenses: Math.max(0, forecastExpenses),
          forecastProfit: forecastRevenue - forecastExpenses,
          confidence: Math.max(0.5, 1 - (i * 0.2)) // Decreasing confidence
        });
      }
    }
    
    // Performance metrics
    const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalBookings = monthlyData.reduce((sum, m) => sum + m.bookings, 0);
    
    const analytics = {
      period: { type: period, months },
      historicalData: monthlyData,
      trends,
      forecast: forecastData,
      summary: {
        totalRevenue,
        totalExpenses,
        totalProfit: totalRevenue - totalExpenses,
        totalBookings,
        averageMonthlyRevenue: totalRevenue / monthlyData.length,
        averageMonthlyProfit: (totalRevenue - totalExpenses) / monthlyData.length,
        profitMarginTrend: trends.profit.trend,
        seasonalityIndex: Object.keys(trends.revenue.seasonality).length > 0 ? 
          Math.max(...Object.values(trends.revenue.seasonality).map(s => s.averageRevenue)) / 
          Math.min(...Object.values(trends.revenue.seasonality).map(s => s.averageRevenue)) : 1
      },
      insights: {
        strongestMonth: Object.entries(trends.revenue.seasonality).reduce((max, [month, data]) => 
          data.averageRevenue > (max.averageRevenue || 0) ? { month, ...data } : max, {}),
        revenueGrowthRate: trends.revenue.trend > 0 ? 'Positive' : trends.revenue.trend < 0 ? 'Negative' : 'Stable',
        expenseControl: trends.expenses.trend < trends.revenue.trend ? 'Good' : 'Needs Attention',
        volatilityRisk: trends.revenue.volatility > (totalRevenue / monthlyData.length * 0.3) ? 'High' : 'Low'
      }
    };
    
    console.log(`📈 Advanced analytics generated for ${period} with ${forecastData ? 'forecasting' : 'no forecasting'}`);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Advanced analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate advanced analytics',
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/financial/export/:reportType/:format', (req, res) => {
  const { reportType, format } = req.params;
  const { startDate, endDate, includeCharts = false } = req.query;
  
  try {
    const now = new Date();
    let calculatedStartDate, calculatedEndDate;
    
    if (startDate && endDate) {
      calculatedStartDate = startDate;
      calculatedEndDate = endDate;
    } else {
      calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      calculatedEndDate = now.toISOString().split('T')[0];
    }
    
    let exportData = '';
    let filename = '';
    let contentType = '';
    
    if (format === 'csv') {
      contentType = 'text/csv';
      
      if (reportType === 'comprehensive') {
        // Comprehensive financial report
        const revenue = revenueEntries.filter(r => 
          r.date >= calculatedStartDate && r.date <= calculatedEndDate
        );
        const expenses = financialExpenses.filter(e => 
          e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate
        );
        
        exportData = 'Type,Date,Description,Category,Amount (LKR),Amount (USD),Payment Method,Status,Vendor\n';
        
        revenue.forEach(r => {
          exportData += `Revenue,${r.date},"${r.description}",${r.type},${r.amount},${(r.amount / exchangeRate).toFixed(2)},${r.paymentMethod},${r.paymentStatus},""\n`;
        });
        
        expenses.forEach(e => {
          exportData += `Expense,${e.expenseDate},"${e.description}",${e.category},${e.amount},${(e.amount / exchangeRate).toFixed(2)},${e.paymentMethod},${e.status},"${e.vendor}"\n`;
        });
        
        filename = `comprehensive_financial_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
        
      } else if (reportType === 'profit-loss') {
        // P&L Statement
        const financialSummary = calculateFinancialSummary(calculatedStartDate, calculatedEndDate);
        
        exportData = 'Category,Item,Amount (LKR),Amount (USD),Percentage of Total\n';
        exportData += `Revenue,Total Revenue,${financialSummary.revenue.total},${(financialSummary.revenue.total / exchangeRate).toFixed(2)},100.00\n`;
        exportData += `Revenue,Accommodation,${financialSummary.revenue.byType.accommodation},${(financialSummary.revenue.byType.accommodation / exchangeRate).toFixed(2)},${((financialSummary.revenue.byType.accommodation / financialSummary.revenue.total) * 100).toFixed(2)}\n`;
        exportData += `Revenue,Services,${financialSummary.revenue.byType.services},${(financialSummary.revenue.byType.services / exchangeRate).toFixed(2)},${((financialSummary.revenue.byType.services / financialSummary.revenue.total) * 100).toFixed(2)}\n`;
        exportData += `Revenue,Other,${financialSummary.revenue.byType.other},${(financialSummary.revenue.byType.other / exchangeRate).toFixed(2)},${((financialSummary.revenue.byType.other / financialSummary.revenue.total) * 100).toFixed(2)}\n`;
        
        exportData += `Expenses,Total Expenses,${financialSummary.expenses.total},${(financialSummary.expenses.total / exchangeRate).toFixed(2)},100.00\n`;
        Object.entries(financialSummary.expenses.byCategory).forEach(([category, amount]) => {
          exportData += `Expenses,${category},${amount},${(amount / exchangeRate).toFixed(2)},${((amount / financialSummary.expenses.total) * 100).toFixed(2)}\n`;
        });
        
        exportData += `Profit,Gross Profit,${financialSummary.profit.gross},${(financialSummary.profit.gross / exchangeRate).toFixed(2)},${financialSummary.profit.margin}\n`;
        
        filename = `profit_loss_statement_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
        
      } else if (reportType === 'cash-flow') {
        // Cash flow report
        const dailyCashFlow = {};
        
        // Initialize dates
        const start = new Date(calculatedStartDate);
        const end = new Date(calculatedEndDate);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          dailyCashFlow[dateStr] = { inflow: 0, outflow: 0, net: 0 };
        }
        
        // Add revenue (inflows)
        revenueEntries.filter(r => 
          r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
        ).forEach(r => {
          if (dailyCashFlow[r.date]) {
            dailyCashFlow[r.date].inflow += r.amount;
          }
        });
        
        // Add expenses (outflows)
        financialExpenses.filter(e => 
          e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate && e.status === 'paid'
        ).forEach(e => {
          if (dailyCashFlow[e.expenseDate]) {
            dailyCashFlow[e.expenseDate].outflow += e.amount;
          }
        });
        
        // Calculate net flow
        Object.keys(dailyCashFlow).forEach(date => {
          dailyCashFlow[date].net = dailyCashFlow[date].inflow - dailyCashFlow[date].outflow;
        });
        
        exportData = 'Date,Cash Inflow (LKR),Cash Outflow (LKR),Net Cash Flow (LKR),Cash Inflow (USD),Cash Outflow (USD),Net Cash Flow (USD)\n';
        Object.entries(dailyCashFlow).sort().forEach(([date, flow]) => {
          exportData += `${date},${flow.inflow},${flow.outflow},${flow.net},${(flow.inflow / exchangeRate).toFixed(2)},${(flow.outflow / exchangeRate).toFixed(2)},${(flow.net / exchangeRate).toFixed(2)}\n`;
        });
        
        filename = `cash_flow_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
      }
      
    } else if (format === 'json') {
      contentType = 'application/json';
      
      // Generate comprehensive JSON export
      const revenue = revenueEntries.filter(r => 
        r.date >= calculatedStartDate && r.date <= calculatedEndDate
      );
      const expenses = financialExpenses.filter(e => 
        e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate
      );
      const financialSummary = calculateFinancialSummary(calculatedStartDate, calculatedEndDate);
      
      const jsonData = {
        exportInfo: {
          reportType,
          period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
          exportDate: new Date().toISOString(),
          exchangeRate
        },
        summary: financialSummary,
        detailedData: {
          revenue,
          expenses,
          reservations: reservations.filter(r => 
            r.dates?.checkIn >= calculatedStartDate && r.dates?.checkIn <= calculatedEndDate
          )
        }
      };
      
      exportData = JSON.stringify(jsonData, null, 2);
      filename = `financial_data_${calculatedStartDate}_to_${calculatedEndDate}.json`;
      
    } else if (format === 'excel') {
      // For Excel format, we'll return structured data that can be converted to Excel on frontend
      contentType = 'application/json';
      
      const revenue = revenueEntries.filter(r => 
        r.date >= calculatedStartDate && r.date <= calculatedEndDate
      );
      const expenses = financialExpenses.filter(e => 
        e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate
      );
      
      const excelData = {
        sheets: {
          Summary: {
            headers: ['Metric', 'Amount (LKR)', 'Amount (USD)', 'Percentage'],
            data: [
              ['Total Revenue', revenue.reduce((sum, r) => sum + r.amount, 0), (revenue.reduce((sum, r) => sum + r.amount, 0) / exchangeRate).toFixed(2), '100.00'],
              ['Total Expenses', expenses.reduce((sum, e) => sum + e.amount, 0), (expenses.reduce((sum, e) => sum + e.amount, 0) / exchangeRate).toFixed(2), '100.00'],
              ['Net Profit', revenue.reduce((sum, r) => sum + r.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0), ((revenue.reduce((sum, r) => sum + r.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)) / exchangeRate).toFixed(2), ((revenue.reduce((sum, r) => sum + r.amount, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)) / revenue.reduce((sum, r) => sum + r.amount, 0) * 100).toFixed(2)]
            ]
          },
          Revenue: {
            headers: ['Date', 'Description', 'Type', 'Amount (LKR)', 'Amount (USD)', 'Payment Method', 'Guest Name', 'Status'],
            data: revenue.map(r => [
              r.date,
              r.description,
              r.type,
              r.amount,
              (r.amount / exchangeRate).toFixed(2),
              r.paymentMethod,
              r.guestName || '',
              r.paymentStatus
            ])
          },
          Expenses: {
            headers: ['Date', 'Description', 'Category', 'Vendor', 'Amount (LKR)', 'Amount (USD)', 'Status', 'Invoice Number'],
            data: expenses.map(e => [
              e.expenseDate,
              e.description,
              e.category,
              e.vendor,
              e.amount,
              (e.amount / exchangeRate).toFixed(2),
              e.status,
              e.invoiceNumber
            ])
          }
        },
        filename: `financial_report_${calculatedStartDate}_to_${calculatedEndDate}.xlsx`
      };
      
      exportData = JSON.stringify(excelData, null, 2);
      filename = `financial_report_${calculatedStartDate}_to_${calculatedEndDate}.json`;
    }
    
    console.log(`📄 Exporting ${reportType} report as ${format.toUpperCase()}`);
    
    if (format === 'csv') {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exportData);
    } else {
      res.json({
        success: true,
        data: format === 'excel' ? JSON.parse(exportData) : exportData,
        filename,
        contentType,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/financial/realtime-metrics', (req, res) => {
  try {
    const istToday = getISTDate();
    const todayStr = getISTDateString();
    const thisWeek = getISTWeekStart();
    const thisMonth = getISTMonthStart();
    
    console.log('⚡ Real-time metrics - IST Today:', todayStr);
    
    // Today's metrics - FIXED FOR IST
    const todayRevenue = revenueEntries.filter(r => {
      const isToday = r.date === todayStr;
      const isCompleted = r.paymentStatus === 'completed';
      console.log(`Revenue check: ${r.id}, date=${r.date}, today=${todayStr}, match=${isToday}, status=${r.paymentStatus}`);
      return isToday && isCompleted;
    }).reduce((sum, r) => sum + r.amount, 0);
    
    const todayExpenses = financialExpenses.filter(e => {
      const isToday = e.expenseDate === todayStr;
      const isPaid = e.status === 'paid';
      console.log(`Expense check: ${e.id}, date=${e.expenseDate}, today=${todayStr}, match=${isToday}, status=${e.status}`);
      return isToday && isPaid;
    }).reduce((sum, e) => sum + e.amount, 0);
    
    // This week's metrics - FIXED FOR IST
    const weekRevenue = revenueEntries.filter(r => 
      r.date >= thisWeek && r.paymentStatus === 'completed'
    ).reduce((sum, r) => sum + r.amount, 0);
    
    const weekExpenses = financialExpenses.filter(e => 
      e.expenseDate >= thisWeek && e.status === 'paid'
    ).reduce((sum, e) => sum + e.amount, 0);
    
    // This month's metrics - FIXED FOR IST
    const monthRevenue = revenueEntries.filter(r => 
      r.date >= thisMonth && r.paymentStatus === 'completed'
    ).reduce((sum, r) => sum + r.amount, 0);
    
    const monthExpenses = financialExpenses.filter(e => 
      e.expenseDate >= thisMonth && (e.status === 'paid' || e.status === 'approved')
    ).reduce((sum, e) => sum + e.amount, 0);
    
    // Pending items that need attention
    const pendingRevenue = revenueEntries.filter(r => r.paymentStatus === 'pending').reduce((sum, r) => sum + r.amount, 0);
    const pendingExpenses = financialExpenses.filter(e => e.status === 'pending');
    const overdueInvoices = financialExpenses.filter(e => 
      e.status === 'approved' && 
      e.nextDueDate && 
      new Date(e.nextDueDate) < istToday
    );
    
    // Current cash position (simplified)
    const totalCashIn = revenueEntries.filter(r => r.paymentStatus === 'completed').reduce((sum, r) => sum + r.amount, 0);
    const totalCashOut = financialExpenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + e.amount, 0);
    const currentCashPosition = totalCashIn - totalCashOut;
    
    // Recent transactions (last 5)
    const recentTransactions = [
      ...revenueEntries.slice(-3).map(r => ({
        type: 'revenue',
        date: r.date,
        description: r.description,
        amount: r.amount,
        status: r.paymentStatus
      })),
      ...financialExpenses.slice(-2).map(e => ({
        type: 'expense',
        date: e.expenseDate,
        description: e.description,
        amount: -e.amount,
        status: e.status
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    
    const metrics = {
      today: {
        revenue: todayRevenue,
        expenses: todayExpenses,
        netCashFlow: todayRevenue - todayExpenses,
        transactionCount: revenueEntries.filter(r => r.date === todayStr).length + 
                         financialExpenses.filter(e => e.expenseDate === todayStr).length
      },
      thisWeek: {
        revenue: weekRevenue,
        expenses: weekExpenses,
        netCashFlow: weekRevenue - weekExpenses,
        profitMargin: weekRevenue > 0 ? ((weekRevenue - weekExpenses) / weekRevenue * 100) : 0
      },
      thisMonth: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        netCashFlow: monthRevenue - monthExpenses,
        profitMargin: monthRevenue > 0 ? ((monthRevenue - monthExpenses) / monthRevenue * 100) : 0
      },
      alerts: {
        pendingRevenueAmount: pendingRevenue,
        pendingExpenseCount: pendingExpenses.length,
        pendingExpenseAmount: pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
        overdueInvoiceCount: overdueInvoices.length,
        lowCashWarning: currentCashPosition < 100000 // LKR 100k threshold
      },
      cashPosition: {
        current: currentCashPosition,
        projected30Days: currentCashPosition + (monthRevenue * 1.1) - (monthExpenses * 1.1), // Simple projection
        lastUpdated: new Date().toISOString()
      },
      recentActivity: recentTransactions,
      debugInfo: {
        istToday: todayStr,
        weekStart: thisWeek,
        monthStart: thisMonth,
        timezone: 'Asia/Kolkata (IST)'
      }
    };
    
    console.log(`⚡ Real-time metrics generated: Today Revenue=${todayRevenue}, Today Expenses=${todayExpenses}`);
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time metrics',
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/financial/goals', (req, res) => {
  try {
    // Mock financial goals - in a real app, these would be stored in database
    const financialGoals = {
      monthly: {
        revenue: 500000, // LKR 500k
        expenses: 300000, // LKR 300k
        profit: 200000,  // LKR 200k
        bookings: 15
      },
      quarterly: {
        revenue: 1500000,
        expenses: 900000,
        profit: 600000,
        bookings: 45
      },
      yearly: {
        revenue: 6000000,
        expenses: 3600000,
        profit: 2400000,
        bookings: 180
      }
    };
    
    // Calculate current progress
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    
    const monthlyActual = calculateFinancialSummary(thisMonth, todayStr);
    
    const progress = {
      monthly: {
        revenue: {
          target: financialGoals.monthly.revenue,
          actual: monthlyActual.revenue.total,
          percentage: (monthlyActual.revenue.total / financialGoals.monthly.revenue * 100).toFixed(1),
          remaining: financialGoals.monthly.revenue - monthlyActual.revenue.total
        },
        expenses: {
          target: financialGoals.monthly.expenses,
          actual: monthlyActual.expenses.total,
          percentage: (monthlyActual.expenses.total / financialGoals.monthly.expenses * 100).toFixed(1),
          remaining: financialGoals.monthly.expenses - monthlyActual.expenses.total
        },
        profit: {
          target: financialGoals.monthly.profit,
          actual: monthlyActual.profit.gross,
          percentage: (monthlyActual.profit.gross / financialGoals.monthly.profit * 100).toFixed(1),
          remaining: financialGoals.monthly.profit - monthlyActual.profit.gross
        }
      }
    };
    
    res.json({
      success: true,
      data: {
        goals: financialGoals,
        progress,
        lastUpdated: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Financial goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load financial goals',
      timestamp: new Date().toISOString()
    });
  }
});
app.put('/api/financial/goals', (req, res) => {
  const { period, goals } = req.body;
  
  if (!period || !goals) {
    return res.status(400).json({
      success: false,
      message: 'Period and goals are required',
      timestamp: new Date().toISOString()
    });
  }
  
  // In a real application, you would save this to the database
  // For now, we'll just return success
  console.log(`📊 Updated ${period} financial goals:`, goals);
  
  res.json({
    success: true,
    data: {
      period,
      updatedGoals: goals,
      message: `${period} financial goals updated successfully`
    },
    timestamp: new Date().toISOString()
  });
});
console.log('📊 Enhanced Financial Reports Dashboard API endpoints loaded');
console.log('🎯 New endpoints available:');
console.log('   📈 GET /api/financial/dashboard-comprehensive - Full dashboard data');
console.log('   📊 GET /api/financial/profit-loss-interactive - Interactive P&L with drill-down');
console.log('   🔮 GET /api/financial/analytics-advanced - Advanced analytics with forecasting');
console.log('   📄 GET /api/financial/export/:reportType/:format - Export reports (CSV/JSON/Excel)');
console.log('   ⚡ GET /api/financial/realtime-metrics - Real-time financial metrics');
console.log('   🎯 GET /api/financial/goals - Financial goals and progress');
console.log('   ✏️ PUT /api/financial/goals - Update financial goals');

// Get detailed profit & loss report with categories
app.get('/api/financial/profit-loss-detailed', (req, res) => {
  const { startDate, endDate, format = 'summary' } = req.query;
  
  try {
    const now = new Date();
    let calculatedStartDate, calculatedEndDate;
    
    if (startDate && endDate) {
      calculatedStartDate = startDate;
      calculatedEndDate = endDate;
    } else {
      // Default to current month
      calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      calculatedEndDate = now.toISOString().split('T')[0];
    }
    
    // Get revenue for period
    const periodRevenue = revenueEntries.filter(r => 
      r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
    );
    
    // Get expenses for period
    const periodExpenses = financialExpenses.filter(e => 
      e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate && 
      (e.status === 'approved' || e.status === 'paid')
    );
    
    // Revenue breakdown
    const revenueBreakdown = {
      accommodation: {
        amount: periodRevenue.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0),
        count: periodRevenue.filter(r => r.type === 'accommodation').length
      },
      services: {
        amount: periodRevenue.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0),
        count: periodRevenue.filter(r => r.type === 'services').length
      },
      other: {
        amount: periodRevenue.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0),
        count: periodRevenue.filter(r => r.type === 'other').length
      }
    };
    
    // Expense breakdown with subcategories
    const expenseBreakdown = {
      utilities: {
        amount: periodExpenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'utilities').length,
        subcategories: {}
      },
      maintenance: {
        amount: periodExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'maintenance').length,
        subcategories: {}
      },
      supplies: {
        amount: periodExpenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'supplies').length,
        subcategories: {}
      },
      staff: {
        amount: periodExpenses.filter(e => e.category === 'staff').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'staff').length,
        subcategories: {}
      },
      marketing: {
        amount: periodExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'marketing').length,
        subcategories: {}
      },
      services: {
        amount: periodExpenses.filter(e => e.category === 'services').reduce((sum, e) => sum + e.amount, 0),
        count: periodExpenses.filter(e => e.category === 'services').length,
        subcategories: {}
      }
    };
    
    // Calculate subcategories
    Object.keys(expenseBreakdown).forEach(category => {
      const categoryExpenses = periodExpenses.filter(e => e.category === category);
      const subcategories = {};
      
      categoryExpenses.forEach(expense => {
        if (expense.subcategory) {
          if (!subcategories[expense.subcategory]) {
            subcategories[expense.subcategory] = { amount: 0, count: 0 };
          }
          subcategories[expense.subcategory].amount += expense.amount;
          subcategories[expense.subcategory].count += 1;
        }
      });
      
      expenseBreakdown[category].subcategories = subcategories;
    });
    
    const totalRevenue = Object.values(revenueBreakdown).reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = Object.values(expenseBreakdown).reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalRevenue - totalExpenses;
    
    // Calculate margins for each category
    Object.keys(revenueBreakdown).forEach(type => {
      revenueBreakdown[type].percentage = totalRevenue > 0 ? 
        (revenueBreakdown[type].amount / totalRevenue * 100) : 0;
    });
    
    Object.keys(expenseBreakdown).forEach(category => {
      expenseBreakdown[category].percentage = totalExpenses > 0 ? 
        (expenseBreakdown[category].amount / totalExpenses * 100) : 0;
    });
    
    const profitLossReport = {
      period: {
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        days: Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1
      },
      revenue: {
        breakdown: revenueBreakdown,
        total: totalRevenue,
        totalUSD: totalRevenue / exchangeRate,
        count: periodRevenue.length
      },
      expenses: {
        breakdown: expenseBreakdown,
        total: totalExpenses,
        totalUSD: totalExpenses / exchangeRate,
        count: periodExpenses.length
      },
      profitLoss: {
        grossProfit,
        grossProfitUSD: grossProfit / exchangeRate,
        grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0,
        revenueGrowth: 0, // Would need historical data
        expenseRatio: totalRevenue > 0 ? (totalExpenses / totalRevenue * 100) : 0
      },
      metrics: {
        averageDailyRevenue: totalRevenue / (Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1),
        averageDailyExpenses: totalExpenses / (Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1),
        revenuePerTransaction: periodRevenue.length > 0 ? totalRevenue / periodRevenue.length : 0,
        expensePerTransaction: periodExpenses.length > 0 ? totalExpenses / periodExpenses.length : 0
      }
    };
    
    console.log(`📊 Detailed P&L generated for ${calculatedStartDate} to ${calculatedEndDate}`);
    
    res.json({
      success: true,
      data: profitLossReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('P&L detailed report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate detailed P&L report',
      timestamp: new Date().toISOString()
    });
  }
});

// Get cash flow analysis with daily breakdown
app.get('/api/financial/cash-flow-analysis', (req, res) => {
  const { startDate, endDate, granularity = 'daily' } = req.query;
  
  try {
    const now = new Date();
    let calculatedStartDate, calculatedEndDate;
    
    if (startDate && endDate) {
      calculatedStartDate = startDate;
      calculatedEndDate = endDate;
    } else {
      // Default to last 30 days
      calculatedStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      calculatedEndDate = now.toISOString().split('T')[0];
    }
    
    const periodRevenue = revenueEntries.filter(r => 
      r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
    );
    
    const periodExpenses = financialExpenses.filter(e => 
      e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate && e.status === 'paid'
    );
    
    // Generate daily cash flow
    const dailyCashFlow = {};
    const start = new Date(calculatedStartDate);
    const end = new Date(calculatedEndDate);
    
    // Initialize all dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyCashFlow[dateStr] = {
        date: dateStr,
        inflow: 0,
        outflow: 0,
        netFlow: 0,
        runningBalance: 0,
        transactions: {
          revenue: [],
          expenses: []
        }
      };
    }
    
    // Add revenue
    periodRevenue.forEach(revenue => {
      if (dailyCashFlow[revenue.date]) {
        dailyCashFlow[revenue.date].inflow += revenue.amount;
        dailyCashFlow[revenue.date].transactions.revenue.push({
          id: revenue.id,
          description: revenue.description,
          amount: revenue.amount,
          type: revenue.type
        });
      }
    });
    
    // Add expenses
    periodExpenses.forEach(expense => {
      if (dailyCashFlow[expense.expenseDate]) {
        dailyCashFlow[expense.expenseDate].outflow += expense.amount;
        dailyCashFlow[expense.expenseDate].transactions.expenses.push({
          id: expense.id,
          description: expense.description,
          amount: expense.amount,
          category: expense.category
        });
      }
    });
    
    // Calculate net flow and running balance
    let runningBalance = 0;
    Object.keys(dailyCashFlow).sort().forEach(date => {
      const day = dailyCashFlow[date];
      day.netFlow = day.inflow - day.outflow;
      runningBalance += day.netFlow;
      day.runningBalance = runningBalance;
    });
    
    const cashFlowArray = Object.values(dailyCashFlow).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Summary statistics
    const totalInflow = cashFlowArray.reduce((sum, day) => sum + day.inflow, 0);
    const totalOutflow = cashFlowArray.reduce((sum, day) => sum + day.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;
    
    const summary = {
      totalInflow,
      totalOutflow,
      netCashFlow,
      averageDailyInflow: totalInflow / cashFlowArray.length,
      averageDailyOutflow: totalOutflow / cashFlowArray.length,
      averageNetDaily: netCashFlow / cashFlowArray.length,
      cashFlowRatio: totalOutflow > 0 ? totalInflow / totalOutflow : 0,
      daysWithPositiveFlow: cashFlowArray.filter(day => day.netFlow > 0).length,
      daysWithNegativeFlow: cashFlowArray.filter(day => day.netFlow < 0).length,
      bestDay: cashFlowArray.reduce((max, day) => day.netFlow > max.netFlow ? day : max, cashFlowArray[0]),
      worstDay: cashFlowArray.reduce((min, day) => day.netFlow < min.netFlow ? day : min, cashFlowArray[0])
    };
    
    console.log(`📈 Cash flow analysis generated: Net flow LKR ${netCashFlow.toLocaleString()}`);
    
    res.json({
      success: true,
      data: {
        period: {
          startDate: calculatedStartDate,
          endDate: calculatedEndDate,
          days: cashFlowArray.length
        },
        dailyCashFlow: cashFlowArray,
        summary,
        granularity
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cash flow analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate cash flow analysis',
      timestamp: new Date().toISOString()
    });
  }
});

// Export financial report (CSV format for now)
app.get('/api/financial/export/:reportType', (req, res) => {
  const { reportType } = req.params;
  const { startDate, endDate, format = 'csv' } = req.query;
  
  try {
    const now = new Date();
    let calculatedStartDate, calculatedEndDate;
    
    if (startDate && endDate) {
      calculatedStartDate = startDate;
      calculatedEndDate = endDate;
    } else {
      calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      calculatedEndDate = now.toISOString().split('T')[0];
    }
    
    let csvContent = '';
    let filename = '';
    
    if (reportType === 'revenue') {
      const periodRevenue = revenueEntries.filter(r => 
        r.date >= calculatedStartDate && r.date <= calculatedEndDate
      );
      
      csvContent = 'Date,Description,Type,Amount (LKR),Amount (USD),Payment Method,Guest Name,Status\n';
      periodRevenue.forEach(r => {
        csvContent += `${r.date},"${r.description}",${r.type},${r.amount},${r.amountUSD || 0},${r.paymentMethod},"${r.guestName || ''}",${r.paymentStatus}\n`;
      });
      filename = `revenue_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
      
    } else if (reportType === 'expenses') {
      const periodExpenses = financialExpenses.filter(e => 
        e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate
      );
      
      csvContent = 'Date,Description,Category,Subcategory,Vendor,Amount (LKR),Amount (USD),Status,Invoice Number\n';
      periodExpenses.forEach(e => {
        csvContent += `${e.expenseDate},"${e.description}",${e.category},"${e.subcategory || ''}","${e.vendor}",${e.amount},${e.amountUSD || 0},${e.status},"${e.invoiceNumber}"\n`;
      });
      filename = `expenses_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
      
    } else if (reportType === 'profit-loss') {
      const financialSummary = calculateFinancialSummary(calculatedStartDate, calculatedEndDate);
      
      csvContent = 'Category,Type,Amount (LKR),Amount (USD),Percentage\n';
      csvContent += `Total Revenue,Revenue,${financialSummary.revenue.total},${financialSummary.revenue.totalUSD},100.0\n`;
      csvContent += `Accommodation Revenue,Revenue,${financialSummary.revenue.byType.accommodation},${financialSummary.revenue.byType.accommodation / exchangeRate},${financialSummary.revenue.total > 0 ? (financialSummary.revenue.byType.accommodation / financialSummary.revenue.total * 100).toFixed(2) : 0}\n`;
      csvContent += `Services Revenue,Revenue,${financialSummary.revenue.byType.services},${financialSummary.revenue.byType.services / exchangeRate},${financialSummary.revenue.total > 0 ? (financialSummary.revenue.byType.services / financialSummary.revenue.total * 100).toFixed(2) : 0}\n`;
      csvContent += `Other Revenue,Revenue,${financialSummary.revenue.byType.other},${financialSummary.revenue.byType.other / exchangeRate},${financialSummary.revenue.total > 0 ? (financialSummary.revenue.byType.other / financialSummary.revenue.total * 100).toFixed(2) : 0}\n`;
      csvContent += `Total Expenses,Expense,${financialSummary.expenses.total},${financialSummary.expenses.totalUSD},100.0\n`;
      Object.entries(financialSummary.expenses.byCategory).forEach(([category, amount]) => {
        csvContent += `${category} Expenses,Expense,${amount},${amount / exchangeRate},${financialSummary.expenses.total > 0 ? (amount / financialSummary.expenses.total * 100).toFixed(2) : 0}\n`;
      });
      csvContent += `Gross Profit,Profit,${financialSummary.profit.gross},${financialSummary.profit.grossUSD},${financialSummary.profit.margin}\n`;
      filename = `profit_loss_report_${calculatedStartDate}_to_${calculatedEndDate}.csv`;
    }
    
    console.log(`📄 Exporting ${reportType} report as ${format.toUpperCase()}`);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export report',
      timestamp: new Date().toISOString()
    });
  }
});

console.log('📊 Enhanced Financial Reports API endpoints loaded');

// Get unread message count
app.get('/api/messages/unread/count', (req, res) => {
  const { userId, type } = req.query;
  
  let userMessages = messages;
  
  if (userId) {
    userMessages = userMessages.filter(m => 
      m.receiverId === userId || (!m.receiverId && m.senderId !== userId)
    );
  }
  
  if (type) {
    userMessages = userMessages.filter(m => m.type === type);
  }
  
  const unreadCount = userMessages.filter(m => !m.read).length;
  
  res.json({
    success: true,
    data: {
      unreadCount,
      totalMessages: userMessages.length
    },
    timestamp: new Date().toISOString()
  });
});

// ===== INVENTORY ENDPOINTS =====

app.get('/api/inventory', (req, res) => {
  const { category, lowStock } = req.query;
  
  let filteredInventory = inventory;
  
  if (category) {
    filteredInventory = filteredInventory.filter(item => item.category === category);
  }
  
  if (lowStock === 'true') {
    filteredInventory = filteredInventory.filter(item => item.currentStock <= item.minStock);
  }
  
  const inventoryWithStatus = filteredInventory.map(item => ({
    ...item,
    status: item.currentStock <= item.minStock ? 'low_stock' : 'good',
    stockPercentage: Math.round((item.currentStock / (item.minStock * 2)) * 100)
  }));
  
  res.json({
    success: true,
    data: {
      total: inventoryWithStatus.length,
      lowStockItems: inventory.filter(item => item.currentStock <= item.minStock).length,
      inventory: inventoryWithStatus
    },
    timestamp: new Date().toISOString()
  });
});

app.put('/api/inventory/:id', (req, res) => {
  const { id } = req.params;
  const { currentStock, minStock } = req.body;
  
  const itemIndex = inventory.findIndex(item => item.id === parseInt(id));
  
  if (itemIndex === -1) {
    return res.status(404).json({ 
      success: false,
      message: 'Inventory item not found',
      timestamp: new Date().toISOString()
    });
  }
  
  if (currentStock !== undefined) {
    inventory[itemIndex].currentStock = parseInt(currentStock);
  }
  
  if (minStock !== undefined) {
    inventory[itemIndex].minStock = parseInt(minStock);
  }
  
  inventory[itemIndex].lastUpdated = new Date().toISOString();
  
  res.json({
    success: true,
    data: inventory[itemIndex],
    message: 'Inventory updated successfully',
    timestamp: new Date().toISOString()
  });
});

// ===== STAFF & USER MANAGEMENT ENDPOINTS =====

// Mock staff data
let staff = [
  {
    id: 'staff_1',
    name: 'Manager Admin',
    role: 'manager',
    email: 'manager@halcyonrest.com',
    phone: '+94771234567',
    permissions: ['all'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'staff_2', 
    name: 'Front Desk Staff',
    role: 'front_desk',
    email: 'frontdesk@halcyonrest.com',
    phone: '+94771234568',
    permissions: ['reservations', 'guests', 'messages'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'staff_3',
    name: 'Housekeeping Lead',
    role: 'housekeeping',
    email: 'housekeeping@halcyonrest.com',
    phone: '+94771234569',
    permissions: ['inventory', 'maintenance', 'messages'],
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

// Get all staff
app.get('/api/staff', (req, res) => {
  const { role, status } = req.query;
  
  let filteredStaff = staff;
  
  if (role) {
    filteredStaff = filteredStaff.filter(s => s.role === role);
  }
  
  if (status) {
    filteredStaff = filteredStaff.filter(s => s.status === status);
  }
  
  res.json({
    success: true,
    data: {
      total: filteredStaff.length,
      staff: filteredStaff
    },
    timestamp: new Date().toISOString()
  });
});

// ===== SYSTEM NOTIFICATIONS =====

let notifications = [];

// Get notifications
app.get('/api/notifications', (req, res) => {
  const { userId, unreadOnly, type } = req.query;
  
  let filteredNotifications = notifications;
  
  if (userId) {
    filteredNotifications = filteredNotifications.filter(n => 
      n.userId === userId || n.userId === 'all'
    );
  }
  
  if (unreadOnly === 'true') {
    filteredNotifications = filteredNotifications.filter(n => !n.read);
  }
  
  if (type) {
    filteredNotifications = filteredNotifications.filter(n => n.type === type);
  }
  
  // Sort by newest first
  filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json({
    success: true,
    data: {
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter(n => !n.read).length,
      notifications: filteredNotifications
    },
    timestamp: new Date().toISOString()
  });
});

// Create notification
app.post('/api/notifications', (req, res) => {
  const {
    userId = 'all',
    title,
    message,
    type = 'info', // info, warning, error, success
    priority = 'normal',
    actionUrl,
    actionText
  } = req.body;
  
  const notification = {
    id: 'notif_' + Date.now(),
    userId,
    title,
    message,
    type,
    priority,
    actionUrl,
    actionText,
    read: false,
    createdAt: new Date().toISOString()
  };
  
  notifications.push(notification);
  
  res.status(201).json({
    success: true,
    data: notification,
    message: 'Notification created successfully',
    timestamp: new Date().toISOString()
  });
});

// Enhanced dashboard with today's activities
app.get('/api/dashboard', (req, res) => {
  const istToday = getISTDate();
  const todayStr = getISTDateString();
  const thisMonthStart = getISTMonthStart();
  
  console.log('🕐 Dashboard - IST Today:', istToday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('📅 Dashboard - Today String:', todayStr);
  console.log('📅 Dashboard - Month Start:', thisMonthStart);
  
  // Today's activities - FIXED
  const todayArrivals = reservations.filter(r => {
    console.log(`Checking arrival: ${r.dates.checkIn} === ${todayStr}`);
    return r.dates.checkIn === todayStr && r.status !== 'cancelled';
  });
  
  const todayDepartures = reservations.filter(r => {
    console.log(`Checking departure: ${r.dates.checkOut} === ${todayStr}`);
    return r.dates.checkOut === todayStr && r.status !== 'cancelled';
  });
  
  const stayOvers = reservations.filter(r => 
    new Date(r.dates.checkIn) < istToday && 
    new Date(r.dates.checkOut) > istToday && 
    r.status === 'checked-in'
  );
  
  // Guest requests (from special requests)
  const guestRequests = reservations.filter(r => 
    r.specialRequests && r.specialRequests.trim() !== '' && 
    r.status !== 'cancelled' && 
    new Date(r.dates.checkOut) >= istToday
  );
  
  // Current reservations
  const activeReservations = reservations.filter(r => 
    r.status === 'confirmed' && 
    new Date(r.dates.checkIn) <= istToday && 
    new Date(r.dates.checkOut) > istToday
  );
  
  // Monthly stats - FIXED
  const monthlyReservations = reservations.filter(r => {
    const createdDate = r.createdAt ? r.createdAt.split('T')[0] : r.dates.checkIn;
    console.log(`Checking monthly reservation: ${createdDate} >= ${thisMonthStart}`);
    return createdDate >= thisMonthStart;
  });
  
  const monthlyRevenueLKR = monthlyReservations.reduce((sum, r) => {
    const amount = r.pricing?.totalLKR || 0;
    console.log(`Adding monthly revenue: ${amount}`);
    return sum + amount;
  }, 0);
  
  const monthlyRevenueUSD = convertCurrency(monthlyRevenueLKR, 'LKR', 'USD');
  
  // Occupancy calculation
  const daysInMonth = new Date(istToday.getFullYear(), istToday.getMonth() + 1, 0).getDate();
  const totalUnitDays = daysInMonth * halcyonRestUnits.length;
  const bookedDays = monthlyReservations.reduce((sum, r) => sum + (r.dates.nights || 0), 0);
  const occupancyRate = ((bookedDays / totalUnitDays) * 100).toFixed(1);
  
  // Low stock alerts
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  
  console.log('📊 Dashboard Stats:', {
    todayStr,
    todayArrivals: todayArrivals.length,
    todayDepartures: todayDepartures.length,
    monthlyReservations: monthlyReservations.length,
    monthlyRevenue: monthlyRevenueLKR,
    occupancyRate
  });
  
  res.json({
    success: true,
    data: {
      overview: {
        totalUnits: halcyonRestUnits.length,
        activeReservations: activeReservations.length,
        monthlyReservations: monthlyReservations.length,
        occupancyRate: `${occupancyRate}%`
      },
      todayActivities: {
        arrivals: {
          count: todayArrivals.length,
          reservations: todayArrivals.map(r => ({
            id: r.id,
            confirmationNumber: r.confirmationNumber,
            guestName: r.guestInfo.bookerName,
            unit: r.property?.unit || r.unitName,
            adults: r.guestInfo.adults,
            children: r.guestInfo.children,
            status: r.status
          }))
        },
        departures: {
          count: todayDepartures.length,
          reservations: todayDepartures.map(r => ({
            id: r.id,
            confirmationNumber: r.confirmationNumber,
            guestName: r.guestInfo.bookerName,
            unit: r.property?.unit || r.unitName,
            adults: r.guestInfo.adults,
            children: r.guestInfo.children,
            status: r.status
          }))
        },
        stayOvers: {
          count: stayOvers.length,
          reservations: stayOvers.map(r => ({
            id: r.id,
            confirmationNumber: r.confirmationNumber,
            guestName: r.guestInfo.bookerName,
            unit: r.property?.unit || r.unitName,
            checkOut: r.dates.checkOut
          }))
        },
        guestRequests: {
          count: guestRequests.length,
          requests: guestRequests.map(r => ({
            id: r.id,
            confirmationNumber: r.confirmationNumber,
            guestName: r.guestInfo.bookerName,
            request: r.specialRequests,
            unit: r.property?.unit || r.unitName
          }))
        }
      },
      revenue: {
        monthlyLKR: monthlyRevenueLKR,
        monthlyUSD: monthlyRevenueUSD.toFixed(2),
        currency: 'LKR',
        exchangeRate: exchangeRate
      },
      alerts: {
        lowStockItems: lowStockItems.length,
        checkInsToday: todayArrivals.length,
        checkOutsToday: todayDepartures.length,
        pendingRequests: guestRequests.length
      },
      lowStockItems: lowStockItems,
      debugInfo: {
        istCurrentTime: istToday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        todayString: todayStr,
        monthStartString: thisMonthStart,
        timezone: 'Asia/Kolkata (IST)'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ===== ENHANCED DASHBOARD WITH FINANCIAL DATA =====
// ADD this new endpoint to replace or enhance your existing dashboard

// Enhanced dashboard with comprehensive financial data
// COMPLETE FIXED FINANCIAL DASHBOARD ENDPOINT
// Replace your existing app.get('/api/dashboard/financial', ...) with this code

// Enhanced dashboard with comprehensive financial data - FIXED FOR IST
app.get('/api/dashboard/financial', (req, res) => {
  const istToday = getISTDate();
  const todayStr = getISTDateString();
  const thisWeekStartStr = getISTWeekStart();
  const thisMonthStr = getISTMonthStart();
  
  console.log('💰 Financial Dashboard - IST Today:', istToday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
  console.log('💰 Financial Dashboard - Today String:', todayStr);
  console.log('💰 Financial Dashboard - Week Start:', thisWeekStartStr);
  console.log('💰 Financial Dashboard - Month Start:', thisMonthStr);
  
  // Today's financial summary - FIXED WITH DIRECT CALCULATION
  const todayRevenue = revenueEntries.filter(r => {
    const match = r.date === todayStr && r.paymentStatus === 'completed';
    console.log(`Today Revenue Check: ${r.id}, date=${r.date}, today=${todayStr}, status=${r.paymentStatus}, match=${match}`);
    return match;
  }).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  
  const todayExpenses = financialExpenses.filter(e => {
    const match = e.expenseDate === todayStr && e.status === 'paid';
    console.log(`Today Expense Check: ${e.id}, date=${e.expenseDate}, today=${todayStr}, status=${e.status}, match=${match}`);
    return match;
  }).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  
  console.log(`💰 Today Totals: Revenue=${todayRevenue}, Expenses=${todayExpenses}`);
  
  const todayProfit = todayRevenue - todayExpenses;
  const todayProfitMargin = todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(2) : '0.00';
  
  // This week's financial summary - FIXED
  const weeklyFinancial = calculateFinancialSummary(thisWeekStartStr, todayStr);
  
  // This month's financial summary - FIXED
  const monthlyFinancial = calculateFinancialSummary(thisMonthStr, todayStr);
  
  // Operational data - FIXED
  const todayArrivals = reservations.filter(r => 
    r.dates.checkIn === todayStr && r.status !== 'cancelled'
  );
  
  const todayDepartures = reservations.filter(r => 
    r.dates.checkOut === todayStr && r.status !== 'cancelled'
  );
  
  const activeReservations = reservations.filter(r => 
    r.status === 'confirmed' && 
    new Date(r.dates.checkIn) <= istToday && 
    new Date(r.dates.checkOut) > istToday
  );
  
  // Financial alerts
  const pendingExpenses = financialExpenses.filter(e => e.status === 'pending');
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  const unpaidReservations = reservations.filter(r => r.paymentStatus === 'not-paid' && r.status !== 'cancelled');
  
  // Recent transactions (last 5)
  const recentRevenue = revenueEntries
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(r => ({
      id: r.id,
      type: r.type,
      description: r.description,
      amount: r.amount,
      date: r.date,
      paymentMethod: r.paymentMethod,
      guestName: r.guestName
    }));
  
  const recentExpenses = financialExpenses
    .filter(e => e.status !== 'pending')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(e => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      vendor: e.vendor,
      status: e.status,
      expenseDate: e.expenseDate
    }));
  
  console.log(`📊 Financial dashboard loaded: Today P&L = LKR ${todayProfit.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      // Financial Overview Cards - FIXED
      financialOverview: {
        today: {
          revenue: todayRevenue,
          expenses: todayExpenses,
          profit: todayProfit,
          profitMargin: parseFloat(todayProfitMargin)
        },
        thisWeek: {
          revenue: weeklyFinancial.revenue.total,
          expenses: weeklyFinancial.expenses.total,
          profit: weeklyFinancial.profit.gross,
          profitMargin: parseFloat(weeklyFinancial.profit.margin)
        },
        thisMonth: {
          revenue: monthlyFinancial.revenue.total,
          expenses: monthlyFinancial.expenses.total,
          profit: monthlyFinancial.profit.gross,
          profitMargin: parseFloat(monthlyFinancial.profit.margin)
        }
      },
      
      // Operational Overview
      operations: {
        todayArrivals: todayArrivals.length,
        todayDepartures: todayDepartures.length,
        activeReservations: activeReservations.length,
        totalUnits: halcyonRestUnits.length,
        occupancyRate: activeReservations.length / halcyonRestUnits.length * 100
      },
      
      // Financial Alerts
      alerts: {
        pendingExpenseApprovals: pendingExpenses.length,
        unpaidReservations: unpaidReservations.length,
        lowStockAlerts: lowStockItems.length,
        totalPendingExpenseAmount: pendingExpenses.reduce((sum, e) => sum + e.amount, 0),
        totalUnpaidReservationAmount: unpaidReservations.reduce((sum, r) => sum + (r.pricing?.totalLKR || 0), 0)
      },
      
      // Recent Activity
      recentActivity: {
        revenue: recentRevenue,
        expenses: recentExpenses
      },
      
      // Quick Stats for KPI cards
      kpis: {
        monthlyRevenue: monthlyFinancial.revenue.total,
        monthlyExpenses: monthlyFinancial.expenses.total,
        monthlyProfit: monthlyFinancial.profit.gross,
        averageBookingValue: monthlyFinancial.revenue.byType.accommodation / (monthlyFinancial.revenue.count || 1),
        expenseRatio: monthlyFinancial.revenue.total > 0 ? 
          (monthlyFinancial.expenses.total / monthlyFinancial.revenue.total * 100) : 0,
        cashFlow: monthlyFinancial.revenue.total - monthlyFinancial.expenses.total
      },
      
      // Action Items
      actionItems: {
        expensesNeedingApproval: pendingExpenses.slice(0, 3).map(e => ({
          id: e.id,
          description: e.description,
          amount: e.amount,
          vendor: e.vendor,
          createdAt: e.createdAt
        })),
        unpaidBookings: unpaidReservations.slice(0, 3).map(r => ({
          id: r.id,
          confirmationNumber: r.confirmationNumber,
          guestName: r.guestInfo?.bookerName,
          amount: r.pricing?.totalLKR || 0,
          checkIn: r.dates?.checkIn
        })),
        lowStockItems: lowStockItems.slice(0, 3)
      },
      
      debugInfo: {
        istCurrentTime: istToday.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        todayString: todayStr,
        weekStartString: thisWeekStartStr,
        monthStartString: thisMonthStr,
        timezone: 'Asia/Kolkata (IST)',
        todayRevenueCount: revenueEntries.filter(r => r.date === todayStr).length,
        todayExpenseCount: financialExpenses.filter(e => e.expenseDate === todayStr).length
      }
    },
    timestamp: new Date().toISOString()
  });
});

app.get('/api/financial/enhanced-summary', (req, res) => {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthStr = thisMonth.toISOString().split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  
  // Calculate financial summary
  const financialSummary = calculateFinancialSummary(thisMonthStr, todayStr);
  
  // Enhanced revenue metrics
  const totalRevenue = revenueEntries.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = financialExpenses.filter(e => e.status === 'paid' || e.status === 'approved').reduce((sum, e) => sum + e.amount, 0);
  
  // Revenue type breakdown
  const accommodationRevenue = revenueEntries.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + r.amount, 0);
  const serviceRevenue = revenueEntries.filter(r => r.type === 'services').reduce((sum, r) => sum + r.amount, 0);
  const otherRevenue = revenueEntries.filter(r => r.type === 'other').reduce((sum, r) => sum + r.amount, 0);
  
  // Performance ratios
  const revenuePerExpense = totalExpenses > 0 ? totalRevenue / totalExpenses : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue * 100).toFixed(1) : 0;
  const serviceToAccommodationRatio = accommodationRevenue > 0 ? (serviceRevenue / accommodationRevenue * 100).toFixed(1) : 0;
  
  console.log(`📊 Enhanced financial summary: Revenue LKR ${totalRevenue.toLocaleString()}, Expenses LKR ${totalExpenses.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        profitMargin: totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0
      },
      revenue: {
        byType: {
          accommodation: accommodationRevenue,
          services: serviceRevenue,
          other: otherRevenue
        },
        total: totalRevenue,
        count: revenueEntries.length,
        averageTransaction: revenueEntries.length > 0 ? Math.round(totalRevenue / revenueEntries.length) : 0
      },
      expenses: {
        total: totalExpenses,
        count: financialExpenses.filter(e => e.status === 'paid' || e.status === 'approved').length,
        pending: financialExpenses.filter(e => e.status === 'pending').length,
        pendingAmount: financialExpenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0)
      },
      ratios: {
        revenuePerExpense: parseFloat(revenuePerExpense) || 0,
        expenseRatio: financialSummary.revenue.total > 0 ? 
          ((financialSummary.expenses.total / financialSummary.revenue.total) * 100).toFixed(1) : 0,
        serviceToAccommodationRatio: parseFloat(serviceToAccommodationRatio) || 0,
        operatingMargin: totalRevenue > 0 ? (((totalRevenue - totalExpenses) / totalRevenue) * 100).toFixed(1) : 0
      },
      trends: {
        monthlyRevenue: financialSummary.revenue.total,
        monthlyExpenses: financialSummary.expenses.total,
        monthlyProfit: financialSummary.profit.gross
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ===== UTILITY ENDPOINT: FORMAT CURRENCY =====
// Helper endpoint for frontend currency formatting
app.get('/api/financial/format-currency', (req, res) => {
  const { amount, currency = 'LKR' } = req.query;
  
  if (!amount || isNaN(amount)) {
    return res.status(400).json({
      success: false,
      message: 'Valid amount is required',
      timestamp: new Date().toISOString()
    });
  }
  
  const numAmount = parseFloat(amount);
  const formattedLKR = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 0
  }).format(numAmount);
  
  const formattedUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(numAmount / exchangeRate);
  
  res.json({
    success: true,
    data: {
      originalAmount: numAmount,
      requestedCurrency: currency,
      formatted: {
        LKR: formattedLKR,
        USD: formattedUSD
      },
      exchangeRate: exchangeRate
    },
    timestamp: new Date().toISOString()
  });
});
// ===== REVENUE MANAGEMENT API ENDPOINTS =====
// Add this RIGHT AFTER the dashboard endpoint (around line 1086)

// Get all revenue entries with filtering and summary
app.get('/api/revenue', (req, res) => {
  try {
    const { type, source, startDate, endDate, paymentStatus, paymentMethod } = req.query;
    
    let filteredRevenue = revenueEntries;
    
    // Apply filters
    if (type) {
      filteredRevenue = filteredRevenue.filter(r => r.type === type);
    }
    
    if (source) {
      filteredRevenue = filteredRevenue.filter(r => r.source === source);
    }
    
    if (paymentStatus) {
      filteredRevenue = filteredRevenue.filter(r => r.paymentStatus === paymentStatus);
    }
    
    if (paymentMethod) {
      filteredRevenue = filteredRevenue.filter(r => r.paymentMethod === paymentMethod);
    }
    
    if (startDate) {
      filteredRevenue = filteredRevenue.filter(r => r.date >= startDate);
    }
    
    if (endDate) {
      filteredRevenue = filteredRevenue.filter(r => r.date <= endDate);
    }
    
    // FIXED: Safer calculation with proper number handling
    const totalLKR = filteredRevenue.reduce((sum, r) => {
      const amount = parseFloat(r.amount) || 0;
      return sum + amount;
    }, 0);
    
const totalUSD = filteredRevenue.reduce((sum, r) => {
  const amountUSD = parseFloat(r.amountUSD) || (parseFloat(r.amount) || 0) / exchangeRate;
  return sum + amountUSD;
}, 0);
    // Revenue by type breakdown
    const revenueByType = {
      accommodation: filteredRevenue.filter(r => r.type === 'accommodation').reduce((sum, r) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0),
      services: filteredRevenue.filter(r => r.type === 'services').reduce((sum, r) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0),
      other: filteredRevenue.filter(r => r.type === 'other').reduce((sum, r) => {
        const amount = parseFloat(r.amount) || 0;
        return sum + amount;
      }, 0)
    };
    
    console.log(`📊 Revenue query: ${filteredRevenue.length} entries, Total: LKR ${totalLKR.toLocaleString()}`);

    res.json({
      success: true,
      data: {
        revenue: filteredRevenue.sort((a, b) => new Date(b.date) - new Date(a.date)),
        summary: {
          totalEntries: filteredRevenue.length,
          totalLKR: parseFloat(totalLKR.toFixed(2)) || 0,
          totalUSD: parseFloat(totalUSD.toFixed(2)) || 0, // FIXED: Ensure it's a number before toFixed()
          averageTransactionLKR: filteredRevenue.length > 0 ? Math.round(totalLKR / filteredRevenue.length) : 0,
          byType: revenueByType,
          dateRange: {
            earliest: filteredRevenue.length > 0 ? filteredRevenue.reduce((min, r) => r.date < min ? r.date : min, filteredRevenue[0].date) : null,
            latest: filteredRevenue.length > 0 ? filteredRevenue.reduce((max, r) => r.date > max ? r.date : max, filteredRevenue[0].date) : null
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revenue endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching revenue data',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Create manual revenue entry (for non-reservation income)
app.post('/api/revenue/manual', validateRevenueData, (req, res) => {
  try {
    const {
      type,
      description,
      amount,
      currency = 'LKR',
      paymentMethod = 'cash',
      guestName,
      confirmationNumber,
      notes,
      tags
    } = req.body;
    
    // Convert amount to LKR if needed
    const amountLKR = currency === 'USD' ? amount * exchangeRate : amount;
    const amountUSD = currency === 'USD' ? amount : amount / exchangeRate;
    
    const revenueEntry = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: type,
      source: 'manual',
      sourceId: null,
      description: description,
      amount: amountLKR,
      amountUSD: amountUSD,
      currency: 'LKR',
      exchangeRate: exchangeRate,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: paymentMethod,
      paymentStatus: 'completed',
      guestName: guestName || null,
      confirmationNumber: confirmationNumber || null,
      tags: Array.isArray(tags) ? tags : [type, 'manual'],
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    revenueEntries.push(revenueEntry);
    console.log(`💰 Manual revenue entry: ${description} - LKR ${amountLKR.toLocaleString()}`);
    
    res.status(201).json({
      success: true,
      data: revenueEntry,
      message: 'Revenue entry created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Manual revenue creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create revenue entry',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/revenue/analytics', (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    const now = new Date();
    let startDate, endDate;
    
    switch (period) {
      case 'today':
        startDate = now.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        startDate = weekStart.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
        break;
    }
    
    const periodRevenue = revenueEntries.filter(r => 
      r.date >= startDate && r.date <= endDate && r.paymentStatus === 'completed'
    );
    
    // Revenue breakdown by type
    const revenueByType = {
      accommodation: 0,
      services: 0,
      other: 0
    };
    
    // Revenue by payment method
    const revenueByPaymentMethod = {
      cash: 0,
      card: 0,
      bank_transfer: 0,
      online: 0
    };
    
    // Daily revenue trend
    const dailyRevenue = {};
    
    periodRevenue.forEach(revenue => {
      // By type
      revenueByType[revenue.type] += revenue.amount;
      
      // By payment method
      revenueByPaymentMethod[revenue.paymentMethod] += revenue.amount;
      
      // Daily trend
      if (!dailyRevenue[revenue.date]) {
        dailyRevenue[revenue.date] = 0;
      }
      dailyRevenue[revenue.date] += revenue.amount;
    });
    
    const totalRevenue = periodRevenue.reduce((sum, r) => sum + r.amount, 0);
    const averageDaily = Object.keys(dailyRevenue).length > 0 ? 
      totalRevenue / Object.keys(dailyRevenue).length : 0;
    
    // Guest spending analysis
    const guestSpending = {};
    periodRevenue.forEach(revenue => {
      if (revenue.guestName && revenue.type === 'accommodation') {
        if (!guestSpending[revenue.guestName]) {
          guestSpending[revenue.guestName] = 0;
        }
        guestSpending[revenue.guestName] += revenue.amount;
      }
    });
    
    const topGuests = Object.entries(guestSpending)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }));
    
    console.log(`📈 Revenue analytics for ${period}: LKR ${totalRevenue.toLocaleString()}`);
    
    res.json({
      success: true,
      data: {
        period: { type: period, startDate, endDate },
        summary: {
          totalRevenue,
          totalTransactions: periodRevenue.length,
          averageTransaction: periodRevenue.length > 0 ? totalRevenue / periodRevenue.length : 0,
          averageDaily
        },
        breakdown: {
          byType: revenueByType,
          byPaymentMethod: revenueByPaymentMethod,
          dailyTrend: dailyRevenue
        },
        insights: {
          primarySource: Object.entries(revenueByType).reduce((max, [type, amount]) => 
            amount > max.amount ? { type, amount } : max, { type: null, amount: 0 }),
          topGuests,
          serviceUpsellRate: revenueByType.accommodation > 0 ? 
            (revenueByType.services / revenueByType.accommodation * 100).toFixed(1) : 0
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate revenue analytics',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
app.get('/api/revenue/search', (req, res) => {
  try {
    const { 
      q, // search query
      type,
      paymentMethod,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      limit = 50,
      offset = 0
    } = req.query;
    
    let results = revenueEntries;
    
    // Text search across multiple fields
    if (q) {
      const searchLower = q.toLowerCase();
      results = results.filter(revenue => 
        revenue.description.toLowerCase().includes(searchLower) ||
        (revenue.guestName && revenue.guestName.toLowerCase().includes(searchLower)) ||
        (revenue.confirmationNumber && revenue.confirmationNumber.toLowerCase().includes(searchLower)) ||
        (revenue.notes && revenue.notes.toLowerCase().includes(searchLower))
      );
    }
    
    // Additional filters
    if (type) results = results.filter(r => r.type === type);
    if (paymentMethod) results = results.filter(r => r.paymentMethod === paymentMethod);
    if (dateFrom) results = results.filter(r => r.date >= dateFrom);
    if (dateTo) results = results.filter(r => r.date <= dateTo);
    if (amountMin) results = results.filter(r => r.amount >= parseFloat(amountMin));
    if (amountMax) results = results.filter(r => r.amount <= parseFloat(amountMax));
    
    // Sort by relevance (date desc by default)
    results.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Pagination
    const total = results.length;
    const paginatedResults = results.slice(offset, offset + parseInt(limit));
    
    console.log(`🔍 Revenue search: "${q || 'all'}" - ${total} results`);
    
    res.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        searchQuery: q || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleRevenueError(error, 'search', res);
  }
});
app.get('/api/revenue/test', (req, res) => {
  const testResults = {
    revenueEntriesCount: revenueEntries.length,
    sampleRevenue: revenueEntries.slice(0, 3),
    totalRevenue: revenueEntries.reduce((sum, r) => sum + r.amount, 0),
    revenueByType: {
      accommodation: revenueEntries.filter(r => r.type === 'accommodation').length,
      services: revenueEntries.filter(r => r.type === 'services').length,
      other: revenueEntries.filter(r => r.type === 'other').length
    },
    exchangeRate: exchangeRate,
    systemStatus: 'Revenue system operational'
  };
  
  console.log('🧪 Revenue system test completed');
  
  res.json({
    success: true,
    data: testResults,
    message: 'Revenue system test completed successfully',
    timestamp: new Date().toISOString()
  });
});
// Get revenue summary for dashboard
app.get('/api/revenue/summary', (req, res) => {
  const { period = 'month' } = req.query;
  
  const now = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = now.toISOString().split('T')[0];
      endDate = startDate;
      break;
    case 'week':
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startDate = weekStart.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
      break;
    case 'month':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
      break;
  }
  
  const summary = calculateFinancialSummary(startDate, endDate);
  
  console.log(`📈 Revenue summary for ${period}: LKR ${summary.revenue.total.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      period: period,
      summary: summary.revenue,
      dateRange: { startDate, endDate }
    },
    timestamp: new Date().toISOString()
  });
});

// Update revenue entry
app.put('/api/revenue/:revenueId', (req, res) => {
  const { revenueId } = req.params;
  const updateData = req.body;
  
  const revenueIndex = revenueEntries.findIndex(r => r.id === revenueId);
  
  if (revenueIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Revenue entry not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Update allowed fields
  const allowedFields = ['description', 'paymentMethod', 'paymentStatus', 'guestName', 'notes', 'tags'];
  const updatedEntry = { ...revenueEntries[revenueIndex] };
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      updatedEntry[field] = updateData[field];
    }
  });
  
  updatedEntry.updatedAt = new Date().toISOString();
  revenueEntries[revenueIndex] = updatedEntry;
  
  console.log(`✏️ Revenue entry updated: ${revenueId}`);
  
  res.json({
    success: true,
    data: updatedEntry,
    message: 'Revenue entry updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Delete revenue entry (soft delete by marking as cancelled)
app.delete('/api/revenue/:revenueId', (req, res) => {
  const { revenueId } = req.params;
  const { reason } = req.body;
  
  const revenueIndex = revenueEntries.findIndex(r => r.id === revenueId);
  
  if (revenueIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Revenue entry not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Soft delete - mark as cancelled instead of removing
  revenueEntries[revenueIndex].paymentStatus = 'cancelled';
  revenueEntries[revenueIndex].notes = (revenueEntries[revenueIndex].notes || '') + `\n[CANCELLED: ${reason || 'No reason provided'}]`;
  revenueEntries[revenueIndex].updatedAt = new Date().toISOString();
  
  console.log(`❌ Revenue entry cancelled: ${revenueId} - Reason: ${reason || 'No reason'}`);
  
  res.json({
    success: true,
    data: revenueEntries[revenueIndex],
    message: 'Revenue entry cancelled successfully',
    timestamp: new Date().toISOString()
  });
});

// Auto-create revenue when reservation payment status changes
app.post('/api/revenue/from-reservation/:reservationId', (req, res) => {
  const { reservationId } = req.params;
  const { paymentAmount, paymentMethod = 'cash' } = req.body;
  
  if (!paymentAmount || paymentAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid payment amount is required',
      timestamp: new Date().toISOString()
    });
  }
  
  // Find the reservation
  const reservation = reservations.find(r => r.id === reservationId);
  
  if (!reservation) {
    return res.status(404).json({
      success: false,
      message: 'Reservation not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check if revenue already exists for this reservation
  const existingRevenue = revenueEntries.find(r => r.sourceId === reservationId);
  
  if (existingRevenue) {
    return res.status(409).json({
      success: false,
      message: 'Revenue entry already exists for this reservation',
      existingEntry: existingRevenue,
      timestamp: new Date().toISOString()
    });
  }
  
  // Create revenue entry
const autoCreateRevenueFromReservation = (reservation, paymentAmount, paymentMethod = 'cash') => {
  // FIXED: Ensure paymentAmount is a valid number
  const validAmount = parseFloat(paymentAmount) || 0;
  const validAmountUSD = validAmount / exchangeRate;
  
  const revenueEntry = {
    id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    type: 'accommodation',
    source: 'reservation',
    sourceId: reservation.id,
    description: `${reservation.unitName || reservation.propertyId} - ${reservation.dates?.nights || calculateNights(reservation.dates?.checkIn, reservation.dates?.checkOut)} nights`,
    amount: validAmount, // FIXED: Use validated amount
    amountUSD: validAmountUSD, // FIXED: Use calculated USD amount
    currency: 'LKR',
    exchangeRate: exchangeRate,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod,
    paymentStatus: 'completed',
    guestName: reservation.guestInfo?.bookerName || 'Unknown Guest',
    confirmationNumber: reservation.confirmationNumber,
    tags: ['accommodation', reservation.unitId || reservation.propertyId],
    notes: `Auto-created from reservation payment`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  revenueEntries.push(revenueEntry);
  console.log(`💰 Auto-created revenue: LKR ${validAmount.toLocaleString()} for ${reservation.confirmationNumber}`);
  return revenueEntry;
};

// GENERAL UTILITY FUNCTION: Safe number formatting
const safeToFixed = (value, decimals = 2) => {
  const num = parseFloat(value);
  if (isNaN(num)) {
    return '0.00';
  }
  return num.toFixed(decimals);
};

const safeParseFloat = (value, defaultValue = 0) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Use these utility functions throughout your code like this:
// Instead of: totalUSD.toFixed(2)
// Use: safeToFixed(totalUSD, 2)

// ENHANCED REVENUE ENTRY VALIDATION
const validateRevenueEntry = (entry) => {
  return {
    ...entry,
    amount: safeParseFloat(entry.amount, 0),
    amountUSD: safeParseFloat(entry.amountUSD, 0),
    exchangeRate: safeParseFloat(entry.exchangeRate, exchangeRate)
  };
};

// DATA INTEGRITY CHECK: Run this to fix existing data
const fixExistingRevenueData = () => {
  console.log('🔧 Fixing existing revenue data...');
  
  revenueEntries.forEach((entry, index) => {
    const originalAmount = entry.amount;
    const originalAmountUSD = entry.amountUSD;
    
    // Fix amount fields
    entry.amount = safeParseFloat(entry.amount, 0);
    entry.amountUSD = safeParseFloat(entry.amountUSD, 0);
    entry.exchangeRate = safeParseFloat(entry.exchangeRate, exchangeRate);
    
    // Recalculate USD if it's missing or invalid
    if (entry.amountUSD === 0 && entry.amount > 0) {
      entry.amountUSD = entry.amount / entry.exchangeRate;
    }
    
    // Log fixes
    if (originalAmount !== entry.amount || originalAmountUSD !== entry.amountUSD) {
      console.log(`Fixed revenue entry ${entry.id}: Amount ${originalAmount} -> ${entry.amount}, USD ${originalAmountUSD} -> ${entry.amountUSD}`);
    }
  });
  
  console.log(`✅ Fixed ${revenueEntries.length} revenue entries`);
};
});
// ===== EXPENSE MANAGEMENT API ENDPOINTS =====
// Add this RIGHT AFTER the revenue endpoints

// Get all expenses with filtering and summary
app.get('/api/expenses', (req, res) => {
  const { category, subcategory, vendor, status, startDate, endDate, approvedBy, isRecurring } = req.query;
  
  let filteredExpenses = financialExpenses;
  
  // Apply filters
  if (category) {
    filteredExpenses = filteredExpenses.filter(e => e.category === category);
  }
  
  if (subcategory) {
    filteredExpenses = filteredExpenses.filter(e => e.subcategory === subcategory);
  }
  
  if (vendor) {
    filteredExpenses = filteredExpenses.filter(e => e.vendor?.toLowerCase().includes(vendor.toLowerCase()));
  }
  
  if (status) {
    filteredExpenses = filteredExpenses.filter(e => e.status === status);
  }
  
  if (startDate) {
    filteredExpenses = filteredExpenses.filter(e => e.expenseDate >= startDate);
  }
  
  if (endDate) {
    filteredExpenses = filteredExpenses.filter(e => e.expenseDate <= endDate);
  }
  
  if (approvedBy) {
    filteredExpenses = filteredExpenses.filter(e => e.approvedBy === approvedBy);
  }
  
  if (isRecurring !== undefined) {
    filteredExpenses = filteredExpenses.filter(e => e.isRecurring === (isRecurring === 'true'));
  }
  
  // Calculate summary statistics
  const totalLKR = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalUSD = filteredExpenses.reduce((sum, e) => sum + e.amountUSD, 0);
  
  // Expenses by category breakdown
  const expensesByCategory = {
    utilities: filteredExpenses.filter(e => e.category === 'utilities').reduce((sum, e) => sum + e.amount, 0),
    maintenance: filteredExpenses.filter(e => e.category === 'maintenance').reduce((sum, e) => sum + e.amount, 0),
    supplies: filteredExpenses.filter(e => e.category === 'supplies').reduce((sum, e) => sum + e.amount, 0),
    staff: filteredExpenses.filter(e => e.category === 'staff').reduce((sum, e) => sum + e.amount, 0),
    marketing: filteredExpenses.filter(e => e.category === 'marketing').reduce((sum, e) => sum + e.amount, 0),
    services: filteredExpenses.filter(e => e.category === 'services').reduce((sum, e) => sum + e.amount, 0)
  };
  
  // Expenses by status
  const expensesByStatus = {
    pending: filteredExpenses.filter(e => e.status === 'pending').length,
    approved: filteredExpenses.filter(e => e.status === 'approved').length,
    rejected: filteredExpenses.filter(e => e.status === 'rejected').length,
    paid: filteredExpenses.filter(e => e.status === 'paid').length
  };
  
  console.log(`💸 Expense query: ${filteredExpenses.length} entries, Total: LKR ${totalLKR.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      expenses: filteredExpenses.sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate)),
      summary: {
        totalEntries: filteredExpenses.length,
        totalLKR,
        totalUSD: parseFloat(totalUSD.toFixed(2)),
        averageExpenseLKR: filteredExpenses.length > 0 ? Math.round(totalLKR / filteredExpenses.length) : 0,
        byCategory: expensesByCategory,
        byStatus: expensesByStatus,
        pendingApproval: filteredExpenses.filter(e => e.status === 'pending').length,
        recurringExpenses: filteredExpenses.filter(e => e.isRecurring).length
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Create new expense (invoice file mandatory)
app.post('/api/expenses', (req, res) => {
  const {
    category,
    subcategory,
    description,
    amount,
    currency = 'LKR',
    expenseDate,
    paymentMethod,
    vendor,
    invoiceNumber,
    invoiceFile, // This is MANDATORY
    receiptFile,
    isRecurring = false,
    recurringFrequency,
    budgetCategory,
    taxDeductible = true,
    tags,
    notes
  } = req.body;
  
  // Strict validation - Invoice file is mandatory
  if (!category || !description || !amount || !vendor || !invoiceNumber || !invoiceFile) {
    return res.status(400).json({
      success: false,
      message: 'Category, description, amount, vendor, invoice number, and invoice file are required',
      missingFields: {
        category: !category,
        description: !description,
        amount: !amount,
        vendor: !vendor,
        invoiceNumber: !invoiceNumber,
        invoiceFile: !invoiceFile
      },
      note: 'Invoice file upload is mandatory for all expenses',
      timestamp: new Date().toISOString()
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0',
      timestamp: new Date().toISOString()
    });
  }
  
  // Convert amount to LKR if needed
  const amountLKR = currency === 'USD' ? amount * exchangeRate : amount;
  const amountUSD = currency === 'USD' ? amount : amount / exchangeRate;
  
  // Calculate next due date for recurring expenses
  let nextDueDate = null;
  if (isRecurring && recurringFrequency) {
    const currentDate = new Date(expenseDate || new Date());
    switch (recurringFrequency) {
      case 'monthly':
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      case 'quarterly':
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
        break;
      case 'yearly':
        nextDueDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
    }
    nextDueDate = nextDueDate.toISOString().split('T')[0];
  }
  
  const expense = {
    id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    category: category,
    subcategory: subcategory || '',
    description: description,
    amount: amountLKR,
    amountUSD: amountUSD,
    currency: 'LKR',
    expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'cash',
    vendor: vendor,
    invoiceNumber: invoiceNumber,
    invoiceFile: invoiceFile, // URL or file path - MANDATORY
    receiptFile: receiptFile || null,
    approvedBy: null, // Will be set when approved
    approvedDate: null,
    status: 'pending', // All expenses start as pending approval
    isRecurring: isRecurring,
    recurringFrequency: recurringFrequency || null,
    nextDueDate: nextDueDate,
    budgetCategory: budgetCategory || category,
    taxDeductible: taxDeductible,
    tags: Array.isArray(tags) ? tags : [category],
    notes: notes || '',
    createdBy: 'staff_1', // Should come from authenticated user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  financialExpenses.push(expense);
  console.log(`💸 New expense pending approval: ${description} - LKR ${amountLKR.toLocaleString()}`);
  
  res.status(201).json({
    success: true,
    data: expense,
    message: 'Expense created successfully and is pending approval',
    timestamp: new Date().toISOString()
  });
});

// Get pending expenses for approval
app.get('/api/expenses/pending-approval', (req, res) => {
  const pendingExpenses = financialExpenses.filter(e => e.status === 'pending');
  
  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  res.json({
    success: true,
    data: {
      expenses: pendingExpenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      summary: {
        totalPending: pendingExpenses.length,
        totalPendingAmount: totalPendingAmount,
        totalPendingAmountUSD: totalPendingAmount / exchangeRate,
        oldestPending: pendingExpenses.length > 0 ? 
          pendingExpenses.reduce((oldest, e) => new Date(e.createdAt) < new Date(oldest.createdAt) ? e : oldest).createdAt : null
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Approve or reject expense
app.put('/api/expenses/:expenseId/approve', (req, res) => {
  const { expenseId } = req.params;
  const { action, reason, approvedBy = 'staff_1' } = req.body; // action: 'approve' or 'reject'
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action must be either "approve" or "reject"',
      timestamp: new Date().toISOString()
    });
  }
  
  const expenseIndex = financialExpenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
      timestamp: new Date().toISOString()
    });
  }
  
  if (financialExpenses[expenseIndex].status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending expenses can be approved or rejected',
      currentStatus: financialExpenses[expenseIndex].status,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update expense status
  financialExpenses[expenseIndex].status = action === 'approve' ? 'approved' : 'rejected';
  financialExpenses[expenseIndex].approvedBy = approvedBy;
  financialExpenses[expenseIndex].approvedDate = new Date().toISOString();
  financialExpenses[expenseIndex].updatedAt = new Date().toISOString();
  
  if (reason) {
    financialExpenses[expenseIndex].notes = (financialExpenses[expenseIndex].notes || '') + 
      `\n[${action.toUpperCase()}: ${reason}]`;
  }
  
  console.log(`${action === 'approve' ? '✅' : '❌'} Expense ${action}d: ${expenseId} by ${approvedBy}`);
  
  res.json({
    success: true,
    data: financialExpenses[expenseIndex],
    message: `Expense ${action}d successfully`,
    timestamp: new Date().toISOString()
  });
});

// Update expense
app.put('/api/expenses/:expenseId', (req, res) => {
  const { expenseId } = req.params;
  const updateData = req.body;
  
  const expenseIndex = financialExpenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Only allow updates to pending expenses
  if (financialExpenses[expenseIndex].status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: 'Only pending expenses can be updated',
      currentStatus: financialExpenses[expenseIndex].status,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update allowed fields
  const allowedFields = ['description', 'amount', 'vendor', 'invoiceNumber', 'invoiceFile', 'receiptFile', 'notes', 'tags'];
  const updatedExpense = { ...financialExpenses[expenseIndex] };
  
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      if (field === 'amount') {
        updatedExpense.amount = parseFloat(updateData[field]);
        updatedExpense.amountUSD = updatedExpense.amount / exchangeRate;
      } else {
        updatedExpense[field] = updateData[field];
      }
    }
  });
  
  updatedExpense.updatedAt = new Date().toISOString();
  financialExpenses[expenseIndex] = updatedExpense;
  
  console.log(`✏️ Expense updated: ${expenseId}`);
  
  res.json({
    success: true,
    data: updatedExpense,
    message: 'Expense updated successfully',
    timestamp: new Date().toISOString()
  });
});

// Mark expense as paid
app.put('/api/expenses/:expenseId/mark-paid', (req, res) => {
  const { expenseId } = req.params;
  const { paymentMethod, paymentDate, paymentReference, notes } = req.body;
  
  const expenseIndex = financialExpenses.findIndex(e => e.id === expenseId);
  
  if (expenseIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
      timestamp: new Date().toISOString()
    });
  }
  
  if (financialExpenses[expenseIndex].status !== 'approved') {
    return res.status(400).json({
      success: false,
      message: 'Only approved expenses can be marked as paid',
      currentStatus: financialExpenses[expenseIndex].status,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update expense to paid status
  financialExpenses[expenseIndex].status = 'paid';
  financialExpenses[expenseIndex].paidDate = paymentDate || new Date().toISOString().split('T')[0];
  financialExpenses[expenseIndex].paymentMethod = paymentMethod || financialExpenses[expenseIndex].paymentMethod;
  financialExpenses[expenseIndex].paymentReference = paymentReference || null;
  financialExpenses[expenseIndex].updatedAt = new Date().toISOString();
  
  if (notes) {
    financialExpenses[expenseIndex].notes = (financialExpenses[expenseIndex].notes || '') + 
      `\n[PAID: ${notes}]`;
  }
  
  console.log(`💳 Expense marked as paid: ${expenseId} - LKR ${financialExpenses[expenseIndex].amount.toLocaleString()}`);
  
  res.json({
    success: true,
    data: financialExpenses[expenseIndex],
    message: 'Expense marked as paid successfully',
    timestamp: new Date().toISOString()
  });
});
// ===== FINANCIAL REPORTING & ANALYTICS API ENDPOINTS =====
// Add this RIGHT AFTER the expense endpoints

// Get comprehensive financial summary
app.get('/api/financial/summary', (req, res) => {
  const { period = 'month', startDate, endDate } = req.query;
  
  const now = new Date();
  let calculatedStartDate, calculatedEndDate;
  
  if (startDate && endDate) {
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
  } else {
    switch (period) {
      case 'today':
        calculatedStartDate = now.toISOString().split('T')[0];
        calculatedEndDate = calculatedStartDate;
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        calculatedStartDate = weekStart.toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'month':
      default:
        calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        calculatedStartDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
    }
  }
  
  const financialSummary = calculateFinancialSummary(calculatedStartDate, calculatedEndDate);
  
  // Add additional analytics
  const reservationsInPeriod = reservations.filter(r => 
    r.dates.checkIn >= calculatedStartDate && r.dates.checkIn <= calculatedEndDate
  );
  
  const occupancyData = {
    totalReservations: reservationsInPeriod.length,
    totalNights: reservationsInPeriod.reduce((sum, r) => sum + r.dates.nights, 0),
    averageBookingValue: reservationsInPeriod.length > 0 ? 
      financialSummary.revenue.byType.accommodation / reservationsInPeriod.length : 0,
    averageStayLength: reservationsInPeriod.length > 0 ?
      reservationsInPeriod.reduce((sum, r) => sum + r.dates.nights, 0) / reservationsInPeriod.length : 0
  };
  
  console.log(`📊 Financial summary for ${period}: Profit LKR ${financialSummary.profit.gross.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      period: {
        type: period,
        startDate: calculatedStartDate,
        endDate: calculatedEndDate,
        days: Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1
      },
      ...financialSummary,
      occupancy: occupancyData,
      kpis: {
        profitMarginPercent: parseFloat(financialSummary.profit.margin),
        revenuePerDay: financialSummary.revenue.total / (Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1),
        expensePerDay: financialSummary.expenses.total / (Math.ceil((new Date(calculatedEndDate) - new Date(calculatedStartDate)) / (1000 * 60 * 60 * 24)) + 1),
        expenseRatio: financialSummary.revenue.total > 0 ? (financialSummary.expenses.total / financialSummary.revenue.total * 100).toFixed(2) : 0
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get weekly profit & loss report
app.get('/api/financial/weekly-summary', (req, res) => {
  const { weeks = 4 } = req.query;
  const weeksToShow = parseInt(weeks) || 4;
  
  const now = new Date();
  const weeklyReports = [];
  
  for (let i = 0; i < weeksToShow; i++) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - (i * 7));
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    
    const startDate = weekStart.toISOString().split('T')[0];
    const endDate = weekEnd.toISOString().split('T')[0];
    
    const weekSummary = calculateFinancialSummary(startDate, endDate);
    
    weeklyReports.push({
      weekNumber: weeksToShow - i,
      weekStarting: startDate,
      weekEnding: endDate,
      ...weekSummary,
      weeklyGrowth: i < weeksToShow - 1 ? null : 0 // Will calculate growth in frontend
    });
  }
  
  // Calculate week-over-week growth
  for (let i = 1; i < weeklyReports.length; i++) {
    const currentWeek = weeklyReports[i];
    const previousWeek = weeklyReports[i - 1];
    
    if (previousWeek.revenue.total > 0) {
      currentWeek.weeklyGrowth = (((currentWeek.revenue.total - previousWeek.revenue.total) / previousWeek.revenue.total) * 100).toFixed(2);
    }
  }
  
  console.log(`📈 Weekly summary generated for ${weeksToShow} weeks`);
  
  res.json({
    success: true,
    data: {
      totalWeeks: weeksToShow,
      weeklyReports: weeklyReports.reverse(), // Oldest first
      summary: {
        totalRevenue: weeklyReports.reduce((sum, w) => sum + w.revenue.total, 0),
        totalExpenses: weeklyReports.reduce((sum, w) => sum + w.expenses.total, 0),
        totalProfit: weeklyReports.reduce((sum, w) => sum + w.profit.gross, 0),
        averageWeeklyRevenue: weeklyReports.reduce((sum, w) => sum + w.revenue.total, 0) / weeksToShow,
        averageWeeklyProfit: weeklyReports.reduce((sum, w) => sum + w.profit.gross, 0) / weeksToShow
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get expense breakdown and analysis
app.get('/api/financial/expense-analysis', (req, res) => {
  const { startDate, endDate, period = 'month' } = req.query;
  
  const now = new Date();
  let calculatedStartDate, calculatedEndDate;
  
  if (startDate && endDate) {
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
  } else {
    switch (period) {
      case 'month':
      default:
        calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        calculatedStartDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
    }
  }
  
  const periodExpenses = financialExpenses.filter(e => 
    e.expenseDate >= calculatedStartDate && 
    e.expenseDate <= calculatedEndDate && 
    (e.status === 'approved' || e.status === 'paid')
  );
  
  // Expense breakdown by category
  const expensesByCategory = {};
  const expensesByVendor = {};
  const expensesByPaymentMethod = {};
  const monthlyExpenseTrend = {};
  
  periodExpenses.forEach(expense => {
    // By category
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = {
        total: 0,
        count: 0,
        percentage: 0,
        subcategories: {}
      };
    }
    expensesByCategory[expense.category].total += expense.amount;
    expensesByCategory[expense.category].count += 1;
    
    // Subcategories
    if (expense.subcategory) {
      if (!expensesByCategory[expense.category].subcategories[expense.subcategory]) {
        expensesByCategory[expense.category].subcategories[expense.subcategory] = {
          total: 0,
          count: 0
        };
      }
      expensesByCategory[expense.category].subcategories[expense.subcategory].total += expense.amount;
      expensesByCategory[expense.category].subcategories[expense.subcategory].count += 1;
    }
    
    // By vendor
    if (!expensesByVendor[expense.vendor]) {
      expensesByVendor[expense.vendor] = {
        total: 0,
        count: 0,
        averageAmount: 0,
        categories: []
      };
    }
    expensesByVendor[expense.vendor].total += expense.amount;
    expensesByVendor[expense.vendor].count += 1;
    expensesByVendor[expense.vendor].averageAmount = expensesByVendor[expense.vendor].total / expensesByVendor[expense.vendor].count;
    
    if (!expensesByVendor[expense.vendor].categories.includes(expense.category)) {
      expensesByVendor[expense.vendor].categories.push(expense.category);
    }
    
    // By payment method
    if (!expensesByPaymentMethod[expense.paymentMethod]) {
      expensesByPaymentMethod[expense.paymentMethod] = {
        total: 0,
        count: 0
      };
    }
    expensesByPaymentMethod[expense.paymentMethod].total += expense.amount;
    expensesByPaymentMethod[expense.paymentMethod].count += 1;
    
    // Monthly trend
    const month = expense.expenseDate.substring(0, 7); // YYYY-MM
    if (!monthlyExpenseTrend[month]) {
      monthlyExpenseTrend[month] = 0;
    }
    monthlyExpenseTrend[month] += expense.amount;
  });
  
  // Calculate percentages for categories
  const totalExpenseAmount = periodExpenses.reduce((sum, e) => sum + e.amount, 0);
  Object.keys(expensesByCategory).forEach(category => {
    expensesByCategory[category].percentage = totalExpenseAmount > 0 ? 
      ((expensesByCategory[category].total / totalExpenseAmount) * 100).toFixed(2) : 0;
  });
  
  // Top vendors (sorted by total amount)
  const topVendors = Object.entries(expensesByVendor)
    .sort(([,a], [,b]) => b.total - a.total)
    .slice(0, 10)
    .map(([vendor, data]) => ({
      vendor,
      ...data
    }));
  
  console.log(`💸 Expense analysis: ${periodExpenses.length} expenses, Total: LKR ${totalExpenseAmount.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
      summary: {
        totalExpenses: totalExpenseAmount,
        totalExpensesUSD: totalExpenseAmount / exchangeRate,
        totalTransactions: periodExpenses.length,
        averageExpense: totalExpenseAmount / (periodExpenses.length || 1),
        recurringExpenses: periodExpenses.filter(e => e.isRecurring).length,
        pendingExpenses: financialExpenses.filter(e => e.status === 'pending').length
      },
      breakdown: {
        byCategory: expensesByCategory,
        byVendor: topVendors,
        byPaymentMethod: expensesByPaymentMethod,
        monthlyTrend: monthlyExpenseTrend
      },
      insights: {
        topCategory: Object.entries(expensesByCategory).reduce((max, [cat, data]) => 
          data.total > (max.total || 0) ? { category: cat, ...data } : max, {}),
        topVendor: topVendors[0] || null,
        averageTransactionSize: totalExpenseAmount / (periodExpenses.length || 1)
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get revenue analysis and trends
app.get('/api/financial/revenue-analysis', (req, res) => {
  const { startDate, endDate, period = 'month' } = req.query;
  
  const now = new Date();
  let calculatedStartDate, calculatedEndDate;
  
  if (startDate && endDate) {
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
  } else {
    switch (period) {
      case 'month':
      default:
        calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        calculatedStartDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
    }
  }
  
  const periodRevenue = revenueEntries.filter(r => 
    r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
  );

  // handleRevenueError function is already defined earlier in the file

  // Revenue breakdown
  const revenueByType = {};
  const revenueByPaymentMethod = {};
  const dailyRevenueTrend = {};
  const guestAnalysis = {};
  
  periodRevenue.forEach(revenue => {
    // By type
    if (!revenueByType[revenue.type]) {
      revenueByType[revenue.type] = {
        total: 0,
        count: 0,
        percentage: 0,
        averageTransaction: 0
      };
    }
    revenueByType[revenue.type].total += revenue.amount;
    revenueByType[revenue.type].count += 1;
    
    // By payment method
    if (!revenueByPaymentMethod[revenue.paymentMethod]) {
      revenueByPaymentMethod[revenue.paymentMethod] = {
        total: 0,
        count: 0
      };
    }
    revenueByPaymentMethod[revenue.paymentMethod].total += revenue.amount;
    revenueByPaymentMethod[revenue.paymentMethod].count += 1;
    
    // Daily trend
    const day = revenue.date;
    if (!dailyRevenueTrend[day]) {
      dailyRevenueTrend[day] = 0;
    }
    dailyRevenueTrend[day] += revenue.amount;
    
    // Guest analysis (for accommodation revenue)
    if (revenue.type === 'accommodation' && revenue.guestName) {
      if (!guestAnalysis[revenue.guestName]) {
        guestAnalysis[revenue.guestName] = {
          totalSpent: 0,
          bookingCount: 0,
          averageSpend: 0
        };
      }
      guestAnalysis[revenue.guestName].totalSpent += revenue.amount;
      guestAnalysis[revenue.guestName].bookingCount += 1;
      guestAnalysis[revenue.guestName].averageSpend = 
        guestAnalysis[revenue.guestName].totalSpent / guestAnalysis[revenue.guestName].bookingCount;
    }
  });
  
  // Calculate percentages and averages
  const totalRevenueAmount = periodRevenue.reduce((sum, r) => sum + r.amount, 0);
  
  Object.keys(revenueByType).forEach(type => {
    revenueByType[type].percentage = totalRevenueAmount > 0 ? 
      ((revenueByType[type].total / totalRevenueAmount) * 100).toFixed(2) : 0;
    revenueByType[type].averageTransaction = revenueByType[type].total / revenueByType[type].count;
  });
  
  // Top guests by spending
  const topGuests = Object.entries(guestAnalysis)
    .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
    .slice(0, 10)
    .map(([guestName, data]) => ({
      guestName,
      ...data
    }));
  
  console.log(`💰 Revenue analysis: ${periodRevenue.length} entries, Total: LKR ${totalRevenueAmount.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
      summary: {
        totalRevenue: totalRevenueAmount,
        totalRevenueUSD: totalRevenueAmount / exchangeRate,
        totalTransactions: periodRevenue.length,
        averageTransaction: totalRevenueAmount / (periodRevenue.length || 1),
        accommodationRevenue: revenueByType.accommodation?.total || 0,
        otherRevenue: totalRevenueAmount - (revenueByType.accommodation?.total || 0)
      },
      breakdown: {
        byType: revenueByType,
        byPaymentMethod: revenueByPaymentMethod,
        dailyTrend: dailyRevenueTrend,
        topGuests: topGuests
      },
      insights: {
        primaryRevenueSource: Object.entries(revenueByType).reduce((max, [type, data]) => 
          data.total > (max.total || 0) ? { type, ...data } : max, {}),
        averageDailyRevenue: Object.keys(dailyRevenueTrend).length > 0 ? 
          totalRevenueAmount / Object.keys(dailyRevenueTrend).length : 0,
        cashVsCard: {
          cash: revenueByPaymentMethod.cash?.total || 0,
          card: revenueByPaymentMethod.card?.total || 0,
          other: totalRevenueAmount - (revenueByPaymentMethod.cash?.total || 0) - (revenueByPaymentMethod.card?.total || 0)
        }
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Get profit & loss statement
app.get('/api/financial/profit-loss', (req, res) => {
  const { startDate, endDate, period = 'month', format = 'summary' } = req.query;
  
  const now = new Date();
  let calculatedStartDate, calculatedEndDate;
  
  if (startDate && endDate) {
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
  } else {
    switch (period) {
      case 'month':
      default:
        calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        calculatedStartDate = quarterStart.toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
      case 'year':
        calculatedStartDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
    }
  }
  
  const financialSummary = calculateFinancialSummary(calculatedStartDate, calculatedEndDate);
  
  // Detailed P&L breakdown
  const profitLossStatement = {
    period: { startDate: calculatedStartDate, endDate: calculatedEndDate, type: period },
    revenue: {
      accommodation: financialSummary.revenue.byType.accommodation,
      services: financialSummary.revenue.byType.services,
      other: financialSummary.revenue.byType.other,
      totalRevenue: financialSummary.revenue.total
    },
    operatingExpenses: {
      utilities: financialSummary.expenses.byCategory.utilities,
      maintenance: financialSummary.expenses.byCategory.maintenance,
      supplies: financialSummary.expenses.byCategory.supplies,
      marketing: financialSummary.expenses.byCategory.marketing,
      services: financialSummary.expenses.byCategory.services,
      totalOperatingExpenses: financialSummary.expenses.total - (financialSummary.expenses.byCategory.staff || 0)
    },
    staffExpenses: {
      wages: financialSummary.expenses.byCategory.staff || 0,
      totalStaffExpenses: financialSummary.expenses.byCategory.staff || 0
    },
    totalExpenses: financialSummary.expenses.total,
    grossProfit: financialSummary.profit.gross,
    netProfit: financialSummary.profit.gross, // Same as gross for now (no taxes calculated)
    margins: {
      grossMargin: financialSummary.profit.margin,
      netMargin: financialSummary.profit.margin,
      operatingMargin: financialSummary.revenue.total > 0 ? 
        (((financialSummary.revenue.total - (financialSummary.expenses.total - (financialSummary.expenses.byCategory.staff || 0))) / financialSummary.revenue.total) * 100).toFixed(2) : 0
    },
    kpis: {
      revenueGrowth: null, // Would need historical data
      expenseRatio: financialSummary.revenue.total > 0 ? 
        ((financialSummary.expenses.total / financialSummary.revenue.total) * 100).toFixed(2) : 0,
      breakEvenPoint: financialSummary.expenses.total, // Revenue needed to break even
      roi: financialSummary.expenses.total > 0 ? 
        ((financialSummary.profit.gross / financialSummary.expenses.total) * 100).toFixed(2) : 0
    }
  };
  
  console.log(`📊 P&L Statement generated: ${period} | Profit: LKR ${financialSummary.profit.gross.toLocaleString()}`);
  
  res.json({
    success: true,
    data: profitLossStatement,
    timestamp: new Date().toISOString()
  });
});

// Get cash flow analysis
app.get('/api/financial/cash-flow', (req, res) => {
  const { startDate, endDate, period = 'month' } = req.query;
  
  const now = new Date();
  let calculatedStartDate, calculatedEndDate;
  
  if (startDate && endDate) {
    calculatedStartDate = startDate;
    calculatedEndDate = endDate;
  } else {
    switch (period) {
      case 'month':
      default:
        calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        calculatedEndDate = now.toISOString().split('T')[0];
        break;
    }
  }
  
  // Get all financial transactions in period
  const cashInflows = revenueEntries.filter(r => 
    r.date >= calculatedStartDate && r.date <= calculatedEndDate && r.paymentStatus === 'completed'
  );
  
  const cashOutflows = financialExpenses.filter(e => 
    e.expenseDate >= calculatedStartDate && e.expenseDate <= calculatedEndDate && e.status === 'paid'
  );
  
  // Daily cash flow
  const dailyCashFlow = {};
  const dailyInflow = {};
  const dailyOutflow = {};
  
  // Initialize all dates in period with 0
  const startDateObj = new Date(calculatedStartDate);
  const endDateObj = new Date(calculatedEndDate);
  for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    dailyCashFlow[dateStr] = 0;
    dailyInflow[dateStr] = 0;
    dailyOutflow[dateStr] = 0;
  }
  
  // Add inflows
  cashInflows.forEach(revenue => {
    dailyInflow[revenue.date] += revenue.amount;
    dailyCashFlow[revenue.date] += revenue.amount;
  });
  
  // Subtract outflows
  cashOutflows.forEach(expense => {
    dailyOutflow[expense.expenseDate] += expense.amount;
    dailyCashFlow[expense.expenseDate] -= expense.amount;
  });
  
  // Calculate running balance
  const runningBalance = {};
  let balance = 0;
  Object.keys(dailyCashFlow).sort().forEach(date => {
    balance += dailyCashFlow[date];
    runningBalance[date] = balance;
  });
  
  const totalInflow = cashInflows.reduce((sum, r) => sum + r.amount, 0);
  const totalOutflow = cashOutflows.reduce((sum, e) => sum + e.amount, 0);
  const netCashFlow = totalInflow - totalOutflow;
  
  console.log(`💸 Cash flow analysis: Net flow LKR ${netCashFlow.toLocaleString()}`);
  
  res.json({
    success: true,
    data: {
      period: { startDate: calculatedStartDate, endDate: calculatedEndDate },
      summary: {
        totalInflow: totalInflow,
        totalOutflow: totalOutflow,
        netCashFlow: netCashFlow,
        inflowCount: cashInflows.length,
        outflowCount: cashOutflows.length
      },
      dailyFlow: {
        inflow: dailyInflow,
        outflow: dailyOutflow,
        netFlow: dailyCashFlow,
        runningBalance: runningBalance
      },
      insights: {
        averageDailyInflow: totalInflow / Object.keys(dailyInflow).length,
        averageDailyOutflow: totalOutflow / Object.keys(dailyOutflow).length,
        cashFlowRatio: totalOutflow > 0 ? (totalInflow / totalOutflow).toFixed(2) : 'N/A',
        bestDay: Object.entries(dailyCashFlow).reduce((max, [date, flow]) => 
          flow > max.flow ? { date, flow } : max, { date: null, flow: -Infinity }),
        worstDay: Object.entries(dailyCashFlow).reduce((min, [date, flow]) => 
          flow < min.flow ? { date, flow } : min, { date: null, flow: Infinity })
      }
    },
    timestamp: new Date().toISOString()
  });
});
// ===== PRICING MANAGEMENT ENDPOINTS =====

// Get pricing data
app.get('/api/pricing', (req, res) => {
  // Update LKR prices based on current exchange rate
  const updatedPricingData = {
    ...pricingData,
    units: pricingData.units.map(unit => ({
      ...unit,
      basePricing: Object.entries(unit.basePricing).reduce((acc, [guestType, pricing]) => {
        acc[guestType] = {
          USD: pricing.USD,
          LKR: Math.round(pricing.USD * exchangeRate)
        };
        return acc;
      }, {})
    }))
  };

  res.json({
    success: true,
    data: updatedPricingData,
    exchangeRate: exchangeRate,
    timestamp: new Date().toISOString()
  });
});

// Update unit pricing
app.put('/api/pricing/:unitId', (req, res) => {
  const { unitId } = req.params;
  const { basePricing } = req.body;

  const unitIndex = pricingData.units.findIndex(u => u.id === unitId);
  
  if (unitIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Unit not found',
      timestamp: new Date().toISOString()
    });
  }

  // Update pricing with LKR conversion
  const updatedPricing = Object.entries(basePricing).reduce((acc, [guestType, pricing]) => {
    acc[guestType] = {
      USD: pricing.USD,
      LKR: Math.round(pricing.USD * exchangeRate)
    };
    return acc;
  }, {});

  pricingData.units[unitIndex].basePricing = updatedPricing;
  pricingData.units[unitIndex].lastUpdated = new Date().toISOString();
  
  // Update price range
  const usdPrices = Object.values(updatedPricing).map(p => p.USD);
  pricingData.units[unitIndex].priceRangeUSD = {
    min: Math.min(...usdPrices),
    max: Math.max(...usdPrices)
  };

  console.log(`💰 Updated pricing for ${unitId}`);

  res.json({
    success: true,
    data: pricingData.units[unitIndex],
    message: 'Pricing updated successfully',
    timestamp: new Date().toISOString()
  });
});

// ===== CALENDAR MANAGEMENT ENDPOINTS =====

// Get calendar data
app.get('/api/calendar', (req, res) => {
  const { startDate, endDate, unitId } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'startDate and endDate are required',
      timestamp: new Date().toISOString()
    });
  }

  const unitsToProcess = unitId ? 
    halcyonRestUnits.filter(u => u.id === unitId) : 
    halcyonRestUnits;

  const calendar = unitsToProcess.map(unit => ({
    unitId: unit.id,
    unitName: unit.name,
    dates: generateCalendarDays(startDate, endDate, unit.id)
  }));

  res.json({
    success: true,
    data: {
      startDate,
      endDate,
      calendar,
      totalOverrides: calendarOverrides.length,
      externalIntegrations: externalCalendars.length
    },
    timestamp: new Date().toISOString()
  });
});

// Block dates
app.post('/api/calendar/block', (req, res) => {
  const { unitId, startDate, endDate, reason = 'Manual block' } = req.body;

  if (!unitId || !startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: 'unitId, startDate, and endDate are required',
      timestamp: new Date().toISOString()
    });
  }

  const blockOverride = {
    id: 'block_' + Date.now(),
    unitId,
    type: 'block',
    startDate,
    endDate,
    reason,
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };

  calendarOverrides.push(blockOverride);

  console.log(`🚫 Blocked dates ${startDate} to ${endDate} for ${unitId}: ${reason}`);

  res.status(201).json({
    success: true,
    data: blockOverride,
    message: 'Dates blocked successfully',
    timestamp: new Date().toISOString()
  });
});

// Set custom pricing for date range
app.post('/api/calendar/pricing', (req, res) => {
  const { unitId, startDate, endDate, pricing, reason = 'Special rate' } = req.body;

  if (!unitId || !startDate || !endDate || !pricing) {
    return res.status(400).json({
      success: false,
      message: 'unitId, startDate, endDate, and pricing are required',
      timestamp: new Date().toISOString()
    });
  }

  const pricingOverride = {
    id: 'pricing_' + Date.now(),
    unitId,
    type: 'pricing',
    startDate,
    endDate,
    pricing,
    reason,
    createdAt: new Date().toISOString(),
    createdBy: 'admin'
  };

  calendarOverrides.push(pricingOverride);

  console.log(`💰 Set custom pricing ${startDate} to ${endDate} for ${unitId}: ${reason}`);

  res.status(201).json({
    success: true,
    data: pricingOverride,
    message: 'Custom pricing set successfully',
    timestamp: new Date().toISOString()
  });
});

// Get calendar overrides
app.get('/api/calendar/overrides', (req, res) => {
  const { unitId, type } = req.query;
  
  let filteredOverrides = calendarOverrides;
  
  if (unitId) {
    filteredOverrides = filteredOverrides.filter(o => o.unitId === unitId);
  }
  
  if (type) {
    filteredOverrides = filteredOverrides.filter(o => o.type === type);
  }
  
  res.json({
    success: true,
    data: {
      overrides: filteredOverrides,
      total: filteredOverrides.length
    },
    timestamp: new Date().toISOString()
  });
});

// Remove calendar override
app.delete('/api/calendar/overrides/:overrideId', (req, res) => {
  const { overrideId } = req.params;
  
  const overrideIndex = calendarOverrides.findIndex(o => o.id === overrideId);
  
  if (overrideIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Override not found',
      timestamp: new Date().toISOString()
    });
  }
  
  const removedOverride = calendarOverrides.splice(overrideIndex, 1)[0];
  
  console.log(`🗑️ Removed calendar override: ${removedOverride.id}`);
  
  res.json({
    success: true,
    data: removedOverride,
    message: 'Override removed successfully',
    timestamp: new Date().toISOString()
  });
});

// ===== EXTERNAL CALENDAR INTEGRATION ENDPOINTS =====

// Add external calendar integration
app.post('/api/calendar/external', (req, res) => {
  const { unitId, platform, calendarUrl, name, syncStrategy = 'import_only' } = req.body;

  if (!unitId || !platform || !calendarUrl) {
    return res.status(400).json({
      success: false,
      message: 'unitId, platform, and calendarUrl are required',
      timestamp: new Date().toISOString()
    });
  }

  const integration = {
    id: 'ext_' + Date.now(),
    unitId,
    platform,
    calendarUrl,
    name: name || `${platform} - ${unitId}`,
    syncStrategy,
    status: 'active',
    blockedDates: [],
    lastSyncAt: null,
    createdAt: new Date().toISOString()
  };

  externalCalendars.push(integration);

  console.log(`🔗 Added ${platform} calendar integration for ${unitId}`);

  res.status(201).json({
    success: true,
    data: integration,
    message: 'External calendar integration added successfully',
    timestamp: new Date().toISOString()
  });
});

// Get external calendar integrations
app.get('/api/calendar/external', (req, res) => {
  const { unitId, platform } = req.query;
  
  let filteredIntegrations = externalCalendars;
  
  if (unitId) {
    filteredIntegrations = filteredIntegrations.filter(i => i.unitId === unitId);
  }
  
  if (platform) {
    filteredIntegrations = filteredIntegrations.filter(i => i.platform === platform);
  }
  
  res.json({
    success: true,
    data: {
      integrations: filteredIntegrations,
      total: filteredIntegrations.length
    },
    timestamp: new Date().toISOString()
  });
});

// Sync external calendar
app.post('/api/calendar/external/:integrationId/sync', (req, res) => {
  const { integrationId } = req.params;
  
  const integration = externalCalendars.find(i => i.id === integrationId);
  
  if (!integration) {
    return res.status(404).json({
      success: false,
      message: 'Integration not found',
      timestamp: new Date().toISOString()
    });
  }

  // Simulate sync process
  integration.lastSyncAt = new Date().toISOString();
  integration.status = 'synced';
  
  // Simulate some blocked dates
  const syncedDates = Math.floor(Math.random() * 10) + 1;
  
  console.log(`🔄 Synced ${integration.platform} calendar for ${integration.unitId}: ${syncedDates} dates`);

  res.json({
    success: true,
    data: {
      integration,
      syncedDates,
      lastSyncAt: integration.lastSyncAt
    },
    message: 'Calendar synced successfully',
    timestamp: new Date().toISOString()
  });
});

// Remove external calendar integration
app.delete('/api/calendar/external/:integrationId', (req, res) => {
  const { integrationId } = req.params;
  
  const integrationIndex = externalCalendars.findIndex(i => i.id === integrationId);
  
  if (integrationIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Integration not found',
      timestamp: new Date().toISOString()
    });
  }
  
  const removedIntegration = externalCalendars.splice(integrationIndex, 1)[0];
  
  console.log(`🗑️ Removed external calendar integration: ${removedIntegration.platform} - ${removedIntegration.unitId}`);
  
  res.json({
    success: true,
    data: removedIntegration,
    message: 'Integration removed successfully',
    timestamp: new Date().toISOString()
  });
});

// Sync all external calendars
app.post('/api/calendar/external/sync-all', (req, res) => {
  const now = new Date().toISOString();
  let successfulSyncs = 0;
  let failedSyncs = 0;
  
  externalCalendars.forEach(integration => {
    try {
      integration.lastSyncAt = now;
      integration.status = 'synced';
      successfulSyncs++;
    } catch (error) {
      integration.status = 'error';
      failedSyncs++;
    }
  });
  
  console.log(`🔄 Bulk sync completed: ${successfulSyncs} successful, ${failedSyncs} failed`);
  
  res.json({
    success: true,
    data: {
      successfulSyncs,
      failedSyncs,
      totalIntegrations: externalCalendars.length
    },
    message: 'Bulk sync completed',
    timestamp: new Date().toISOString()
  });
});
// DEBUGGING AND FIXING THE EXPENSE APPROVAL SYSTEM

// 1. First, let's add a debug endpoint to see what's in the financialExpenses array
app.get('/api/expenses/debug', (req, res) => {
  console.log('🔍 DEBUGGING EXPENSES:');
  console.log('Total expenses in array:', financialExpenses.length);
  console.log('All expenses:', JSON.stringify(financialExpenses, null, 2));
  
  const pendingExpenses = financialExpenses.filter(e => e.status === 'pending');
  console.log('Pending expenses count:', pendingExpenses.length);
  console.log('Pending expenses:', JSON.stringify(pendingExpenses, null, 2));
  
  const expensesByStatus = {
    pending: financialExpenses.filter(e => e.status === 'pending').length,
    approved: financialExpenses.filter(e => e.status === 'approved').length,
    rejected: financialExpenses.filter(e => e.status === 'rejected').length,
    paid: financialExpenses.filter(e => e.status === 'paid').length
  };
  
  res.json({
    success: true,
    debug: {
      totalExpenses: financialExpenses.length,
      allExpenses: financialExpenses,
      pendingCount: pendingExpenses.length,
      pendingExpenses: pendingExpenses,
      expensesByStatus: expensesByStatus
    },
    timestamp: new Date().toISOString()
  });
});

// 2. Enhanced expense creation with better logging
app.post('/api/expenses/enhanced', (req, res) => {
  console.log('💸 Creating new expense with data:', req.body);
  
  const {
    category,
    subcategory,
    description,
    amount,
    currency = 'LKR',
    expenseDate,
    paymentMethod,
    vendor,
    invoiceNumber,
    invoiceFile, // This is MANDATORY
    receiptFile,
    isRecurring = false,
    recurringFrequency,
    budgetCategory,
    taxDeductible = true,
    tags,
    notes
  } = req.body;
  
  // Strict validation - Invoice file is mandatory
  if (!category || !description || !amount || !vendor || !invoiceNumber || !invoiceFile) {
    console.log('❌ Validation failed:', {
      category: !category,
      description: !description,
      amount: !amount,
      vendor: !vendor,
      invoiceNumber: !invoiceNumber,
      invoiceFile: !invoiceFile
    });
    
    return res.status(400).json({
      success: false,
      message: 'Category, description, amount, vendor, invoice number, and invoice file are required',
      missingFields: {
        category: !category,
        description: !description,
        amount: !amount,
        vendor: !vendor,
        invoiceNumber: !invoiceNumber,
        invoiceFile: !invoiceFile
      },
      note: 'Invoice file upload is mandatory for all expenses',
      timestamp: new Date().toISOString()
    });
  }
  
  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be greater than 0',
      timestamp: new Date().toISOString()
    });
  }
  
  // Convert amount to LKR if needed
  const amountLKR = currency === 'USD' ? amount * exchangeRate : amount;
  const amountUSD = currency === 'USD' ? amount : amount / exchangeRate;
  
  // Calculate next due date for recurring expenses
  let nextDueDate = null;
  if (isRecurring && recurringFrequency) {
    const currentDate = new Date(expenseDate || new Date());
    switch (recurringFrequency) {
      case 'monthly':
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
        break;
      case 'quarterly':
        nextDueDate = new Date(currentDate.setMonth(currentDate.getMonth() + 3));
        break;
      case 'yearly':
        nextDueDate = new Date(currentDate.setFullYear(currentDate.getFullYear() + 1));
        break;
    }
    nextDueDate = nextDueDate.toISOString().split('T')[0];
  }
  
  const expenseId = 'exp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  const expense = {
    id: expenseId,
    category: category,
    subcategory: subcategory || '',
    description: description,
    amount: amountLKR,
    amountUSD: amountUSD,
    currency: 'LKR',
    expenseDate: expenseDate || new Date().toISOString().split('T')[0],
    paymentMethod: paymentMethod || 'cash',
    vendor: vendor,
    invoiceNumber: invoiceNumber,
    invoiceFile: invoiceFile, // URL or file path - MANDATORY
    receiptFile: receiptFile || null,
    approvedBy: null, // Will be set when approved
    approvedDate: null,
    status: 'pending', // All expenses start as pending approval
    isRecurring: isRecurring,
    recurringFrequency: recurringFrequency || null,
    nextDueDate: nextDueDate,
    budgetCategory: budgetCategory || category,
    taxDeductible: taxDeductible,
    tags: Array.isArray(tags) ? tags : [category],
    notes: notes || '',
    createdBy: 'staff_1', // Should come from authenticated user
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add to array
  financialExpenses.push(expense);
  
  console.log('✅ Expense created successfully:', {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    status: expense.status,
    vendor: expense.vendor
  });
  
  console.log('📊 Total expenses now:', financialExpenses.length);
  console.log('📊 Pending expenses now:', financialExpenses.filter(e => e.status === 'pending').length);
  
  res.status(201).json({
    success: true,
    data: expense,
    message: 'Expense created successfully and is pending approval',
    debug: {
      totalExpenses: financialExpenses.length,
      pendingExpenses: financialExpenses.filter(e => e.status === 'pending').length
    },
    timestamp: new Date().toISOString()
  });
});

// 3. Enhanced pending expenses endpoint with better logging
app.get('/api/expenses/pending-approval/enhanced', (req, res) => {
  console.log('🔍 Getting pending expenses...');
  console.log('Total expenses in array:', financialExpenses.length);
  
  const pendingExpenses = financialExpenses.filter(e => {
    console.log(`Checking expense ${e.id}: status = "${e.status}"`);
    return e.status === 'pending';
  });
  
  console.log('Found pending expenses:', pendingExpenses.length);
  
  const totalPendingAmount = pendingExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  const responseData = {
    expenses: pendingExpenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    summary: {
      totalPending: pendingExpenses.length,
      totalPendingAmount: totalPendingAmount,
      totalPendingAmountUSD: totalPendingAmount / exchangeRate,
      oldestPending: pendingExpenses.length > 0 ? 
        pendingExpenses.reduce((oldest, e) => new Date(e.createdAt) < new Date(oldest.createdAt) ? e : oldest).createdAt : null
    }
  };
  
  console.log('Returning pending expenses data:', {
    count: responseData.expenses.length,
    totalAmount: totalPendingAmount
  });
  
  res.json({
    success: true,
    data: responseData,
    debug: {
      totalExpensesInSystem: financialExpenses.length,
      pendingCount: pendingExpenses.length,
      allStatuses: financialExpenses.map(e => ({ id: e.id, status: e.status, description: e.description }))
    },
    timestamp: new Date().toISOString()
  });
});

// 4. Enhanced approval endpoint with better error handling
app.put('/api/expenses/:expenseId/approve/enhanced', (req, res) => {
  const { expenseId } = req.params;
  const { action, reason, approvedBy = 'staff_1' } = req.body;
  
  console.log(`🔍 Attempting to ${action} expense: ${expenseId}`);
  console.log('Available expenses:', financialExpenses.map(e => ({ id: e.id, status: e.status })));
  
  if (!action || !['approve', 'reject'].includes(action)) {
    return res.status(400).json({
      success: false,
      message: 'Action must be either "approve" or "reject"',
      timestamp: new Date().toISOString()
    });
  }
  
  const expenseIndex = financialExpenses.findIndex(e => e.id === expenseId);
  
  console.log('Found expense at index:', expenseIndex);
  
  if (expenseIndex === -1) {
    console.log('❌ Expense not found!');
    return res.status(404).json({
      success: false,
      message: 'Expense not found',
      debug: {
        searchedId: expenseId,
        availableIds: financialExpenses.map(e => e.id)
      },
      timestamp: new Date().toISOString()
    });
  }
  
  const expense = financialExpenses[expenseIndex];
  console.log('Found expense:', { id: expense.id, status: expense.status, description: expense.description });
  
  if (expense.status !== 'pending') {
    console.log(`❌ Expense status is ${expense.status}, not pending`);
    return res.status(400).json({
      success: false,
      message: 'Only pending expenses can be approved or rejected',
      currentStatus: expense.status,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update expense status
  const oldStatus = expense.status;
  financialExpenses[expenseIndex].status = action === 'approve' ? 'approved' : 'rejected';
  financialExpenses[expenseIndex].approvedBy = approvedBy;
  financialExpenses[expenseIndex].approvedDate = new Date().toISOString();
  financialExpenses[expenseIndex].updatedAt = new Date().toISOString();
  
  if (reason) {
    financialExpenses[expenseIndex].notes = (financialExpenses[expenseIndex].notes || '') + 
      `\n[${action.toUpperCase()}: ${reason}]`;
  }
  
  console.log(`✅ Expense ${action}d successfully:`, {
    id: expenseId,
    oldStatus: oldStatus,
    newStatus: financialExpenses[expenseIndex].status,
    approvedBy: approvedBy
  });
  
  const actionIcon = action === 'approve' ? '✅' : '❌';
  console.log(`${actionIcon} Expense ${action}d: ${expenseId} by ${approvedBy}`);
  
  res.json({
    success: true,
    data: financialExpenses[expenseIndex],
    message: `Expense ${action}d successfully`,
    debug: {
      oldStatus: oldStatus,
      newStatus: financialExpenses[expenseIndex].status,
      remainingPending: financialExpenses.filter(e => e.status === 'pending').length
    },
    timestamp: new Date().toISOString()
  });
});

// 5. Quick test endpoint to create a sample expense for testing
app.post('/api/expenses/create-test', (req, res) => {
  const testExpense = {
    id: 'exp_test_' + Date.now(),
    category: 'utilities',
    subcategory: 'electricity',
    description: 'Test electricity bill for debugging',
    amount: 15000,
    amountUSD: 15000 / exchangeRate,
    currency: 'LKR',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    vendor: 'Test Electric Company',
    invoiceNumber: 'TEST_001',
    invoiceFile: '/test/invoice.pdf',
    receiptFile: null,
    approvedBy: null,
    approvedDate: null,
    status: 'pending',
    isRecurring: false,
    recurringFrequency: null,
    nextDueDate: null,
    budgetCategory: 'utilities',
    taxDeductible: true,
    tags: ['utilities', 'test'],
    notes: 'Test expense for debugging approval system',
    createdBy: 'staff_1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  financialExpenses.push(testExpense);
  
  console.log('🧪 Created test expense:', testExpense.id);
  console.log('📊 Total expenses now:', financialExpenses.length);
  console.log('📊 Pending expenses now:', financialExpenses.filter(e => e.status === 'pending').length);
  
  res.status(201).json({
    success: true,
    data: testExpense,
    message: 'Test expense created for debugging',
    debug: {
      totalExpenses: financialExpenses.length,
      pendingExpenses: financialExpenses.filter(e => e.status === 'pending').length
    },
    timestamp: new Date().toISOString()
  });
});
// Export calendar (iCal format)
app.get('/api/calendar/export/:unitId', (req, res) => {
  const { unitId } = req.params;
  const { format = 'ical' } = req.query;
  
  const unit = halcyonRestUnits.find(u => u.id === unitId);
  
  if (!unit) {
    return res.status(404).json({
      success: false,
      message: 'Unit not found',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generate basic iCal content
  const unitReservations = reservations.filter(r => r.unitId === unitId && r.status !== 'cancelled');
  
  let icalContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Halcyon Rest//Calendar Export//EN',
    `CALSCALE:GREGORIAN`,
    `X-WR-CALNAME:${unit.name} - Reservations`,
    `X-WR-CALDESC:Reservation calendar for ${unit.name}`
  ];
  
  unitReservations.forEach(reservation => {
    const startDate = reservation.dates.checkIn.replace(/-/g, '');
    const endDate = reservation.dates.checkOut.replace(/-/g, '');
    
    icalContent.push(
      'BEGIN:VEVENT',
      `UID:${reservation.id}@halcyonrest.com`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:Reserved - ${reservation.guestInfo.bookerName}`,
      `DESCRIPTION:Confirmation: ${reservation.confirmationNumber}\\nGuests: ${reservation.guestInfo.adults} adults, ${reservation.guestInfo.children} children\\nStatus: ${reservation.status}`,
      `STATUS:CONFIRMED`,
      `TRANSP:OPAQUE`,
      'END:VEVENT'
    );
  });
  
  icalContent.push('END:VCALENDAR');
  
  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="${unitId}-calendar.ics"`);
  res.send(icalContent.join('\r\n'));
});

// ===== SEASONAL RATES ENDPOINTS =====

// Get seasonal rates
app.get('/api/calendar/seasonal-rates', (req, res) => {
  const { unitId } = req.query;
  
  let filteredRates = seasonalRates;
  
  if (unitId) {
    filteredRates = filteredRates.filter(r => r.unitId === unitId);
  }
  
  res.json({
    success: true,
    data: {
      seasonalRates: filteredRates,
      total: filteredRates.length
    },
    timestamp: new Date().toISOString()
  });
});

// Add seasonal rate
app.post('/api/calendar/seasonal-rates', (req, res) => {
  const { unitId, name, startDate, endDate, multiplier, description } = req.body;

  if (!unitId || !name || !startDate || !endDate || !multiplier) {
    return res.status(400).json({
      success: false,
      message: 'unitId, name, startDate, endDate, and multiplier are required',
      timestamp: new Date().toISOString()
    });
  }

  const seasonalRate = {
    id: 'seasonal_' + Date.now(),
    unitId,
    name,
    startDate,
    endDate,
    multiplier: parseFloat(multiplier),
    description: description || '',
    createdAt: new Date().toISOString()
  };

  seasonalRates.push(seasonalRate);

  console.log(`📈 Added seasonal rate ${name} for ${unitId}: ${multiplier}x`);

  res.status(201).json({
    success: true,
    data: seasonalRate,
    message: 'Seasonal rate added successfully',
    timestamp: new Date().toISOString()
  });
});

// Remove seasonal rate
app.delete('/api/calendar/seasonal-rates/:rateId', (req, res) => {
  const { rateId } = req.params;
  
  const rateIndex = seasonalRates.findIndex(r => r.id === rateId);
  
  if (rateIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Seasonal rate not found',
      timestamp: new Date().toISOString()
    });
  }
  
  const removedRate = seasonalRates.splice(rateIndex, 1)[0];
  
  console.log(`🗑️ Removed seasonal rate: ${removedRate.name}`);
  
  res.json({
    success: true,
    data: removedRate,
    message: 'Seasonal rate removed successfully',
    timestamp: new Date().toISOString()
  });
});

// ===== ERROR HANDLING & SERVER START =====

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Handle 404 routes
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/properties',
      'GET /api/reservations',
      'POST /api/reservations',
      'PUT /api/reservations/:id',
      'GET /api/reservations/:id',
      'GET /api/reservations/availability/check',
      'GET /api/messages',
      'POST /api/messages',
      'GET /api/messages/conversations',
      'POST /api/messages/:id/reply',
      'PUT /api/messages/:id/read',
      'GET /api/dashboard',
      'GET /api/inventory',
      'PUT /api/inventory/:id',
      'GET /api/staff',
      'GET /api/notifications',
      'POST /api/notifications'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server and initialize database
// Start server and initialize database
const startServer = async () => {
  try {
    console.log('🔄 Connecting to PostgreSQL database...');
    console.log(`📍 Connecting to: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
    
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully!');
    
    // Sync database (create tables if they don't exist)
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database synchronized!');
    
    
    // Add sample messages
    const sampleMessages = [
      {
        id: 'msg_sample_1',
        conversationId: 'conv_staff_general',
        senderId: 'staff_1',
        senderName: 'Manager Admin',
        senderRole: 'manager',
        receiverId: null,
        receiverName: null,
        subject: 'Welcome to Halcyon Rest Messaging',
        message: 'This is the new messaging system for all staff communications.',
        type: 'staff',
        priority: 'normal',
        attachments: [],
        reservationId: null,
        timestamp: new Date().toISOString(),
        read: false,
        delivered: true,
        edited: false,
        replies: []
      }
    ];
    
    messages.push(...sampleMessages);
    
    // Start server
    app.listen(PORT, () => {
      console.log('\n🎉 ========================================');
      console.log('🏨 HALCYON REST MANAGEMENT SYSTEM v2.0');
      console.log('🎉 ========================================');
      console.log(`🚀 Server URL: http://localhost:${PORT}`);
      console.log(`🗄️  Database: PostgreSQL v17 (${process.env.DB_NAME})`);
      console.log(`💱 Exchange Rate: 1 USD = ${exchangeRate} LKR`);
      console.log('📍 Enhanced Financial Dashboard Ready!');
      console.log('   💰 Financial Dashboard: http://localhost:3001/api/dashboard/financial');
      console.log('   💰 Revenue API: http://localhost:3001/api/revenue');
      console.log('   💸 Expenses API: http://localhost:3001/api/expenses');
      console.log('   📊 Financial Reports: http://localhost:3001/api/financial/summary');
      console.log('🔧 Enhanced expense debugging endpoints added!');
      console.log('🕐 Timezone fixes applied - Server now uses IST (Asia/Kolkata)');
console.log('📅 Test endpoints added:');
console.log('   POST /api/test-data/create-today - Create test data for today');
console.log('   GET /api/debug/timezone - Debug timezone information');
console.log('📍 Debug endpoints:');
console.log('   GET /api/expenses/debug - See all expenses');
console.log('   POST /api/expenses/create-test - Create test expense');
console.log('   GET /api/expenses/pending-approval/enhanced - Get pending with debug');
console.log('   PUT /api/expenses/{id}/approve/enhanced - Approve with debug');
console.log('🕐 Current IST Time:', getISTDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
console.log('📅 Current IST Date String:', getISTDateString());
      console.log('🎉 ========================================\n');
    });
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Verify PostgreSQL is running: sc query postgresql-x64-17');
    console.error('2. Test connection manually:');
    console.error(`   "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe" -U ${process.env.DB_USER} -d ${process.env.DB_NAME} -h ${process.env.DB_HOST}`);
    console.error('3. Check .env file contains correct credentials');
    process.exit(1);
  }
};
initializeFinancialData();
startServer();