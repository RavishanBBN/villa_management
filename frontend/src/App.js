import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';
import './styles/NeonDarkTheme.css';
import './styles/BeautifulEnhancements.css';
import LoadingScreen from './components/LoadingScreen';
import ProfessionalBackground from './components/ProfessionalBackground';
import InventoryManagement from './components/tabs/InventoryManagement';
import InventoryModals from './components/modals/InventoryModals';
import Accounting from './components/tabs/Accounting';
import InvoiceManagement from './components/tabs/InvoiceManagement';
import GuestManagement from './components/tabs/GuestManagement';
import AnalyticsReports from './components/tabs/AnalyticsReports';
import NotificationsEmail from './components/tabs/NotificationsEmail';
import UploadManagement from './components/tabs/UploadManagement';
import { useToast } from './components/common/Toast';
// Complete Chart.js imports - register ALL required components
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

import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ALL Chart.js components (this should be the ONLY ChartJS.register call)
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

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));
  const [showLoginModal, setShowLoginModal] = useState(!localStorage.getItem('authToken'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // User Management States
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'front_desk',
    permissions: []
  });
  const [editingUser, setEditingUser] = useState(null);
  const [userFilter, setUserFilter] = useState({ role: 'all', status: 'active', search: '' });
  
  // Profile Management States
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // State management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [currencyRate, setCurrencyRate] = useState(301);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // NEW: Calendar and Pricing Management States
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showExternalCalendarModal, setShowExternalCalendarModal] = useState(false);
  
  // Financial management states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false); // ✅ This is correct
  const [expenses, setExpenses] = useState([]);
  const [revenue, setRevenue] = useState([]); // ✅ This is correct
  const [financialReports, setFinancialReports] = useState(null);
  const [pendingExpenses, setPendingExpenses] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [animationTriggers, setAnimationTriggers] = useState({
    statsUpdated: false,
    newReservation: false
  });
  // Add these state declarations with your other useState declarations
  const [financialChartData, setFinancialChartData] = useState(null);
  const [detailedProfitLoss, setDetailedProfitLoss] = useState(null);
  const [cashFlowData, setCashFlowData] = useState(null);
  const [showExpenseListModal, setShowExpenseListModal] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [lastDataUpdate, setLastDataUpdate] = useState(Date.now());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Inventory Management States
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryDashboard, setInventoryDashboard] = useState(null);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [inventoryFilter, setInventoryFilter] = useState({
    category: 'all',
    status: 'active',
    search: '',
    lowStock: false
  });
  const [inventoryForm, setInventoryForm] = useState({
    name: '',
    category: 'housekeeping',
    subcategory: '',
    description: '',
    currentStock: 0,
    minStock: 5,
    maxStock: '',
    unit: 'pieces',
    costPerUnit: '',
    supplierName: '',
    supplierContact: '',
    location: '',
    notes: ''
  });
  const [stockTransactionForm, setStockTransactionForm] = useState({
    quantity: '',
    unitCost: '',
    supplierName: '',
    invoiceNumber: '',
    reason: '',
    usedBy: '',
    propertyId: '',
    notes: ''
  });

  // Invoice Management States
  const [invoices, setInvoices] = useState([]);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showUploadInvoiceModal, setShowUploadInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceFilter, setInvoiceFilter] = useState({
    type: 'all',
    paymentStatus: 'all',
    search: '',
    startDate: '',
    endDate: ''
  });
  const [uploadInvoiceForm, setUploadInvoiceForm] = useState({
    type: 'supplier_bill',
    amount: '',
    currency: 'LKR',
    issuedTo: '',
    category: '',
    notes: '',
    file: null
  });

  // Initial loading effect and data loading
  useEffect(() => {
    const initializeApp = async () => {
      // Don't load data if not authenticated
      if (!isAuthenticated) {
        setInitialLoading(false);
        return;
      }

      try {
        console.log('🚀 Starting app initialization...');
        
        // Load only essential data first
        await Promise.all([
          loadProperties().catch(e => console.warn('Properties load failed:', e)),
          loadReservations().catch(e => console.warn('Reservations load failed:', e)),
          loadCurrencyRate().catch(e => console.warn('Currency load failed:', e))
        ]);
        
        console.log('✅ Essential data loaded');
        
        // Load secondary data without blocking
        Promise.all([
          loadDashboardData().catch(e => console.warn('Dashboard load failed:', e)),
          loadMessages().catch(e => console.warn('Messages load failed:', e)),
          loadConversations().catch(e => console.warn('Conversations load failed:', e)),
          loadPricingData().catch(e => console.warn('Pricing load failed:', e)),
          loadCalendarOverrides().catch(e => console.warn('Calendar overrides load failed:', e)),
          loadExternalCalendars().catch(e => console.warn('External calendars load failed:', e)),
          loadSeasonalRates().catch(e => console.warn('Seasonal rates load failed:', e)),
          loadExpenses().catch(e => console.warn('Expenses load failed:', e)),
          loadRevenue().catch(e => console.warn('Revenue load failed:', e)),
          loadPendingExpenses().catch(e => console.warn('Pending expenses load failed:', e))
        ]).then(() => {
          console.log('✅ Secondary data loaded');
        });
        
        // Hide loading screen immediately after essential data
        console.log('✅ Hiding loading screen');
        setInitialLoading(false);
        
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        // Still hide loading screen even if there's an error
        setInitialLoading(false);
      }
    };

    initializeApp();
  }, [isAuthenticated]);

  // Load users when Users tab is active
  useEffect(() => {
    if (activeTab === 'users' && isAuthenticated) {
      loadUsers();
    }
  }, [activeTab, isAuthenticated]);

  // Financial Dashboard Chart States
  const [comprehensiveDashboard, setComprehensiveDashboard] = useState(null);
  const [interactiveProfitLoss, setInteractiveProfitLoss] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState(null);
  const [financialGoals, setFinancialGoals] = useState(null);
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('6months');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Chart visibility toggles
  const [dashboardCharts, setDashboardCharts] = useState({
    monthlyTrends: true,
    revenueBreakdown: true,
    expenseCategories: true,
    paymentMethods: true,
    unitPerformance: true,
    cashFlowAnalysis: true
  });

  // Export options
  const [exportOptions, setExportOptions] = useState({
    reportType: 'comprehensive',
    format: 'csv',
    startDate: '',
    endDate: '',
    includeCharts: false
  });
  const [selectedChartPeriod, setSelectedChartPeriod] = useState('6months');
  const [chartDateRange, setChartDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [visibleCharts, setVisibleCharts] = useState({
    revenue: true,
    expenses: true,
    profit: true,
    cashFlow: true,
    revenueBreakdown: true,
    expenseCategories: true,
    paymentMethods: true,
    trends: true
  });

  // Handle custom date range function
  const handleCustomDateRange = async (startDate, endDate) => {
  setCustomDateRange({ startDate, endDate });
  await handleDashboardCustomDateRange(startDate, endDate);
};
  // Enhanced expense form with validation
  const [expenseFormErrors, setExpenseFormErrors] = useState({});
  const [expenseFilePreview, setExpenseFilePreview] = useState(null);
  
  const [expenseFilters, setExpenseFilters] = useState({
    status: 'all',
    category: 'all',
    vendor: 'all',
    dateRange: 'all',
    amountRange: 'all',
    searchText: '',
    startDate: '',
    endDate: ''
  });

  const [sortBy, setSortBy] = useState('date_desc');

  // ✅ ADD REVENUE STATES HERE (after expense states)
  const [showRevenueListModal, setShowRevenueListModal] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [showRevenueDetailModal, setShowRevenueDetailModal] = useState(false);

  // Revenue form with validation
  const [revenueForm, setRevenueForm] = useState({
    type: 'services', // services, other, accommodation
    description: '',
    amount: '',
    currency: 'LKR',
    paymentMethod: 'cash',
    guestName: '',
    confirmationNumber: '',
    notes: '',
    tags: []
  });

  const [revenueFormErrors, setRevenueFormErrors] = useState({});

  // Revenue filtering states
  const [revenueFilters, setRevenueFilters] = useState({
    type: 'all',
    paymentMethod: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    amountRange: 'all',
    searchText: '',
    startDate: '',
    endDate: ''
  });

  const [revenueSortBy, setRevenueSortBy] = useState('date_desc');

  // Enhanced filtering function (this should remain as a function, not contain state declarations)
  const getFilteredAndSortedExpenses = () => {
    let filtered = expenses.filter(expense => {
      // Status filter
      if (expenseFilters.status !== 'all' && expense.status !== expenseFilters.status) {
        return false;
      }

      // Category filter
      if (expenseFilters.category !== 'all' && expense.category !== expenseFilters.category) {
        return false;
      }

      // Vendor filter
      if (expenseFilters.vendor !== 'all' && expense.vendor !== expenseFilters.vendor) {
        return false;
      }

      // Search text filter
      if (expenseFilters.searchText) {
        const searchLower = expenseFilters.searchText.toLowerCase();
        const searchableText = `${expense.description} ${expense.vendor} ${expense.invoiceNumber} ${expense.notes || ''}`.toLowerCase();
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }

      // Date range filter
      const expenseDate = new Date(expense.expenseDate);
      const today = new Date();
      
      if (expenseFilters.dateRange !== 'all') {
        switch (expenseFilters.dateRange) {
          case 'today':
            if (expenseDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'this_week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (expenseDate < weekAgo) return false;
            break;
          case 'this_month':
            if (expenseDate.getMonth() !== today.getMonth() || expenseDate.getFullYear() !== today.getFullYear()) return false;
            break;
          case 'last_month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            if (expenseDate < lastMonth || expenseDate >= thisMonth) return false;
            break;
          case 'custom':
            if (expenseFilters.startDate && expenseDate < new Date(expenseFilters.startDate)) return false;
            if (expenseFilters.endDate && expenseDate > new Date(expenseFilters.endDate)) return false;
            break;
        }
      }

      // Amount range filter
      if (expenseFilters.amountRange !== 'all') {
        const amount = expense.amount;
        switch (expenseFilters.amountRange) {
          case 'under_1000':
            if (amount >= 1000) return false;
            break;
          case '1000_5000':
            if (amount < 1000 || amount >= 5000) return false;
            break;
          case '5000_10000':
            if (amount < 5000 || amount >= 10000) return false;
            break;
          case '10000_25000':
            if (amount < 10000 || amount >= 25000) return false;
            break;
          case 'over_25000':
            if (amount < 25000) return false;
            break;
        }
      }

      return true;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.expenseDate) - new Date(a.expenseDate);
        case 'date_asc':
          return new Date(a.expenseDate) - new Date(b.expenseDate);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        case 'vendor_asc':
          return a.vendor.localeCompare(b.vendor);
        case 'status_asc':
          return a.status.localeCompare(b.status);
        default:
          return new Date(b.expenseDate) - new Date(a.expenseDate);
      }
    });

    return filtered;
  };

  // Continue with the rest of your existing code...

  // Get unique values for filter dropdowns
  const getUniqueCategories = () => {
    return [...new Set(expenses.map(e => e.category))].filter(Boolean);
  };

  const getUniqueVendors = () => {
    return [...new Set(expenses.map(e => e.vendor))].filter(Boolean);
  };

  const resetFilters = () => {
    setExpenseFilters({
      status: 'all',
      category: 'all',
      vendor: 'all',
      dateRange: 'all',
      amountRange: 'all',
      searchText: '',
      startDate: '',
      endDate: ''
    });
    setSortBy('date_desc');
  };

  // Form states for financial management
  const [enhancedExpenseForm, setEnhancedExpenseForm] = useState({
    category: 'utilities',
    subcategory: '',
    description: '',
    amount: '',
    currency: 'LKR',
    vendor: '',

    notes: ''
  });

  // Removed duplicate revenueForm declaration - already declared above around line 87
  // Calendar and pricing data states
  const [calendarData, setCalendarData] = useState(null);
  const [pricingData, setPricingData] = useState(null);
  const [externalCalendars, setExternalCalendars] = useState([]);
  const [calendarOverrides, setCalendarOverrides] = useState([]);
  const [seasonalRates, setSeasonalRates] = useState([]);
  // Initialize and fix existing data on server start
  const initializeFinancialData = () => {
  console.log('🔧 Initializing financial data...');
  
  // Fix existing revenue entries
  if (revenue && Array.isArray(revenue)) {
    revenue.forEach((entry, index) => {
      // Ensure numeric values
      entry.amount = parseFloat(entry.amount) || 0;
      entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / currencyRate;
      entry.exchangeRate = parseFloat(entry.exchangeRate) || currencyRate;
      
      // Ensure required fields
      if (!entry.id) entry.id = 'rev_fix_' + Date.now() + '_' + index;
      if (!entry.date) entry.date = new Date().toISOString().split('T')[0];
      if (!entry.paymentStatus) entry.paymentStatus = 'completed';
      if (!entry.currency) entry.currency = 'LKR';
    });
  }
  
  // Fix existing expense entries
  if (expenses && Array.isArray(expenses)) {
    expenses.forEach((entry, index) => {
      // Ensure numeric values
      entry.amount = parseFloat(entry.amount) || 0;
      entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / currencyRate;
      
      // Ensure required fields
      if (!entry.id) entry.id = 'exp_fix_' + Date.now() + '_' + index;
      if (!entry.expenseDate) entry.expenseDate = new Date().toISOString().split('T')[0];
      if (!entry.status) entry.status = 'pending';
    });
  }
  
  console.log(`✅ Fixed ${revenue?.length || 0} revenue entries and ${expenses?.length || 0} expense entries`);
};

  // Calendar view controls
  const [calendarView, setCalendarView] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    unitId: ''
  });

  // Form states for calendar and pricing management
  const [pricingForm, setPricingForm] = useState({
    unitId: '',
    basePricing: {
      guest1: { USD: 104, LKR: 31000 },
      guest2: { USD: 112, LKR: 33600 },
      guest3: { USD: 122, LKR: 36600 },
      guest4: { USD: 122, LKR: 36600 }
    }
  });

  const [dateBlockForm, setDateBlockForm] = useState({
    unitId: '',
    startDate: '',
    endDate: '',
    reason: 'Manual block'
  });

  const [customPricingForm, setCustomPricingForm] = useState({
    unitId: '',
    startDate: '',
    endDate: '',
    pricing: {
      guest1: { USD: 104 },
      guest2: { USD: 112 },
      guest3: { USD: 122 },
      guest4: { USD: 122 }
    },
    reason: 'Special rate'
  });

  const [externalCalendarForm, setExternalCalendarForm] = useState({
    unitId: '',
    platform: 'booking.com',
    calendarUrl: '',
    name: '',
    syncStrategy: 'import_only'
  });

  const [seasonalRateForm, setSeasonalRateForm] = useState({
    unitId: '',
    name: '',
    startDate: '',
    endDate: '',
    multiplier: 1.1,
    description: ''
  });

  // Current user (for messaging)
  const [currentUser] = useState({
    id: 'staff_1',
    name: 'Manager Admin',
    role: 'manager'
  });

  // Booking form state with children ages
  const [bookingForm, setBookingForm] = useState({
    propertyId: '',
    checkIn: '',
    checkOut: '',
    adults: 2,
    children: 0,
    childrenAges: [], // NEW: Array of children ages
    paymentCurrency: 'USD',
    source: 'direct',
    guestInfo: {
      bookerName: '',
      country: '',
      email: '',
      phone: ''
    },
    specialRequests: ''
  });

  // Availability state
  const [availabilityData, setAvailabilityData] = useState(null);
  const [availabilityDates, setAvailabilityDates] = useState({
    checkIn: '',
    checkOut: ''
  });

  // Message form state
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    receiverName: '',
    subject: '',
    message: '',
    type: 'staff',
    priority: 'normal',
    reservationId: ''
  });

  // ===== REVENUE MANAGEMENT FUNCTIONS =====
  // Revenue form validation
  const validateRevenueForm = () => {
    const errors = {};
    
    if (!revenueForm.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!revenueForm.amount || parseFloat(revenueForm.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }
    if (revenueForm.type === 'services' && !revenueForm.guestName?.trim()) {
      errors.guestName = 'Guest name is required for service revenue';
    }

    setRevenueFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

 const createRevenueEntry = async () => {
  if (!validateRevenueForm()) return;

  setLoading(true);
  setError('');

  try {
    const revenueData = {
      type: revenueForm.type,
      description: revenueForm.description,
      amount: parseFloat(revenueForm.amount),
      currency: revenueForm.currency,
      paymentMethod: revenueForm.paymentMethod,
      guestName: revenueForm.guestName || null,
      confirmationNumber: revenueForm.confirmationNumber || null,
      notes: revenueForm.notes || '',
      tags: Array.isArray(revenueForm.tags) ? revenueForm.tags : [revenueForm.type]
    };

    console.log('Creating revenue entry:', revenueData);

    const response = await axios.post(`${API_BASE_URL}/revenue/manual`, revenueData);

    if (response.data.success) {
      showEnhancedSuccess(`Revenue recorded successfully! Amount: ${formatCurrency(revenueData.amount)}`);
      setShowRevenueModal(false);
      resetRevenueForm();
      
      // 🔥 IMMEDIATE CHART UPDATE - Reload ALL financial data and charts
      await refreshAllFinancialData('Revenue added');
      
    } else {
      setError(response.data.message || 'Failed to create revenue entry');
    }
  } catch (error) {
    console.error('Revenue creation error:', error);
    if (error.response) {
      setError(`Server error: ${error.response.data.message || error.response.status}`);
    } else {
      setError('Failed to connect to server');
    }
  } finally {
    setLoading(false);
  }
};


  // Load comprehensive dashboard chart data
// Load comprehensive dashboard chart data
  const loadFinancialChartData = async (period = '6months') => {
    try {
      setLoading(true);
      console.log(`📊 Loading financial chart data for period: ${period}`);
      
      const response = await axios.get(`${API_BASE_URL}/financial/dashboard-charts`, {
        params: { period }
      });
      
      if (response.data.success) {
        setFinancialChartData(response.data.data);
        console.log('📊 Financial chart data loaded:', response.data.data);
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to load chart data');
      }
    } catch (error) {
      console.error('Failed to load financial chart data:', error);
      setError('Failed to load financial charts. Please check if the server is running.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load detailed P&L report
  const loadDetailedProfitLoss = async (startDate, endDate) => {
  try {
    setLoading(true);
    console.log(`📈 Loading detailed P&L report from ${startDate} to ${endDate}`);
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_BASE_URL}/financial/profit-loss-detailed`, { params });
    
    if (response.data.success) {
      setDetailedProfitLoss(response.data.data);
      console.log('📈 Detailed P&L loaded successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to load P&L report');
    }
  } catch (error) {
    console.error('Failed to load detailed P&L:', error);
    setError('Failed to load P&L report');
    return null;
  } finally {
    setLoading(false);
  }
  };

  // Load cash flow analysis
  const loadCashFlowAnalysis = async (startDate, endDate, granularity = 'daily') => {
  try {
    setLoading(true);
    console.log(`💸 Loading cash flow analysis: ${granularity} from ${startDate} to ${endDate}`);
    
    const params = { granularity };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_BASE_URL}/financial/cash-flow-analysis`, { params });
    
    if (response.data.success) {
      setCashFlowData(response.data.data);
      console.log('💸 Cash flow analysis loaded successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to load cash flow analysis');
    }
  } catch (error) {
    console.error('Failed to load cash flow analysis:', error);
    setError('Failed to load cash flow analysis');
    return null;
  } finally {
    setLoading(false);
  }
};

  // Export financial report (first version - keeping this one)
  const exportFinancialReportOriginal = async (reportType, startDate, endDate, format = 'csv') => {
  try {
    setLoading(true);
    console.log(`📄 Exporting ${reportType} report as ${format.toUpperCase()}`);
    
    const params = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_BASE_URL}/financial/export/${reportType}`, {
      params,
      responseType: 'blob' // Important for file downloads
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Set filename based on report type and dates
    const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'current_period';
    const filename = `${reportType}_report_${dateRange}.${format}`;
    link.setAttribute('download', filename);
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    setSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully! File: ${filename}`);
    
  } catch (error) {
    console.error('Failed to export report:', error);
    setError(`Failed to export ${reportType} report. Please try again.`);
  } finally {
    setLoading(false);
  }
};

  // Export multiple reports at once
  const exportMultipleReports = async (reportTypes, startDate, endDate, format = 'csv') => {
  try {
    setLoading(true);
    console.log(`📊 Exporting multiple reports: ${reportTypes.join(', ')}`);
    
    const exportPromises = reportTypes.map(reportType => 
      exportFinancialReport(reportType, startDate, endDate, format)
    );
    
    await Promise.all(exportPromises);
    setSuccess(`Successfully exported ${reportTypes.length} financial reports!`);
    
  } catch (error) {
    console.error('Failed to export multiple reports:', error);
    setError('Failed to export some reports. Please try again.');
  } finally {
    setLoading(false);
  }
  };

  // Generate and download financial summary PDF (placeholder for future implementation)
  const exportFinancialSummaryPDF = async (startDate, endDate) => {
  try {
    // For now, export as CSV since PDF generation requires additional setup
    console.log('📋 PDF export not yet implemented, exporting as CSV instead');
    await exportFinancialReport('profit-loss', startDate, endDate, 'csv');
    setSuccess('Financial summary exported as CSV. PDF export coming soon!');
  } catch (error) {
    console.error('Failed to export financial summary:', error);
    setError('Failed to export financial summary');
  }
};
// Reset revenue form
// ===== CHART DATA PROCESSING UTILITY FUNCTIONS =====
// Add these utility functions right after the export functions

// Format chart data for revenue/expense trends
  const formatTrendChartData = (monthlyData) => {
  if (!monthlyData || !Array.isArray(monthlyData)) return [];
  
  return monthlyData.map(month => ({
    month: month.month,
    revenue: Math.round(month.revenue),
    expenses: Math.round(month.expenses),
    profit: Math.round(month.profit),
    profitMargin: parseFloat(month.profitMargin.toFixed(1))
  }));
};

// Format pie chart data for revenue breakdown
  const formatRevenueBreakdownData = (revenueByType) => {
  if (!revenueByType) return [];
  
  return Object.entries(revenueByType)
    .filter(([type, amount]) => amount > 0)
    .map(([type, amount]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value: Math.round(amount),
      percentage: 0 // Will be calculated in the chart component
    }));
};

// Format pie chart data for expense categories
  const formatExpenseCategoriesData = (expensesByCategory) => {
  if (!expensesByCategory) return [];
  
  return Object.entries(expensesByCategory)
    .filter(([category, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: Math.round(amount),
      percentage: 0 // Will be calculated in the chart component
    }));
  };
  // Add comprehensive error handling for financial API calls
  const handleFinancialApiError = (error, componentName) => {
  console.error(`Failed to load ${componentName}:`, error);
  setError(`Failed to load ${componentName}. Please check if the server is running.`);
  return null;
};
  // Load comprehensive dashboard data
// Load comprehensive dashboard data
// ADD THESE CHART CONFIGURATION FUNCTIONS (place them around line 500, before your loadComprehensiveDashboard function)

// Chart configuration with error handling
  const getChartOptions = (type = 'line') => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${formatCurrency(value)}`;
          }
        }
      }
    }
  };

  if (type === 'line' || type === 'bar') {
    return {
      ...baseOptions,
      scales: {
        x: {
          grid: { 
            color: 'rgba(0,0,0,0.1)',
            drawBorder: false
          },
          ticks: { 
            color: '#6b7280',
            font: { size: 11 }
          }
        },
        y: {
          grid: { 
            color: 'rgba(0,0,0,0.1)',
            drawBorder: false
          },
          ticks: { 
            color: '#6b7280',
            font: { size: 11 },
            callback: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else if (value >= 1000) {
                return (value / 1000).toFixed(0) + 'K';
              }
              return value.toString();
            }
          },
          beginAtZero: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  return baseOptions;
};

// Safe chart data formatter
  const formatChartData = (data, type = 'line') => {
  if (!data || !Array.isArray(data)) {
    console.warn('Invalid chart data provided:', data);
    return null;
  }

  try {
    switch (type) {
      case 'line':
      case 'bar':
        return {
          labels: data.map(item => item.month || item.label || 'Unknown'),
          datasets: [
            {
              label: 'Revenue',
              data: data.map(item => item.revenue || 0),
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: type === 'line' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.8)',
              tension: type === 'line' ? 0.4 : undefined,
              fill: type === 'line'
            },
            {
              label: 'Expenses',
              data: data.map(item => item.expenses || 0),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: type === 'line' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.8)',
              tension: type === 'line' ? 0.4 : undefined,
              fill: type === 'line'
            },
            {
              label: 'Profit',
              data: data.map(item => item.profit || 0),
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: type === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
              tension: type === 'line' ? 0.4 : undefined,
              fill: type === 'line'
            }
          ]
        };

      case 'pie':
      case 'doughnut':
        if (typeof data === 'object' && !Array.isArray(data)) {
          const entries = Object.entries(data);
          return {
            labels: entries.map(([key]) => key.charAt(0).toUpperCase() + key.slice(1)),
            datasets: [{
              data: entries.map(([, value]) => value || 0),
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(59, 130, 246, 0.8)',
                'rgba(249, 115, 22, 0.8)',
                'rgba(139, 92, 246, 0.8)',
                'rgba(236, 72, 153, 0.8)',
                'rgba(34, 197, 94, 0.8)'
              ],
              borderColor: [
                'rgb(16, 185, 129)',
                'rgb(59, 130, 246)',
                'rgb(249, 115, 22)',
                'rgb(139, 92, 246)',
                'rgb(236, 72, 153)',
                'rgb(34, 197, 94)'
              ],
              borderWidth: 2
            }]
          };
        }
        break;

      default:
        console.warn('Unknown chart type:', type);
        return null;
    }
  } catch (error) {
    console.error('Error formatting chart data:', error);
    return null;
  }
};

// Safe chart renderer
  const renderChart = (ChartComponent, data, options, fallbackMessage = 'No data available') => {
  if (!data) {
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '0.875rem'
      }}>
        {fallbackMessage}
      </div>
    );
  }

  try {
    return <ChartComponent data={data} options={options} />;
  } catch (error) {
    console.error('Chart rendering error:', error);
    return (
      <div style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ef4444',
        fontSize: '0.875rem'
      }}>
        Chart rendering failed. Please try refreshing.
      </div>
    );
  }
};
const loadComprehensiveDashboard = async (period = '6months') => {
  try {
    setLoadingDashboard(true);
    console.log(`📊 Loading comprehensive dashboard for period: ${period}`);
    
    // First, try to get real data from the server
    const response = await axios.get(`${API_BASE_URL}/financial/dashboard-comprehensive`, {
      params: { period, granularity: 'monthly' }
    });
    
    if (response.data.success) {
      setComprehensiveDashboard(response.data.data);
      console.log('📊 Comprehensive dashboard loaded from server:', response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Server returned no data');
    }
  } catch (error) {
    console.error('❌ Server dashboard failed, creating from current revenue/expense data:', error);
    
    // If server fails, create charts from the CURRENT revenue/expense state
    // This ensures charts always reflect the latest data
    const realTimeData = await createChartDataFromCurrentState();
    setComprehensiveDashboard(realTimeData);
    console.log('📊 Using real-time calculated data:', realTimeData);
    return realTimeData;
  } finally {
    setLoadingDashboard(false);
  }
};
const createChartDataFromCurrentState = async () => {
  console.log('🔧 Creating chart data from current revenue/expense state...');
  console.log('Current revenue entries:', revenue.length);
  console.log('Current expense entries:', expenses.length);
  
  // Calculate monthly data from current revenue and expenses
  const monthlyData = {};
  const now = new Date();
  
  // Generate last 6 months
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyData[monthKey] = { revenue: 0, expenses: 0, profit: 0 };
  }
  
  // Process revenue data - ENSURE NUMERIC CONVERSION
  revenue.forEach(rev => {
    const revDate = new Date(rev.date || rev.createdAt);
    const monthKey = revDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (monthlyData[monthKey]) {
      // 🔥 FIX: Force numeric conversion
      monthlyData[monthKey].revenue += parseFloat(rev.amount) || 0;
    }
  });
  
  // Process expense data - ENSURE NUMERIC CONVERSION
  expenses.forEach(exp => {
    const expDate = new Date(exp.expenseDate || exp.createdAt);
    const monthKey = expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (monthlyData[monthKey]) {
      // 🔥 FIX: Force numeric conversion
      monthlyData[monthKey].expenses += parseFloat(exp.amount) || 0;
    }
  });
  
  // Calculate profit for each month
  Object.keys(monthlyData).forEach(month => {
    monthlyData[month].profit = monthlyData[month].revenue - monthlyData[month].expenses;
  });
  
  // Convert to array format for charts
  const timeSeriesData = Object.keys(monthlyData).map(month => ({
    month: month.split(' ')[0], // Just month name
    revenue: monthlyData[month].revenue,
    expenses: monthlyData[month].expenses,
    profit: monthlyData[month].profit
  }));
  
  // Calculate revenue breakdown by type - ENSURE NUMERIC
  const revenueByType = {};
  revenue.forEach(rev => {
    const type = rev.type || 'other';
    revenueByType[type] = (revenueByType[type] || 0) + (parseFloat(rev.amount) || 0);
  });
  
  // Calculate expense breakdown by category - ENSURE NUMERIC
  const expensesByCategory = {};
  expenses.forEach(exp => {
    const category = exp.category || 'other';
    expensesByCategory[category] = (expensesByCategory[category] || 0) + (parseFloat(exp.amount) || 0);
  });
  
  // Unit performance (simplified) - ENSURE NUMERIC
  const unitPerformance = [
    { 
      unitName: 'Ground Floor', 
      totalRevenue: revenue.filter(r => r.tags?.includes('ground-floor')).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) * 0.6,
      totalBookings: Math.floor(revenue.length * 0.6)
    },
    { 
      unitName: 'First Floor', 
      totalRevenue: revenue.filter(r => r.tags?.includes('first-floor')).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) || revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0) * 0.4,
      totalBookings: Math.floor(revenue.length * 0.4)
    }
  ];
  
  const chartData = {
    timeSeriesData,
    revenueBreakdown: {
      bySource: revenueByType
    },
    expenseBreakdown: {
      byCategory: expensesByCategory
    },
    unitPerformance
  };
  
  console.log('✅ Created real-time chart data:', chartData);
  return chartData;
};
  // Load interactive P&L data
// Load interactive P&L data
const loadInteractiveProfitLoss = async (startDate, endDate, compareWithPrevious = true) => {
  try {
    console.log(`📈 Loading interactive P&L`);
    
    const params = { compareWithPrevious };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_BASE_URL}/financial/profit-loss-interactive`, { params });
    
    if (response.data.success) {
      setInteractiveProfitLoss(response.data.data);
      console.log('📈 Interactive P&L loaded successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to load P&L data');
    }
  } catch (error) {
    console.error('Failed to load interactive P&L:', error);
    setInteractiveProfitLoss(null);
    return null;
  }
};

// Load advanced analytics with forecasting
const loadAdvancedAnalytics = async (period = '12months', includeForecasting = true) => {
  try {
    console.log(`🔮 Loading advanced analytics for ${period}`);
    
    const response = await axios.get(`${API_BASE_URL}/financial/analytics-advanced`, {
      params: { period, includeForecasting }
    });
    
    if (response.data.success) {
      setAdvancedAnalytics(response.data.data);
      console.log('🔮 Advanced analytics loaded successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to load analytics');
    }
  } catch (error) {
    console.error('Failed to load advanced analytics:', error);
    setAdvancedAnalytics(null);
    return null;
  }
};
  const diagnoseRevenueIssue = () => {
  console.log('🔍 DIAGNOSING REVENUE DISPLAY ISSUE:');
  
  // Check current revenue state
  console.log('📊 Current revenue state:');
  console.log('- Revenue array length:', revenue.length);
  console.log('- Total revenue amount:', revenue.reduce((sum, r) => sum + (r.amount || 0), 0));
  console.log('- Revenue entries:', revenue);
  
  // Check for your specific 785000 entry
  const targetEntry = revenue.find(r => r.amount === 785000);
  console.log('🎯 Your 785,000 LKR entry:');
  if (targetEntry) {
    console.log('✅ FOUND:', targetEntry);
    console.log('- Type:', targetEntry.type);
    console.log('- Date:', targetEntry.date);
    console.log('- Created:', targetEntry.createdAt);
  } else {
    console.log('❌ NOT FOUND in current revenue state');
    console.log('Available amounts:', revenue.map(r => r.amount));
  }
  
  // Check chart data
  console.log('📈 Chart data state:');
  console.log('- comprehensiveDashboard exists:', !!comprehensiveDashboard);
  if (comprehensiveDashboard) {
    console.log('- timeSeriesData:', comprehensiveDashboard.timeSeriesData);
    console.log('- revenueBreakdown:', comprehensiveDashboard.revenueBreakdown);
  }
  
  // Check real-time metrics
  console.log('⚡ Real-time metrics:');
  console.log('- realtimeMetrics exists:', !!realtimeMetrics);
  if (realtimeMetrics) {
    console.log('- Today revenue:', realtimeMetrics.today?.revenue);
    console.log('- Month revenue:', realtimeMetrics.thisMonth?.revenue);
  }
  
  // Calculate what the total should be
  const calculatedTotal = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  console.log('🧮 Calculated total from current data:', formatCurrency(calculatedTotal));
  console.log('📺 Dashboard shows:', 'LKR 1,612,000');
  console.log('💡 Match status:', calculatedTotal === 1612000 ? '✅ MATCH' : '❌ MISMATCH');
};

// Load real-time metrics
// Load real-time metrics
const loadRealtimeMetrics = async () => {
  try {
    console.log('⚡ Loading real-time financial metrics');
    
    // Try server first
    const response = await axios.get(`${API_BASE_URL}/financial/realtime-metrics`);
    
    if (response.data.success) {
      setRealtimeMetrics(response.data.data);
      console.log('⚡ Real-time metrics loaded from server');
      return response.data.data;
    } else {
      throw new Error('Server returned no metrics');
    }
  } catch (error) {
    console.error('❌ Server metrics failed, calculating from current data:', error);
    
    // Calculate metrics from current state - ENSURE NUMERIC CONVERSION
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Today's metrics - FORCE NUMERIC CONVERSION
    const todayRevenue = revenue.filter(r => r.date === todayStr).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const todayExpenses = expenses.filter(e => e.expenseDate === todayStr).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // This week's metrics - FORCE NUMERIC CONVERSION
    const weekRevenue = revenue.filter(r => new Date(r.date) >= weekAgo).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const weekExpenses = expenses.filter(e => new Date(e.expenseDate) >= weekAgo).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    // This month's metrics - FORCE NUMERIC CONVERSION
    const monthRevenue = revenue.filter(r => new Date(r.date) >= monthStart).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const monthExpenses = expenses.filter(e => new Date(e.expenseDate) >= monthStart).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const calculatedMetrics = {
      today: {
        revenue: todayRevenue,
        expenses: todayExpenses,
        netCashFlow: todayRevenue - todayExpenses,
        transactionCount: revenue.filter(r => r.date === todayStr).length + expenses.filter(e => e.expenseDate === todayStr).length
      },
      thisWeek: {
        revenue: weekRevenue,
        expenses: weekExpenses,
        netCashFlow: weekRevenue - weekExpenses,
        profitMargin: weekRevenue > 0 ? ((weekRevenue - weekExpenses) / weekRevenue) * 100 : 0
      },
      thisMonth: {
        revenue: monthRevenue,
        expenses: monthExpenses,
        netCashFlow: monthRevenue - monthExpenses,
        profitMargin: monthRevenue > 0 ? ((monthRevenue - monthExpenses) / monthRevenue) * 100 : 0
      },
      cashPosition: {
        current: monthRevenue - monthExpenses // Simplified
      },
      alerts: {
        lowCashWarning: false,
        pendingExpenseCount: expenses.filter(e => e.status === 'pending').length,
        pendingRevenueAmount: 0 // Simplified
      }
    };
    
    setRealtimeMetrics(calculatedMetrics);
    console.log('⚡ Using calculated real-time metrics:', calculatedMetrics);
    return calculatedMetrics;
  }
};
// Load financial goals
// Load financial goals
const loadFinancialGoals = async () => {
  try {
    console.log('🎯 Loading financial goals');
    
    const response = await axios.get(`${API_BASE_URL}/financial/goals`);
    
    if (response.data.success) {
      setFinancialGoals(response.data.data);
      console.log('🎯 Financial goals loaded successfully');
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'Failed to load financial goals');
    }
  } catch (error) {
    console.error('Failed to load financial goals:', error);
    // Don't show error for optional component - just set to null
    setFinancialGoals(null);
    return null;
  }
};
// Export financial report
const exportFinancialReport = async (reportType, format, startDate, endDate) => {
  try {
    setLoading(true);
    console.log(`📄 Exporting ${reportType} report as ${format.toUpperCase()}`);
    
    const params = { format };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_BASE_URL}/financial/export/${reportType}/${format}`, {
      params,
      responseType: format === 'csv' ? 'blob' : 'json'
    });
    
    if (format === 'csv') {
      // Create download link for CSV
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const dateRange = startDate && endDate ? `${startDate}_to_${endDate}` : 'current_period';
      const filename = `${reportType}_report_${dateRange}.csv`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showEnhancedSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded as CSV!`);
    } else {
      // Handle JSON/Excel format
      if (response.data.success) {
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = window.URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', response.data.filename || `${reportType}_report.json`);
        
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        showEnhancedSuccess(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully!`);
      }
    }
    
  } catch (error) {
    console.error('Failed to export report:', error);
    setError(`Failed to export ${reportType} report. Please try again.`);
  } finally {
    setLoading(false);
  }
};

// Handle period change for dashboard
const handleDashboardPeriodChange = async (newPeriod) => {
  setSelectedReportPeriod(newPeriod);
  console.log(`📊 Changing dashboard period to: ${newPeriod}`);
  
  await loadComprehensiveDashboard(newPeriod);
  
  if (newPeriod.includes('months')) {
    await loadAdvancedAnalytics(newPeriod, true);
  }
};

// Handle custom date range for dashboard
const handleDashboardCustomDateRange = async (startDate, endDate) => {
  setCustomDateRange({ startDate, endDate });
  console.log(`📊 Loading data for custom range: ${startDate} to ${endDate}`);
  
  await Promise.all([
    loadInteractiveProfitLoss(startDate, endDate, true),
    loadDetailedProfitLoss(startDate, endDate)
  ]);
  
  showEnhancedSuccess(`Data loaded for ${startDate} to ${endDate}`);
};

// Toggle chart visibility
const toggleChart = (chartName) => {
  setDashboardCharts(prev => ({
    ...prev,
    [chartName]: !prev[chartName]
  }));
  
  console.log(`📊 Toggled ${chartName} chart visibility`);
};

// Refresh all dashboard data
const refreshAllDashboardData = async () => {
  try {
    setLoadingDashboard(true);
    console.log('🔄 Refreshing all financial dashboard data...');
    
    await Promise.all([
      loadComprehensiveDashboard(selectedReportPeriod),
      loadRealtimeMetrics(),
      loadFinancialGoals(),
      loadInteractiveProfitLoss(customDateRange.startDate, customDateRange.endDate),
      loadAdvancedAnalytics(selectedReportPeriod, true)
    ]);
    
    showEnhancedSuccess('All financial dashboard data refreshed successfully!');
  } catch (error) {
    setError('Failed to refresh dashboard data');
  } finally {
    setLoadingDashboard(false);
  }
};

// Format cash flow data for line chart
const formatCashFlowChartData = (dailyCashFlow) => {
  if (!dailyCashFlow || !Array.isArray(dailyCashFlow)) return [];
  
  return dailyCashFlow.map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    inflow: Math.round(day.inflow),
    outflow: Math.round(day.outflow),
    netFlow: Math.round(day.netFlow),
    runningBalance: Math.round(day.runningBalance)
  }));
};

// Format payment methods data for bar chart
const formatPaymentMethodsData = (paymentMethods) => {
  if (!paymentMethods) return [];
  
  return Object.entries(paymentMethods)
    .filter(([method, amount]) => amount > 0)
    .map(([method, amount]) => ({
      method: method.replace('_', ' ').toUpperCase(),
      amount: Math.round(amount),
      percentage: 0 // Will be calculated in the chart component
    }));
};

// Generate KPI metrics for display
const generateKPIMetrics = (chartData) => {
  if (!chartData || !chartData.kpis) return [];
  
  const { kpis } = chartData;
  
  return [
    {
      label: 'Total Revenue',
      value: formatCurrency(kpis.totalRevenue),
      change: kpis.monthlyGrowthRate ? `${kpis.monthlyGrowthRate.toFixed(1)}%` : 'N/A',
      trend: kpis.monthlyGrowthRate >= 0 ? 'up' : 'down',
      icon: '💰'
    },
    {
      label: 'Total Profit',
      value: formatCurrency(kpis.totalProfit),
      change: `${kpis.profitMargin.toFixed(1)}%`,
      trend: kpis.totalProfit >= 0 ? 'up' : 'down',
      icon: '📈'
    },
    {
      label: 'Avg Revenue/Booking',
      value: formatCurrency(kpis.averageRevenuePerReservation),
      change: '',
      trend: 'neutral',
      icon: '🏠'
    },
    {
      label: 'Expense Ratio',
      value: `${kpis.expenseRatio.toFixed(1)}%`,
      change: '',
      trend: kpis.expenseRatio < 60 ? 'up' : 'down',
      icon: '💸'
    }
  ];
};

// Calculate period-over-period growth
const calculatePeriodGrowth = (currentPeriod, previousPeriod, metric) => {
  if (!currentPeriod || !previousPeriod || !currentPeriod[metric] || !previousPeriod[metric]) {
    return { growth: 0, percentage: 0 };
  }
  
  const current = currentPeriod[metric];
  const previous = previousPeriod[metric];
  const growth = current - previous;
  const percentage = previous !== 0 ? (growth / previous) * 100 : 0;
  
  return {
    growth: Math.round(growth),
    percentage: parseFloat(percentage.toFixed(1))
  };
};

// Get chart color scheme
const getChartColors = (index = 0) => {
  const colorSchemes = [
    ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
    ['#059669', '#dc2626', '#2563eb', '#7c3aed', '#db2777', '#0891b2'],
    ['#16a34a', '#ea580c', '#4f46e5', '#9333ea', '#c2410c', '#0284c7']
  ];
  
  return colorSchemes[index % colorSchemes.length];
};
// ===== CHART COMPONENT HANDLER FUNCTIONS =====
// Add these functions right after the utility functions

// Handle chart period change
const handleChartPeriodChange = async (newPeriod) => {
  setSelectedChartPeriod(newPeriod);
  console.log(`📊 Changing chart period to: ${newPeriod}`);
  
  // Reload chart data with new period
  await loadFinancialChartData(newPeriod);
  
  setSuccess(`Chart data updated to show ${newPeriod.replace('months', ' months')} period`);
};

// Handle custom date range selection for charts
const handleChartCustomDateRange = async (startDate, endDate) => {
  setChartDateRange({ startDate, endDate });
  console.log(`📊 Loading chart data for custom range: ${startDate} to ${endDate}`);
  
  try {
    // Load multiple reports for the custom date range
    await Promise.all([
      loadDetailedProfitLoss(startDate, endDate),
      loadCashFlowAnalysis(startDate, endDate, 'daily')
    ]);
    
    setSuccess(`Chart data loaded for ${startDate} to ${endDate}`);
  } catch (error) {
    setError('Failed to load data for selected date range');
  }
};

// Toggle chart visibility
const toggleChartVisibility = (chartName) => {
  setVisibleCharts(prev => ({
    ...prev,
    [chartName]: !prev[chartName]
  }));
  
  console.log(`📊 Toggled ${chartName} chart visibility`);
};

// Refresh all chart data
const refreshAllCharts = async () => {
  try {
    setLoading(true);
    console.log('🔄 Refreshing all financial charts...');
    
    // Reload all chart data
    await Promise.all([
      loadFinancialChartData(selectedChartPeriod),
      loadDetailedProfitLoss(chartDateRange.startDate, chartDateRange.endDate),
      loadCashFlowAnalysis(chartDateRange.startDate, chartDateRange.endDate)
    ]);
    
    setSuccess('All financial charts refreshed successfully!');
  } catch (error) {
    setError('Failed to refresh chart data');
  } finally {
    setLoading(false);
  }
};

// Handle chart data point click (for drilling down into details)
const handleChartDataPointClick = (dataPoint, chartType) => {
  console.log(`📊 Chart data point clicked:`, { dataPoint, chartType });
  
  // Based on chart type, show relevant details
  switch (chartType) {
    case 'revenue-trend':
      // Could open a modal showing detailed revenue for that month
      setSuccess(`Clicked on ${dataPoint.month}: Revenue ${formatCurrency(dataPoint.revenue)}`);
      break;
      
    case 'expense-category':
      // Could filter expenses by category
      setExpenseFilters(prev => ({ ...prev, category: dataPoint.name.toLowerCase() }));
      setShowExpenseListModal(true);
      break;
      
    case 'revenue-type':
      // Could filter revenue by type
      setRevenueFilters(prev => ({ ...prev, type: dataPoint.name.toLowerCase() }));
      setShowRevenueListModal(true);
      break;
      
    default:
      console.log('No specific action defined for this chart type');
  }
};

// Generate chart configuration options
const getChartConfig = (chartType) => {
  const baseConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: '#3b82f6',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    }
  };
  
  switch (chartType) {
    case 'line':
      return {
        ...baseConfig,
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { color: '#6b7280' }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { 
              color: '#6b7280',
              callback: function(value) {
                return formatCurrency(value, 'LKR').replace('LKR ', 'LKR ');
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      };
      
    case 'bar':
      return {
        ...baseConfig,
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#6b7280' }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.1)' },
            ticks: { 
              color: '#6b7280',
              callback: function(value) {
                return formatCurrency(value, 'LKR').replace('LKR ', 'LKR ');
              }
            }
          }
        }
      };
      
    case 'pie':
      return {
        ...baseConfig,
        plugins: {
          ...baseConfig.plugins,
          tooltip: {
            ...baseConfig.plugins.tooltip,
            callbacks: {
              label: function(context) {
                const value = context.raw;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
              }
            }
          }
        }
      };
      
    default:
      return baseConfig;
  }
};

// Reset revenue form
  const resetRevenueForm = () => {
  setRevenueForm({
    type: 'services',
    description: '',
    amount: '',
    currency: 'LKR',
    paymentMethod: 'cash',
    guestName: '',
    confirmationNumber: '',
    notes: '',
    tags: []
  });
  setRevenueFormErrors({});
};

// Get filtered and sorted revenue
  const getFilteredAndSortedRevenue = () => {
  let filtered = revenue.filter(rev => {
    // Type filter
    if (revenueFilters.type !== 'all' && rev.type !== revenueFilters.type) {
      return false;
    }

    // Payment method filter
    if (revenueFilters.paymentMethod !== 'all' && rev.paymentMethod !== revenueFilters.paymentMethod) {
      return false;
    }

    // Payment status filter
    if (revenueFilters.paymentStatus !== 'all' && rev.paymentStatus !== revenueFilters.paymentStatus) {
      return false;
    }

    // Search text filter
    if (revenueFilters.searchText) {
      const searchLower = revenueFilters.searchText.toLowerCase();
      const searchableText = `${rev.description} ${rev.guestName || ''} ${rev.confirmationNumber || ''} ${rev.notes || ''}`.toLowerCase();
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    // Date range filter
    const revenueDate = new Date(rev.date);
    const today = new Date();
    
    if (revenueFilters.dateRange !== 'all') {
      switch (revenueFilters.dateRange) {
        case 'today':
          if (revenueDate.toDateString() !== today.toDateString()) return false;
          break;
        case 'this_week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (revenueDate < weekAgo) return false;
          break;
        case 'this_month':
          if (revenueDate.getMonth() !== today.getMonth() || revenueDate.getFullYear() !== today.getFullYear()) return false;
          break;
        case 'custom':
          if (revenueFilters.startDate && revenueDate < new Date(revenueFilters.startDate)) return false;
          if (revenueFilters.endDate && revenueDate > new Date(revenueFilters.endDate)) return false;
          break;
      }
    }

    // Amount range filter
    if (revenueFilters.amountRange !== 'all') {
      const amount = rev.amount;
      switch (revenueFilters.amountRange) {
        case 'under_5000':
          if (amount >= 5000) return false;
          break;
        case '5000_25000':
          if (amount < 5000 || amount >= 25000) return false;
          break;
        case '25000_100000':
          if (amount < 25000 || amount >= 100000) return false;
          break;
        case 'over_100000':
          if (amount < 100000) return false;
          break;
      }
    }

    return true;
  });

  // Sort the filtered results
  filtered.sort((a, b) => {
    switch (revenueSortBy) {
      case 'date_desc':
        return new Date(b.date) - new Date(a.date);
      case 'date_asc':
        return new Date(a.date) - new Date(b.date);
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'type_asc':
        return a.type.localeCompare(b.type);
      default:
        return new Date(b.date) - new Date(a.date);
    }
  });

  return filtered;
};

// Calculate revenue metrics for summary cards
  const calculateRevenueMetrics = () => {
  const today = new Date();
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const totalRevenue = revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const serviceRevenue = revenue.filter(r => r.type === 'services').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const accommodationRevenue = revenue.filter(r => r.type === 'accommodation').reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const monthlyRevenue = revenue.filter(r => new Date(r.date) >= thisMonth).reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const monthlyTransactions = revenue.filter(r => new Date(r.date) >= thisMonth).length;
  
  return {
    totalRevenue,
    serviceRevenue,
    accommodationRevenue,
    monthlyRevenue,
    totalTransactions: revenue.length,
    monthlyTransactions
  };
};

// Reset revenue filters
const resetRevenueFilters = () => {
  setRevenueFilters({
    type: 'all',
    paymentMethod: 'all',
    paymentStatus: 'all',
    dateRange: 'all',
    amountRange: 'all',
    searchText: '',
    startDate: '',
    endDate: ''
  });
  setRevenueSortBy('date_desc');
};

// Get revenue status badge style
const getRevenueStatusBadge = (paymentStatus) => {
  switch (paymentStatus) {
    case 'completed':
      return 'confirmed';
    case 'pending':
      return 'pending';
    case 'refunded':
      return 'cancelled';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'pending';
  }
};

// Enhanced success message with auto-clear and animation
const showEnhancedSuccess = (message) => {
    setSuccess(message);
    setAnimationTriggers(prev => ({ ...prev, statsUpdated: true }));
    
    setTimeout(() => {
      setAnimationTriggers(prev => ({ ...prev, statsUpdated: false }));
    }, 600);
    
    setTimeout(() => {
      setSuccess('');
    }, 4000);
  };
  // Fixed: Use useCallback to prevent unnecessary re-renders
  const updateBookingForm = useCallback((field, value) => {
    setBookingForm(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  // NEW: Handle children count change - automatically adjust ages array
  const handleChildrenCountChange = (count) => {
    const childrenCount = parseInt(count) || 0;
    const currentAges = bookingForm.childrenAges || [];
    
    let newAges = [...currentAges];
    
    if (childrenCount > currentAges.length) {
      // Add default ages for new children
      for (let i = currentAges.length; i < childrenCount; i++) {
        newAges.push(8); // Default age under 11
      }
    } else if (childrenCount < currentAges.length) {
      // Remove excess ages
      newAges = newAges.slice(0, childrenCount);
    }
    
    setBookingForm(prev => ({
      ...prev,
      children: childrenCount,
      childrenAges: newAges
    }));
  };

  // NEW: Handle individual child age change
  const handleChildAgeChange = (index, age) => {
    const newAges = [...bookingForm.childrenAges];
    newAges[index] = parseInt(age) || 0;
    setBookingForm(prev => ({
      ...prev,
      childrenAges: newAges
    }));
  };
  // NEW: Calendar helper functions
  const formatDateForDisplay = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };
  const fetchExpenses = async (filters = {}) => {
  try {
    setLoading(true);
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.append(key, value);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/expenses?${queryParams}`);
    const data = await response.json();
    
    if (data.success) {
      setExpenses(data.data.expenses || []);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch expenses');
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
    setError(error.message);
    return { expenses: [], summary: {} };
  } finally {
    setLoading(false);
  }
};


// Approve or reject expense
const updateExpenseApproval = async (expenseId, action, reason = '') => {
  try {
    setLoading(true);
    
    const response = await fetch(`${API_BASE_URL}/expenses/${expenseId}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, reason }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      setSuccess(`Expense ${action}d successfully!`);
      fetchExpenses(expenseFilters); // Refresh list
      return data.data;
    } else {
      throw new Error(data.message || `Failed to ${action} expense`);
    }
  } catch (error) {
    console.error(`Error ${action}ing expense:`, error);
    setError(error.message);
    throw error;
  } finally {
    setLoading(false);
  }
};

  const getAvailabilityStyle = (available, source) => {
    if (available) return 'calendar-day available';
    switch (source) {
      case 'reserved':
        return 'calendar-day reserved';
      case 'manual_block':
        return 'calendar-day blocked';
      case 'external':
        return 'calendar-day external-blocked';
      default:
        return 'calendar-day unavailable';
    }
  };
  const loadReservations = async () => {
    try {
      console.log('Loading reservations from backend...');
      const response = await axios.get(`${API_BASE_URL}/reservations`);
      console.log('Reservations response:', response.data);
      
      if (response.data.success && response.data.data) {
        const reservationsData = Array.isArray(response.data.data) 
          ? response.data.data 
          : response.data.data.reservations || [];
          
        setReservations(reservationsData);
        console.log('Reservations loaded successfully:', reservationsData);
        
        if (reservationsData.length > 0) {
          setSuccess(`Found ${reservationsData.length} reservation(s) in the system!`);
        }
      } else {
        console.log('No reservations data in response');
        setReservations([]);
      }
    } catch (error) {
      console.error('Failed to load reservations:', error);
      setReservations([]);
    }
  };

  const loadCurrencyRate = async () => {
    try {
      console.log('Loading currency rate from backend...');
      const response = await axios.get(`${API_BASE_URL}/currency/rates`);
      console.log('Currency response:', response.data);
      
      if (response.data.success && response.data.data && response.data.data.rates) {
        setCurrencyRate(response.data.data.rates.LKR);
        console.log('Currency rate loaded:', response.data.data.rates.LKR);
      } else {
        console.log('Using fallback currency rate: 301');
        setCurrencyRate(301);
      }
    } catch (error) {
      console.error('Failed to load currency rate:', error);
      setCurrencyRate(301);
    }
  };

  // NEW: Load dashboard data
  const loadDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard`);
      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('Dashboard data loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  // NEW: Load messages
  const loadMessages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages?userId=${currentUser.id}`);
      if (response.data.success) {
        setMessages(response.data.data.messages || []);
        console.log('Messages loaded:', response.data.data.messages?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // NEW: Load conversations
  const loadConversations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/messages/conversations?userId=${currentUser.id}`);
      if (response.data.success) {
        setConversations(response.data.data.conversations || []);
        console.log('Conversations loaded:', response.data.data.conversations?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };
  // NEW: Load pricing data
  const loadPricingData = async () => {
    try {
      console.log('Loading pricing data from backend...');
      const response = await axios.get(`${API_BASE_URL}/pricing`);
      console.log('Pricing response:', response.data);
      
      if (response.data.success) {
        setPricingData(response.data.data);
        console.log('Pricing data loaded successfully');
      }
    } catch (error) {
      console.error('Failed to load pricing data:', error);
    }
  };

  // NEW: Load calendar data
  // NEW: Load calendar data
// NEW: Load calendar data - FIXED with useCallback
  const loadCalendarData = useCallback(async () => {
    try {
      console.log('Loading calendar data...');
      const response = await axios.get(`${API_BASE_URL}/calendar`, {
        params: {
          startDate: calendarView.startDate,
          endDate: calendarView.endDate,
          unitId: calendarView.unitId || undefined
        }
      });
      
      if (response.data.success) {
        setCalendarData(response.data.data);
        console.log('Calendar data loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    }
  }, [calendarView.startDate, calendarView.endDate, calendarView.unitId]);

  // NEW: Load calendar overrides
  const loadCalendarOverrides = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/overrides`);
      if (response.data.success) {
        setCalendarOverrides(response.data.data.overrides || []);
      }
    } catch (error) {
      console.error('Failed to load calendar overrides:', error);
    }
  };

  // NEW: Load external calendars
  const loadExternalCalendars = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/external`);
      if (response.data.success) {
        setExternalCalendars(response.data.data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to load external calendars:', error);
    }
  };

  // NEW: Load seasonal rates
  const loadSeasonalRates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/calendar/seasonal-rates`);
      if (response.data.success) {
        setSeasonalRates(response.data.data.seasonalRates || []);
      }
    } catch (error) {
      console.error('Failed to load seasonal rates:', error);
    }
  };

  // ===== AUTHENTICATION FUNCTIONS =====
  
  // Setup axios interceptor for authentication
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => axios.interceptors.request.eject(requestInterceptor);
  }, [authToken]);

  // Setup axios response interceptor for 401 handling and token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 error and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const storedRefreshToken = localStorage.getItem('refreshToken');
            
            if (!storedRefreshToken) {
              // No refresh token, logout
              handleLogout();
              return Promise.reject(error);
            }

            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken: storedRefreshToken
            });

            if (response.data.success) {
              const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
              
              // Update tokens
              localStorage.setItem('authToken', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              setAuthToken(newToken);
              setRefreshToken(newRefreshToken);

              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;

              // Retry the original request
              return axios(originalRequest);
            } else {
              // Token refresh failed, logout
              handleLogout();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            // Token refresh failed, logout
            handleLogout();
            return Promise.reject(error);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(responseInterceptor);
  }, [authToken, refreshToken]);

  // Login function
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!loginForm.username || !loginForm.password) {
      setError('Please enter username and password');
      return;
    }

    setIsLoggingIn(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username: loginForm.username,
        password: loginForm.password
      });

      if (response.data.success) {
        const { token, refreshToken: newRefreshToken, user } = response.data.data;
        
        // Store tokens
        localStorage.setItem('authToken', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Update state
        setAuthToken(token);
        setRefreshToken(newRefreshToken);
        setAuthenticatedUser(user);
        setIsAuthenticated(true);
        setShowLoginModal(false);
        setLoginForm({ username: '', password: '' });
        
        setSuccess(`Welcome back, ${user.firstName}!`);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      setAuthToken(null);
      setRefreshToken(null);
      setAuthenticatedUser(null);
      setIsAuthenticated(false);
      setShowLoginModal(true);
      
      // Clear all data
      setProperties([]);
      setReservations([]);
      setMessages([]);
      setExpenses([]);
      setRevenue([]);
      setInvoices([]);
      
      setSuccess('Logged out successfully');
    }
  };

  // Refresh token function
  const refreshAuthToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
        refreshToken
      });

      if (response.data.success) {
        const { token: newToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('authToken', newToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        setAuthToken(newToken);
        setRefreshToken(newRefreshToken);
        
        return newToken;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Token refresh failed, logout user
      handleLogout();
      return null;
    }
  };

  // Get current user profile
  const loadCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      
      if (response.data.success) {
        setAuthenticatedUser(response.data.data.user);
        setIsAuthenticated(true);
        setShowLoginModal(false);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Token might be expired, try to refresh
      if (refreshToken) {
        const newToken = await refreshAuthToken();
        if (newToken) {
          // Retry loading user
          await loadCurrentUser();
        } else {
          // Refresh failed, show login
          setShowLoginModal(true);
        }
      } else {
        // No refresh token, show login
        setShowLoginModal(true);
        setIsAuthenticated(false);
      }
    }
  };

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (authToken) {
        await loadCurrentUser();
      } else {
        // No token, show login immediately
        setInitialLoading(false);
        setShowLoginModal(true);
      }
    };
    
    checkAuth();
  }, []);

  // ===== USER MANAGEMENT FUNCTIONS =====
  
  // Load all users
  const loadUsers = async () => {
    try {
      const params = {
        ...userFilter,
        role: userFilter.role === 'all' ? undefined : userFilter.role,
        status: userFilter.status === 'all' ? undefined : userFilter.status,
        search: userFilter.search || undefined
      };
      
      const response = await axios.get(`${API_BASE_URL}/users`, { params });
      
      if (response.data.success) {
        setUsers(response.data.data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  // Create new user
  const createUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.post(`${API_BASE_URL}/users`, userForm);
      
      if (response.data.success) {
        setSuccess(`User ${userForm.username} created successfully!`);
        setShowUserModal(false);
        resetUserForm();
        loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.response?.data?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // Update existing user
  const updateUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Remove password if empty (not changing it)
      const updateData = { ...userForm };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const response = await axios.put(`${API_BASE_URL}/users/${editingUser.id}`, updateData);
      
      if (response.data.success) {
        setSuccess(`User ${userForm.username} updated successfully!`);
        setShowUserModal(false);
        setEditingUser(null);
        resetUserForm();
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.delete(`${API_BASE_URL}/users/${userId}`);
      
      if (response.data.success) {
        setSuccess('User deleted successfully');
        loadUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // Toggle user status
  const toggleUserStatus = async (userId, newStatus) => {
    try {
      setLoading(true);
      const response = await axios.patch(`${API_BASE_URL}/users/${userId}/status`, {
        status: newStatus
      });
      
      if (response.data.success) {
        setSuccess(`User status updated to ${newStatus}`);
        loadUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError(error.response?.data?.message || 'Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  // Reset user form
  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'front_desk',
      permissions: []
    });
    setEditingUser(null);
  };

  // Open edit user modal
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '', // Don't populate password
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      permissions: user.permissions || []
    });
    setShowUserModal(true);
  };

  // ===== PROFILE MANAGEMENT FUNCTIONS =====
  
  // Open profile modal
  const openProfileModal = () => {
    if (authenticatedUser) {
      setProfileForm({
        firstName: authenticatedUser.firstName || '',
        lastName: authenticatedUser.lastName || '',
        email: authenticatedUser.email || '',
        phone: authenticatedUser.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowProfileModal(true);
    }
  };

  // Update profile
  const updateProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const updateData = {
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
        phone: profileForm.phone
      };
      
      const response = await axios.put(`${API_BASE_URL}/auth/profile`, updateData);
      
      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        setAuthenticatedUser(response.data.data.user);
        setShowProfileModal(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      
      if (profileForm.newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
      
      setLoading(true);
      setError('');
      
      const response = await axios.put(`${API_BASE_URL}/auth/change-password`, {
        currentPassword: profileForm.currentPassword,
        newPassword: profileForm.newPassword
      });
      
      if (response.data.success) {
        setSuccess('Password changed successfully!');
        setProfileForm(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const loadProperties = async () => {
    try {
      console.log('Loading properties from backend...');
      const response = await axios.get(`${API_BASE_URL}/properties`);
      console.log('Properties response:', response.data);
      
      if (response.data.success && response.data.data) {
        const propertiesData = response.data.data.units || response.data.data || [];
        setProperties(Array.isArray(propertiesData) ? propertiesData : []);
        console.log('Properties loaded successfully:', propertiesData);
      } else {
        console.log('No properties data in response, using fallback');
        setFallbackProperties();
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
      setFallbackProperties();
    }
  };
// Load enhanced dashboard data with financial information
  const loadEnhancedDashboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/financial`);
      if (response.data.success) {
        setDashboardData(response.data.data);
        console.log('Enhanced financial dashboard loaded:', response.data.data);
      }
    } catch (error) {
      console.error('Failed to load enhanced dashboard:', error);
      // Don't call loadDashboardData to prevent potential loops
      // The dashboard will work with whatever data is already loaded
    }
  };

  // Load expenses
  const loadExpenses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses`);
      if (response.data.success) {
        setExpenses(response.data.data.expenses || []);
        console.log('Expenses loaded:', response.data.data.expenses?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load expenses:', error);
    }
  };

  // Load pending expenses for approval
  const loadPendingExpenses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expenses/pending-approval`);
      if (response.data.success) {
        setPendingExpenses(response.data.data || []);
        console.log('Pending expenses loaded:', response.data.data?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load pending expenses:', error);
    }
  };


  // Load revenue
  const loadRevenue = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/revenue`);
      if (response.data.success) {
        setRevenue(response.data.data.revenue || []);
        console.log('Revenue loaded:', response.data.data.revenue?.length || 0);
      }
    } catch (error) {
      console.error('Failed to load revenue:', error);
    }
  };


  // Load financial reports
  const loadFinancialReports = async () => {
    try {
      const [summaryRes, profitLossRes, cashFlowRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/financial/summary`),
        axios.get(`${API_BASE_URL}/financial/profit-loss`),
        axios.get(`${API_BASE_URL}/financial/cash-flow`)
      ]);

      if (summaryRes.data.success && profitLossRes.data.success && cashFlowRes.data.success) {
        setFinancialReports({
          summary: summaryRes.data.data,
          profitLoss: profitLossRes.data.data,
          cashFlow: cashFlowRes.data.data
        });
        console.log('Financial reports loaded');
      }
    } catch (error) {
      console.error('Failed to load financial reports:', error);
    }
  };  
  // Expense Management Functions
const createExpense = async () => {
  if (!validateExpenseForm()) return;

  setLoading(true);
  setError('');

  try {
    const expenseData = {
      ...enhancedExpenseForm,
      invoiceFile: enhancedExpenseForm.invoiceFile ? '/uploads/invoices/simulated_file.pdf' : null,
      receiptFile: enhancedExpenseForm.receiptFile ? '/uploads/receipts/simulated_receipt.jpg' : null
    };

    console.log('Creating expense with data:', expenseData);

    const response = await axios.post(`${API_BASE_URL}/expenses`, expenseData);

    if (response.data.success) {
      showEnhancedSuccess(`Expense created successfully! Pending approval.`);
      setShowExpenseModal(false);
      resetExpenseForm();
      
      // 🔥 IMMEDIATE CHART UPDATE - Reload ALL financial data and charts
      await refreshAllFinancialData('Expense added');
      
    } else {
      setError(response.data.message || 'Failed to create expense');
    }
  } catch (error) {
    console.error('Expense creation error:', error);
    if (error.response) {
      setError(`Server error: ${error.response.data.message || error.response.status}`);
    } else {
      setError('Failed to connect to server');
    }
  } finally {
    setLoading(false);
  }
};
const refreshAllFinancialData = async (triggerReason = 'Manual refresh') => {
  try {
    setIsUpdating(true);
    console.log(`🔄 Refreshing all financial data - Reason: ${triggerReason}`);
    
    // Update timestamp first
    setLastDataUpdate(Date.now());
    
    // Load core data first
    console.log('1️⃣ Loading core financial data...');
    await Promise.all([
      loadRevenue(),
      loadExpenses(),
      loadEnhancedDashboardData()
    ]);
    
    // Force refresh charts with new data
    console.log('2️⃣ Force refreshing charts...');
    await loadComprehensiveDashboard(selectedReportPeriod);
    await loadRealtimeMetrics();
    
    // Force re-render by updating state
    setAnimationTriggers(prev => ({ 
      ...prev, 
      statsUpdated: true
    }));
    
    setTimeout(() => {
      setAnimationTriggers(prev => ({ 
        ...prev, 
        statsUpdated: false
      }));
    }, 1000);
    
    console.log(`✅ Complete refresh finished - ${triggerReason}`);
    
  } catch (error) {
    console.error('💥 Failed to refresh financial data:', error);
    setError('Failed to refresh some financial data');
  } finally {
    setIsUpdating(false);
  }
};

// STEP 5: Add this auto-refresh effect (add to your useEffect hooks)
useEffect(() => {
  let refreshInterval;
  
  if (autoRefreshEnabled && activeTab === 'financial') {
    // Auto-refresh every 30 seconds when on financial tab
    refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing financial data...');
      refreshAllFinancialData('Auto-refresh');
    }, 30000);
  }
  
  return () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  };
}, [autoRefreshEnabled, activeTab]);

// STEP 6: Enhanced approval function with instant updates
// STEP 7: Enhanced reservation status update with financial impact
  const approveExpense = async (expenseId, action, reason = '') => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/expenses/${expenseId}/approve`, {
        action, // 'approve' or 'reject'
        reason,
        approvedBy: currentUser.id
      });

      if (response.data.success) {
        showEnhancedSuccess(`Expense ${action}d successfully!`);
        
        // Reload data
        await Promise.all([
          loadExpenses(),
          loadPendingExpenses(),
          loadEnhancedDashboardData()
        ]);
        
        // Close detail modal if open
        if (selectedExpense && selectedExpense.id === expenseId) {
          setSelectedExpense(response.data.data);
        }
      } else {
        setError(response.data.message || `Failed to ${action} expense`);
      }
    } catch (error) {
      console.error(`Failed to ${action} expense:`, error);
      setError(`Failed to ${action} expense`);
    } finally {
      setLoading(false);
    }
  };
const updateReservationStatus = async (reservationId, newStatus, paymentStatus) => {
  setLoading(true);
  try {
    const response = await axios.put(`${API_BASE_URL}/reservations/${reservationId}`, {
      status: newStatus,
      paymentStatus: paymentStatus
    });

    if (response.data.success) {
      setSuccess('Reservation status updated successfully!');
      loadReservations();
      loadDashboardData();
      
      // If payment status changed, refresh financial data
      if (paymentStatus && paymentStatus !== 'not-paid') {
        await refreshAllFinancialData('Reservation payment updated');
      }
      
      // Update selected reservation if viewing details
      if (selectedReservation && selectedReservation.id === reservationId) {
        setSelectedReservation(response.data.data);
      }
    } else {
      setError('Failed to update reservation status');
    }
  } catch (error) {
    console.error('Failed to update reservation:', error);
    setError('Failed to update reservation status');
  } finally {
    setLoading(false);
  }
};
  const markExpenseAsPaid = async (expenseId, paymentDetails) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/expenses/${expenseId}/mark-paid`, paymentDetails);

      if (response.data.success) {
        showEnhancedSuccess('Expense marked as paid successfully!');
        await Promise.all([
          loadExpenses(),
          loadPendingExpenses(),
          loadEnhancedDashboardData()
        ]);
      } else {
        setError('Failed to mark expense as paid');
      }
    } catch (error) {
      console.error('Failed to mark expense as paid:', error);
      setError('Failed to mark expense as paid');
    } finally {
      setLoading(false);
    }
  };

  const validateExpenseForm = () => {
    const errors = {};
    
    if (!enhancedExpenseForm.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!enhancedExpenseForm.amount || parseFloat(enhancedExpenseForm.amount) <= 0) {
      errors.amount = 'Valid amount is required';
    }
    if (!enhancedExpenseForm.vendor.trim()) {
      errors.vendor = 'Vendor is required';
    }
    if (!enhancedExpenseForm.invoiceNumber.trim()) {
      errors.invoiceNumber = 'Invoice number is required';
    }
    if (!enhancedExpenseForm.invoiceFile) {
      errors.invoiceFile = 'Invoice file is mandatory';
    }

    setExpenseFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetExpenseForm = () => {
    setEnhancedExpenseForm({
      category: 'utilities',
      subcategory: '',
      description: '',
      amount: '',
      currency: 'LKR',
      vendor: '',
      invoiceNumber: '',
      invoiceFile: null,
      receiptFile: null,
      paymentMethod: 'cash',
      expenseDate: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringFrequency: 'monthly',
      budgetCategory: '',
      taxDeductible: true,
      notes: ''
    });
    setExpenseFormErrors({});
    setExpenseFilePreview(null);
  };

// ...existing code...

// Complete handleFileUpload function
  const handleFileUpload = (file, fileType) => {
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setExpenseFormErrors(prev => ({
        ...prev,
        [fileType === 'invoice' ? 'invoiceFile' : 'receiptFile']: 'Please select a PDF, JPG, or PNG file'
      }));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setExpenseFormErrors(prev => ({
        ...prev,
        [fileType === 'invoice' ? 'invoiceFile' : 'receiptFile']: 'File size must be less than 5MB'
      }));
      return;
    }

    // Clear any previous errors for this file type
    setExpenseFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fileType === 'invoice' ? 'invoiceFile' : 'receiptFile'];
      return newErrors;
    });

    if (fileType === 'invoice') {
      setEnhancedExpenseForm(prev => ({ ...prev, invoiceFile: file }));
      setExpenseFilePreview(URL.createObjectURL(file));
    } else if (fileType === 'receipt') {
      setEnhancedExpenseForm(prev => ({ ...prev, receiptFile: file }));
    }
  };

  // Update your existing handleExpenseModalOpen
  const getExpenseStatusBadge = (status) => {
    const badges = {
      pending: 'status-badge pending',
      approved: 'status-badge confirmed', 
      rejected: 'status-badge cancelled',
      paid: 'status-badge confirmed'
    };
    return badges[status] || 'status-badge pending';
  };

  const filterExpenses = () => {
    if (expenseFilter === 'all') return expenses;
    return expenses.filter(expense => expense.status === expenseFilter);
  };

  // ===== INVENTORY MANAGEMENT API FUNCTIONS =====

  // Load all inventory items
  const loadInventoryItems = async () => {
    try {
      const params = new URLSearchParams();
      if (inventoryFilter.category !== 'all') params.append('category', inventoryFilter.category);
      if (inventoryFilter.status !== 'all') params.append('status', inventoryFilter.status);
      if (inventoryFilter.search) params.append('search', inventoryFilter.search);
      if (inventoryFilter.lowStock) params.append('lowStock', 'true');

      const response = await fetch(`${API_BASE_URL}/inventory/items?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInventoryItems(data.data.items);
        console.log(`📦 Loaded ${data.data.items.length} inventory items`);
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  // Load inventory dashboard statistics
  const loadInventoryDashboard = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/dashboard`);
      const data = await response.json();
      
      if (data.success) {
        setInventoryDashboard(data.data);
        console.log('📊 Inventory dashboard loaded');
      }
    } catch (error) {
      console.error('Failed to load inventory dashboard:', error);
    }
  };

  // Load low stock alerts
  const loadLowStockAlerts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/inventory/alerts/low-stock`);
      const data = await response.json();
      
      if (data.success) {
        setLowStockAlerts(data.data.lowStockItems);
        console.log(`⚠️ Found ${data.data.summary.total} low stock items`);
      }
    } catch (error) {
      console.error('Failed to load low stock alerts:', error);
    }
  };

  // Create new inventory item
  const createInventoryItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Inventory item created successfully');
        setShowInventoryModal(false);
        resetInventoryForm();
        await loadInventoryItems();
        await loadInventoryDashboard();
      } else {
        setError(data.message || 'Failed to create inventory item');
      }
    } catch (error) {
      setError('Failed to create inventory item');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Update inventory item
  const updateInventoryItem = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/items/${selectedInventoryItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inventoryForm)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('✅ Inventory item updated successfully');
        setShowInventoryModal(false);
        setSelectedInventoryItem(null);
        resetInventoryForm();
        await loadInventoryItems();
      } else {
        setError(data.message || 'Failed to update inventory item');
      }
    } catch (error) {
      setError('Failed to update inventory item');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Stock IN (Purchase/Restock)
  const stockIn = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/items/${selectedInventoryItem.id}/stock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(stockTransactionForm.quantity),
          unitCost: parseFloat(stockTransactionForm.unitCost),
          supplierName: stockTransactionForm.supplierName,
          invoiceNumber: stockTransactionForm.invoiceNumber,
          notes: stockTransactionForm.notes,
          transactionDate: new Date().toISOString().split('T')[0]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Added ${stockTransactionForm.quantity} ${selectedInventoryItem.unit} to stock`);
        setShowStockInModal(false);
        resetStockTransactionForm();
        await loadInventoryItems();
        await loadInventoryDashboard();
      } else {
        setError(data.message || 'Failed to add stock');
      }
    } catch (error) {
      setError('Failed to add stock');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Stock OUT (Usage/Consumption)
  const stockOut = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/items/${selectedInventoryItem.id}/stock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: parseInt(stockTransactionForm.quantity),
          reason: stockTransactionForm.reason,
          usedBy: stockTransactionForm.usedBy,
          propertyId: stockTransactionForm.propertyId,
          reservationId: stockTransactionForm.reservationId,
          guestName: stockTransactionForm.guestName,
          notes: stockTransactionForm.notes,
          transactionDate: new Date().toISOString().split('T')[0]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Removed ${stockTransactionForm.quantity} ${selectedInventoryItem.unit} from stock`);
        setShowStockOutModal(false);
        resetStockTransactionForm();
        await loadInventoryItems();
        await loadInventoryDashboard();
        if (data.data.alert) {
          setError(`⚠️ ${data.data.alert}`);
        }
      } else {
        setError(data.message || 'Failed to remove stock');
      }
    } catch (error) {
      setError('Failed to remove stock');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Stock Adjustment
  const stockAdjust = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/inventory/items/${selectedInventoryItem.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newQuantity: parseInt(stockTransactionForm.quantity),
          reason: stockTransactionForm.reason,
          notes: stockTransactionForm.notes,
          transactionDate: new Date().toISOString().split('T')[0]
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`✅ Stock adjusted to ${stockTransactionForm.quantity} ${selectedInventoryItem.unit}`);
        setShowStockAdjustModal(false);
        resetStockTransactionForm();
        await loadInventoryItems();
        await loadInventoryDashboard();
      } else {
        setError(data.message || 'Failed to adjust stock');
      }
    } catch (error) {
      setError('Failed to adjust stock');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const resetInventoryForm = () => {
    setInventoryForm({
      name: '',
      category: 'housekeeping',
      subcategory: '',
      description: '',
      currentStock: 0,
      minStock: 5,
      maxStock: '',
      unit: 'pieces',
      costPerUnit: '',
      supplierName: '',
      supplierContact: '',
      location: '',
      notes: ''
    });
  };

  const resetStockTransactionForm = () => {
    setStockTransactionForm({
      quantity: '',
      unitCost: '',
      supplierName: '',
      invoiceNumber: '',
      reason: '',
      usedBy: '',
      propertyId: '',
      reservationId: '',
      guestName: '',
      notes: ''
    });
  };

  // ===== INVOICE MANAGEMENT FUNCTIONS =====
  
  // Load invoices
  const loadInvoices = async () => {
    if (!isAuthenticated) return;
    
    try {
      const params = {
        ...invoiceFilter,
        type: invoiceFilter.type === 'all' ? undefined : invoiceFilter.type,
        paymentStatus: invoiceFilter.paymentStatus === 'all' ? undefined : invoiceFilter.paymentStatus
      };
      
      const response = await axios.get(`${API_BASE_URL}/invoices`, { params });
      
      if (response.data.success) {
        setInvoices(response.data.data.invoices || []);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Only show error if user is on financial tab
      if (activeTab === 'financial') {
        setError('Failed to load invoices');
      }
    }
  };

  // Generate invoice for a reservation
  const generateInvoiceForReservation = async (reservationId, additionalData = {}) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/invoices/generate/reservation/${reservationId}`,
        {
          taxRate: additionalData.taxRate || 0,
          discountAmount: additionalData.discountAmount || 0,
          additionalItems: additionalData.additionalItems || [],
          notes: additionalData.notes || '',
          createdBy: currentUser?.username || 'admin'
        }
      );

      if (response.data.success) {
        setSuccess('Invoice generated successfully!');
        loadInvoices();
        return response.data.data.invoice;
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      setError('Failed to generate invoice');
      throw error;
    }
  };

  // Upload invoice file
  const uploadInvoice = async () => {
    try {
      if (!uploadInvoiceForm.file) {
        setError('Please select a file to upload');
        return;
      }

      const formData = new FormData();
      formData.append('invoice', uploadInvoiceForm.file);
      formData.append('type', uploadInvoiceForm.type);
      formData.append('amount', uploadInvoiceForm.amount);
      formData.append('currency', uploadInvoiceForm.currency);
      formData.append('issuedTo', uploadInvoiceForm.issuedTo);
      formData.append('category', uploadInvoiceForm.category);
      formData.append('notes', uploadInvoiceForm.notes);
      formData.append('issueDate', new Date().toISOString().split('T')[0]);
      formData.append('createdBy', currentUser?.username || 'admin');

      const response = await axios.post(
        `${API_BASE_URL}/invoices/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Invoice uploaded successfully!');
        setShowUploadInvoiceModal(false);
        resetUploadInvoiceForm();
        loadInvoices();
      }
    } catch (error) {
      console.error('Error uploading invoice:', error);
      setError('Failed to upload invoice');
    }
  };

  // Download invoice
  const downloadInvoice = async (invoiceId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/invoices/${invoiceId}/download`,
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading invoice:', error);
      setError('Failed to download invoice');
    }
  };

  // Record payment for invoice
  const recordInvoicePayment = async (invoiceId, paymentData) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/invoices/${invoiceId}/payment`,
        paymentData
      );

      if (response.data.success) {
        setSuccess('Payment recorded successfully!');
        loadInvoices();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setError('Failed to record payment');
    }
  };

  // Reset upload form
  const resetUploadInvoiceForm = () => {
    setUploadInvoiceForm({
      type: 'supplier_bill',
      amount: '',
      currency: 'LKR',
      issuedTo: '',
      category: '',
      notes: '',
      file: null
    });
  };

  // Load initial data
// REPLACE YOUR EXISTING useEffect AROUND LINE 800 WITH THIS ENHANCED VERSION
  // This useEffect is disabled because it duplicates the main initialization
  // All data loading happens in the first useEffect on mount
  /*
  useEffect(() => {
  const loadAllData = async () => {
    console.log('🚀 Loading all application data...');
    
    try {
      await Promise.all([
        loadProperties(),
        loadReservations(),
        loadCurrencyRate(),
        loadEnhancedDashboardData(),
        loadMessages(),
        loadConversations(),
        loadPricingData(),
        loadCalendarOverrides(),
        loadExternalCalendars(),
        loadSeasonalRates(),
        loadExpenses(),
        loadRevenue(),
        loadPendingExpenses(),
        loadFinancialReports()
      ]);

      // Load enhanced financial dashboard data with error handling
      console.log('💰 Loading financial dashboard components...');
      const financialComponents = [
        loadComprehensiveDashboard('6months'),
        loadRealtimeMetrics(),
        loadFinancialGoals(),
        loadInteractiveProfitLoss('', '', true),
        loadAdvancedAnalytics('12months', true)
      ];

      // Load each component individually to avoid one failure stopping others
      for (const componentPromise of financialComponents) {
        try {
          await componentPromise;
        } catch (error) {
          console.warn('Failed to load financial component:', error.message);
          // Continue loading other components
        }
      }

      console.log('✅ All data loaded successfully!');
    } catch (error) {
      console.error('Error loading application data:', error);
      setError('Some components failed to load. Please refresh the page.');
    }
  };
  loadAllData();
}, []); // Empty dependency array is fine for initial load
  */

  // Load calendar data when view changes
  useEffect(() => {
    if (showCalendarModal || activeTab === 'calendar') {
      loadCalendarData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalendarModal, activeTab]);

  // Load expenses when expense list modal opens
useEffect(() => {
  if (showExpenseListModal) {
    loadExpenses();
    loadPendingExpenses();
  }
}, [showExpenseListModal]);

// Load revenue when revenue list modal opens  
useEffect(() => {
  if (showRevenueListModal) {
    loadRevenue();
  }
}, [showRevenueListModal]);

// Load invoices when financial tab is active
useEffect(() => {
  if (activeTab === 'financial') {
    loadInvoices();
  }
}, [activeTab]);

// Load inventory data when inventory tab is active
useEffect(() => {
  if (activeTab === 'inventory') {
    loadInventoryItems();
    loadInventoryDashboard();
    loadLowStockAlerts();
  }
}, [activeTab, inventoryFilter]);

const ensureNumericFinancialData = () => {
  console.log('🔧 Ensuring all financial data is numeric...');
  
  // Fix revenue data
  if (Array.isArray(revenue)) {
    revenue.forEach((rev, index) => {
      if (typeof rev.amount === 'string') {
        console.log(`⚠️  Converting revenue[${index}].amount from string "${rev.amount}" to number`);
        rev.amount = parseFloat(rev.amount) || 0;
      }
      if (typeof rev.amountUSD === 'string') {
        rev.amountUSD = parseFloat(rev.amountUSD) || 0;
      }
    });
  }
  
  // Fix expense data
  if (Array.isArray(expenses)) {
    expenses.forEach((exp, index) => {
      if (typeof exp.amount === 'string') {
        console.log(`⚠️  Converting expense[${index}].amount from string "${exp.amount}" to number`);
        exp.amount = parseFloat(exp.amount) || 0;
      }
      if (typeof exp.amountUSD === 'string') {
        exp.amountUSD = parseFloat(exp.amountUSD) || 0;
      }
    });
  }
  
  console.log('✅ Financial data numeric conversion completed');
};
  const setFallbackProperties = () => {
    const fallbackData = [
      {
        id: 'ground-floor',
        name: 'Halcyon Rest - Ground Floor',
        unit: 'Ground Floor',
        basePriceLKR: Math.round(112 * currencyRate), // Higher price
        pricing: { 
          basePriceLKR: Math.round(112 * currencyRate), 
          basePriceUSD: 112,
          priceRangeUSD: { min: 104, max: 122 }
        },
        maxAdults: 4,
        maxChildren: 3,
        amenities: ['Air Conditioning', 'WiFi', 'Kitchen', 'Garden Access'],
        status: 'available'
      },
      {
        id: 'first-floor',
        name: 'Halcyon Rest - First Floor',
        unit: 'First Floor',
        basePriceLKR: Math.round(111 * currencyRate), // Lower price
        pricing: { 
          basePriceLKR: Math.round(111 * currencyRate), 
          basePriceUSD: 111,
          priceRangeUSD: { min: 102, max: 120 }
        },
        maxAdults: 4,
        maxChildren: 3,
        amenities: ['Air Conditioning', 'WiFi', 'Kitchen', 'Balcony'],
        status: 'available'
      }
    ];
    setProperties(fallbackData);
    console.log('Using fallback properties data');
  };



  // NEW: Update pricing for a unit
  const updatePricing = async () => {
    if (!pricingForm.unitId) {
      setError('Please select a unit');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/pricing/${pricingForm.unitId}`, {
        basePricing: pricingForm.basePricing
      });

      if (response.data.success) {
        setSuccess('Pricing updated successfully!');
        setShowPricingModal(false);
        await Promise.all([
          loadPricingData(),
          loadProperties(),
          loadCalendarData()
        ]);
      } else {
        setError(response.data.message || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Failed to update pricing:', error);
      setError('Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Block dates manually
  const blockDates = async () => {
    if (!dateBlockForm.unitId || !dateBlockForm.startDate || !dateBlockForm.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/block`, dateBlockForm);

      if (response.data.success) {
        setSuccess('Dates blocked successfully!');
        await Promise.all([
          loadCalendarData(),
          loadCalendarOverrides()
        ]);
        setDateBlockForm({
          unitId: '',
          startDate: '',
          endDate: '',
          reason: 'Manual block'
        });
      } else {
        setError(response.data.message || 'Failed to block dates');
      }
    } catch (error) {
      console.error('Failed to block dates:', error);
      setError('Failed to block dates');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Set custom pricing for date range
  const setCustomPricing = async () => {
    if (!customPricingForm.unitId || !customPricingForm.startDate || !customPricingForm.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/pricing`, customPricingForm);

      if (response.data.success) {
        setSuccess('Custom pricing set successfully!');
        await Promise.all([
          loadCalendarData(),
          loadCalendarOverrides()
        ]);
        setCustomPricingForm({
          unitId: '',
          startDate: '',
          endDate: '',
          pricing: {
            guest1: { USD: 104 },
            guest2: { USD: 112 },
            guest3: { USD: 122 },
            guest4: { USD: 122 }
          },
          reason: 'Special rate'
        });
      } else {
        setError(response.data.message || 'Failed to set custom pricing');
      }
    } catch (error) {
      console.error('Failed to set custom pricing:', error);
      setError('Failed to set custom pricing');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Add external calendar integration
  const addExternalCalendar = async () => {
    if (!externalCalendarForm.unitId || !externalCalendarForm.platform || !externalCalendarForm.calendarUrl) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/external`, externalCalendarForm);

      if (response.data.success) {
        setSuccess(`${externalCalendarForm.platform} calendar integration added successfully!`);
        setShowExternalCalendarModal(false);
        loadExternalCalendars();
        setExternalCalendarForm({
          unitId: '',
          platform: 'booking.com',
          calendarUrl: '',
          name: '',
          syncStrategy: 'import_only'
        });
      } else {
        setError(response.data.message || 'Failed to add external calendar');
      }
    } catch (error) {
      console.error('Failed to add external calendar:', error);
      setError('Failed to add external calendar integration');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Sync external calendar
  const syncExternalCalendar = async (integrationId) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/external/${integrationId}/sync`);

      if (response.data.success) {
        setSuccess(`Calendar synced successfully! Synced ${response.data.data.syncedDates || 0} dates.`);
        await Promise.all([
          loadExternalCalendars(),
          loadCalendarData()
        ]);
      } else {
        setError(response.data.message || 'Failed to sync calendar');
      }
    } catch (error) {
      console.error('Failed to sync calendar:', error);
      setError('Failed to sync external calendar');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Remove external calendar integration
  const removeExternalCalendar = async (integrationId) => {
    if (!window.confirm('Are you sure you want to remove this calendar integration?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/calendar/external/${integrationId}`);

      if (response.data.success) {
        setSuccess('External calendar integration removed successfully!');
        await Promise.all([
          loadExternalCalendars(),
          loadCalendarData()
        ]);
      } else {
        setError(response.data.message || 'Failed to remove integration');
      }
    } catch (error) {
      console.error('Failed to remove external calendar:', error);
      setError('Failed to remove external calendar integration');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Auto-sync all external calendars
  const syncAllExternalCalendars = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/calendar/external/sync-all`);

      if (response.data.success) {
        const { successfulSyncs, failedSyncs } = response.data.data;
        setSuccess(`Sync completed: ${successfulSyncs || 0} successful, ${failedSyncs || 0} failed`);
        await Promise.all([
          loadExternalCalendars(),
          loadCalendarData()
        ]);
      } else {
        setError('Failed to sync calendars');
      }
    } catch (error) {
      console.error('Failed to sync all calendars:', error);
      setError('Failed to sync external calendars');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Get export URL for unit
  const getExportUrl = (unitId) => {
    return `${API_BASE_URL}/calendar/export/${unitId}?format=ical`;
  };

  const checkAvailability = async () => {
    if (!availabilityDates.checkIn || !availabilityDates.checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/reservations/availability/check`, {
        params: {
          checkIn: availabilityDates.checkIn,
          checkOut: availabilityDates.checkOut
        }
      });

      console.log('Availability response:', response.data);

      if (response.data.success) {
        setAvailabilityData(response.data.data);
        setSuccess('Availability checked successfully!');
      } else {
        setError(response.data.message || 'Failed to check availability');
      }
    } catch (error) {
      console.error('Availability check error:', error);
      setError('Failed to connect to server. Please ensure your backend is running on localhost:3001');
    } finally {
      setLoading(false);
    }
  };

  const createReservation = async () => {
    if (!bookingForm.propertyId || !bookingForm.checkIn || !bookingForm.checkOut || 
        !bookingForm.guestInfo.bookerName || !bookingForm.guestInfo.country) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reservationData = {
        propertyId: bookingForm.propertyId,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        adults: bookingForm.adults,
        children: bookingForm.children,
        childrenAges: bookingForm.childrenAges, // NEW: Include children ages
        paymentCurrency: bookingForm.paymentCurrency,
        source: bookingForm.source,
        guestInfo: bookingForm.guestInfo,
        specialRequests: bookingForm.specialRequests
      };

      console.log('Creating reservation with data:', reservationData);

      const response = await axios.post(`${API_BASE_URL}/reservations`, reservationData);

      console.log('Reservation response:', response.data);

      if (response.data.success) {
        setSuccess(`Reservation created successfully! Confirmation: ${response.data.data.confirmationNumber}`);
        setShowBookingModal(false);
        loadReservations();
        loadDashboardData(); // Refresh dashboard
        
        setBookingForm({
          propertyId: '',
          checkIn: '',
          checkOut: '',
          adults: 2,
          children: 0,
          childrenAges: [],
          paymentCurrency: 'USD',
          source: 'direct',
          guestInfo: { bookerName: '', country: '', email: '', phone: '' },
          specialRequests: ''
        });
      } else {
        setError(response.data.message || 'Failed to create reservation');
      }
    } catch (error) {
      console.error('Reservation creation error:', error);
      if (error.response) {
        setError(`Server error: ${error.response.data.message || error.response.status}`);
      } else {
        setError('Failed to connect to server. Please ensure your backend is running on localhost:3001');
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Send message
  const sendMessage = async () => {
    if (!messageForm.message.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const messageData = {
        senderId: currentUser.id,
        senderName: currentUser.name,
        senderRole: currentUser.role,
        receiverId: messageForm.receiverId || null,
        receiverName: messageForm.receiverName || null,
        subject: messageForm.subject,
        message: messageForm.message,
        type: messageForm.type,
        priority: messageForm.priority,
        reservationId: messageForm.reservationId || null
      };

      console.log('Sending message:', messageData);

      const response = await axios.post(`${API_BASE_URL}/messages`, messageData);

      if (response.data.success) {
        setSuccess('Message sent successfully!');
        setShowMessageModal(false);
        loadMessages();
        loadConversations();
        
        setMessageForm({
          receiverId: '',
          receiverName: '',
          subject: '',
          message: '',
          type: 'staff',
          priority: 'normal',
          reservationId: ''
        });
      } else {
        setError(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Message sending error:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  // Update reservation status and payment
 

  // View detailed reservation
  const viewReservationDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
  };
// Add these functions after your existing modal handlers
  const handleExpenseModalOpen = () => {
    setShowExpenseModal(true);
    // TODO: Will implement expense modal later
    setSuccess('Expense management coming soon!');
  };

  const handleRevenueModalOpen = () => {
    setShowRevenueModal(true);
    // TODO: Will implement revenue modal later  
    setSuccess('Revenue management coming soon!');
  };
  // Calculate effective guests (children >11 count as adults)
  const calculateEffectiveGuests = (adults, children, childrenAges) => {
    let effectiveAdults = parseInt(adults) || 0;
    let effectiveChildren = 0;
    
    if (Array.isArray(childrenAges)) {
      childrenAges.forEach(age => {
        if (parseInt(age) > 11) {
          effectiveAdults += 1;
        } else {
          effectiveChildren += 1;
        }
      });
    } else {
      effectiveChildren = parseInt(children) || 0;
    }
    
    return { effectiveAdults, effectiveChildren };
  };

  const formatCurrency = (amount, currency = 'LKR') => {
    if (!amount && amount !== 0) return `${currency} 0`;
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'LKR' ? 0 : 2
    }).format(amount || 0);
    // Ensure proper spacing in the formatted output
    return formatted.replace(/([A-Z]{3})(\d)/, '$1 $2');
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  const getPropertyPrice = (propertyId, adults = 2, children = 0, childrenAges = []) => {
      // Calculate effective adults (children >11 count as adults)
      let effectiveAdults = parseInt(adults) || 2;
      
      if (Array.isArray(childrenAges)) {
        childrenAges.forEach(age => {
          if (parseInt(age) > 11) {
            effectiveAdults += 1;
          }
        });
      }
      
      // Get base pricing from pricingData if available
      if (pricingData && pricingData.units) {
        const unit = pricingData.units.find(u => u.id === propertyId);
        if (unit && unit.basePricing) {
          // Use guest count to determine pricing tier
          if (effectiveAdults === 1) {
            return unit.basePricing.guest1?.LKR || Math.round(unit.basePricing.guest1?.USD * currencyRate);
          } else if (effectiveAdults === 2) {
            return unit.basePricing.guest2?.LKR || Math.round(unit.basePricing.guest2?.USD * currencyRate);
          } else if (effectiveAdults === 3) {
            return unit.basePricing.guest3?.LKR || Math.round(unit.basePricing.guest3?.USD * currencyRate);
          } else {
            return unit.basePricing.guest4?.LKR || Math.round(unit.basePricing.guest4?.USD * currencyRate);
          }
        }
      }
      
      // Fallback to property data
      const property = properties.find(p => p.id === propertyId);
      if (property) {
        return property.basePriceLKR || property.pricing?.basePriceLKR;
      }
      
      // Final fallback with guest-based pricing
      const baseUSD = propertyId === 'first-floor' ? 
        (effectiveAdults === 1 ? 102 : effectiveAdults === 2 ? 110 : 120) :
        (effectiveAdults === 1 ? 104 : effectiveAdults === 2 ? 112 : 122);
      
      return Math.round(baseUSD * currencyRate);
    };
    const calculateTotalPrice = () => {
      if (!bookingForm.propertyId || !bookingForm.checkIn || !bookingForm.checkOut) return 0;
      const nights = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
      const pricePerNight = getPropertyPrice(
        bookingForm.propertyId, 
        bookingForm.adults, 
        bookingForm.children, 
        bookingForm.childrenAges
      );
      return pricePerNight * nights;
    };

  // Get payment status badge style
  const getPaymentStatusStyle = (paymentStatus) => {
    switch (paymentStatus) {
      case 'full-payment':
        return 'status-badge confirmed';
      case 'advance-payment':
        return 'status-badge pending';
      case 'not-paid':
        return 'status-badge occupied';
      default:
        return 'status-badge pending';
    }
  };

const stats = dashboardData ? {
  totalUnits: dashboardData.overview?.totalUnits || dashboardData.operations?.totalUnits || 2,
  occupiedUnits: dashboardData.overview?.activeReservations || dashboardData.operations?.activeReservations || 0,
  totalReservations: dashboardData.overview?.monthlyReservations || dashboardData.operations?.totalReservations || 0,
  monthlyRevenue: parseFloat(dashboardData.revenue?.monthlyLKR) || parseFloat(dashboardData.kpis?.monthlyRevenue) || parseFloat(dashboardData.financialOverview?.monthly?.revenue) || 0
} : {
  totalUnits: Array.isArray(properties) ? properties.length : 0,
  occupiedUnits: Array.isArray(reservations) ? reservations.filter(r => r.status === 'confirmed' || r.status === 'pending').length : 0,
  totalReservations: Array.isArray(reservations) ? reservations.length : 0,
  // 🔥 FIX: Use backend calculation logic for consistency
  monthlyRevenue: Array.isArray(reservations) ? reservations.reduce((sum, r) => {
    // Match backend calculation exactly - only use totalLKR from pricing
    const amount = parseFloat(r.pricing?.totalLKR) || 0;
    return sum + amount;
  }, 0) : 0
};
  // Show loading screen on initial load
  if (initialLoading) {
    return <LoadingScreen message="Initializing Halcyon Rest Management System..." />;
  }

  // Centralized tab definitions
  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'properties', label: 'Properties', icon: '🏠' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
    { id: 'guests', label: 'Guests', icon: '👤' },
    { id: 'invoices', label: 'Invoices', icon: '📄' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'accounting', label: 'Accounting', icon: '📚' },
    { id: 'analytics', label: 'Analytics & Reports', icon: '📈' },
    { id: 'notifications', label: 'Notifications & Email', icon: '🔔' },
    { id: 'upload', label: 'Upload & Export', icon: '📤' },
    { id: 'financial', label: 'Financial (Legacy)', icon: '💰' },
    { id: 'calendar', label: 'Calendar', icon: '🗓️' },
    { id: 'pricing', label: 'Pricing', icon: '💎' },
    { id: 'messages', label: 'Messages', icon: '📨' },
    { id: 'users', label: 'Users', icon: '👥' }
  ];

  // Helper component for filter tabs
  const FilterTabs = ({ items = [], current, onChange }) => (
    <div className="filter-tabs">
      {items.map(filter => (
        <button
          key={filter.id}
          onClick={() => onChange(filter.id)}
          className={`filter-tab ${current === filter.id ? 'active' : ''}`}
        >
          {filter.label}
          <span className="count-badge">{filter.count}</span>
        </button>
      ))}
    </div>
  );

  return (
    <ProfessionalBackground>
      <div className="app app-professional">
        {/* Sidebar Navigation */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>
              <span className="logo-icon">🏖️</span>
              Halcyon Rest
            </h1>
          </div>
          <nav className="sidebar-nav">
            {TABS
              .filter(tab => {
                // Hide Users tab for non-admin roles
                if (tab.id === 'users') {
                  return authenticatedUser?.role === 'super_admin' || 
                         authenticatedUser?.role === 'admin' || 
                         authenticatedUser?.role === 'manager';
                }
                return true;
              })
              .map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
                >
                  <span className="icon">{icon}</span>
                  <span>{label}</span>
                  {id === 'messages' && messages.filter(m => !m.read).length > 0 && (
                    <span className="badge">{messages.filter(m => !m.read).length}</span>
                  )}
                </button>
              ))}
          </nav>
        </aside>

        {/* Main Container */}
        <div className="main-container">
          {/* Header */}
          <header className="header-professional">
            <div className="header-content-professional">
              <h2 className="header-title">
                {TABS.find(t => t.id === activeTab)?.label || activeTab}
              </h2>
              <div className="header-actions-professional">
                <button
                  onClick={() => {
                    loadProperties();
                    loadReservations();
                    loadCurrencyRate();
                    loadDashboardData();
                    loadMessages();
                    loadConversations();
                  }}
                  className="btn-secondary btn-professional-secondary"
                >
                  🔄 Refresh
                </button>
                <div className="currency-rate" style={{
                  padding: '0.5rem 1rem',
                  background: 'rgba(16, 185, 129, 0.15)',
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  color: '#10b981',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  💱 1 USD = {currencyRate.toFixed(2)} LKR
                </div>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="btn-primary btn-professional-primary"
                >
                  <span>➕</span>
                  <span>New Reservation</span>
                </button>
                {authenticatedUser && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.5rem 1rem',
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#3b82f6' }}>
                        {authenticatedUser.firstName} {authenticatedUser.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'capitalize' }}>
                        {authenticatedUser.role.replace('_', ' ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={openProfileModal}
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          color: '#3b82f6'
                        }}
                        title="My Profile"
                      >
                        👤 Profile
                      </button>
                      <button
                        onClick={handleLogout}
                        className="btn-secondary"
                        style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#ef4444'
                        }}
                        title="Logout"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="main-content-professional">
            {/* Success/Error Messages */}
            {success && (
              <div className="alert alert-success">
                <span className="alert-icon">✅</span>
                <span>{success}</span>
                <button onClick={() => setSuccess('')} className="alert-close">
                  <span className="close-icon">✕</span>
                </button>
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">⚠️</span>
                <span>{error}</span>
                <button onClick={() => setError('')} className="alert-close">
                  <span className="close-icon">✕</span>
                </button>
              </div>
            )}

            {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="dashboard page-transition">
            {/* Enhanced Stats Grid with Financial Data */}
            <div className="stats-grid stats-grid-professional">
              {[
                { 
                  icon: '🏠', 
                  label: 'Total Units', 
                  value: stats.totalUnits, 
                  color: 'blue',
                  trend: null
                },
                { 
                  icon: '👥', 
                  label: 'Occupied', 
                  value: stats.occupiedUnits, 
                  color: 'green',
                  trend: null
                },
                { 
                  icon: '📅', 
                  label: 'Reservations', 
                  value: stats.totalReservations, 
                  color: 'purple',
                  trend: null
                },
                { 
                  icon: '💰', 
                  label: 'Monthly Revenue', 
                  value: formatCurrency(stats.monthlyRevenue), 
                  color: 'emerald',
                  secondary: dashboardData?.kpis ? `Profit: ${formatCurrency(dashboardData.kpis.monthlyProfit)}` : null
                }
              ].map((stat, index) => (
                <div 
                  key={stat.label}
                  className={`stat-card ${animationTriggers.statsUpdated ? 'loading-state' : ''}`}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    transform: hoveredCard === index ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                >
                  <div className={`stat-icon text-${stat.color}-500`} style={{ fontSize: '2rem' }}>
                    {stat.icon}
                  </div>
                  <div className="stat-info">
                    <div className="stat-label">{stat.label}</div>
                    <div className={`stat-value ${hoveredCard === index ? 'text-blue-600' : ''}`}>
                      {stat.value}
                    </div>
                    {stat.secondary && (
                      <div className="stat-secondary" style={{ 
                        fontSize: '0.75rem', 
                        color: '#059669', 
                        fontWeight: '500',
                        marginTop: '0.25rem'
                      }}>
                        {stat.secondary}
                      </div>
                    )}
                    {hoveredCard === index && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: '#6b7280', 
                        marginTop: '0.25rem',
                        opacity: 0,
                        animation: 'fadeIn 0.3s ease-out 0.1s forwards'
                      }}>
                        {index === 0 && 'Property units available'}
                        {index === 1 && 'Currently occupied units'}
                        {index === 2 && 'This month\'s bookings'}
                        {index === 3 && 'Total revenue this month'}
                      </div>
                    )}
                  </div>
                  {hoveredCard === index && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      fontSize: '1.5rem',
                      opacity: 0,
                      animation: 'checkmark 0.6s ease-out'
                    }}>
                      📈
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* NEW: Financial Overview Cards */}
            {dashboardData && dashboardData.financialOverview && (
              <div className="financial-overview-section">
                <div className="section-header">
                  <h2>📊 Financial Overview</h2>
                  <button
                    onClick={() => setActiveTab('financial')}
                    className="btn-secondary btn-professional-secondary"
                  >
                    View Full Reports
                  </button>
                </div>
                
                <div className="financial-overview-grid">
                  <div className="financial-period-card">
                    <h3>Today</h3>
                    <div className="financial-metrics">
                      <div className="metric">
                        <span className="metric-label">Revenue</span>
                        <span className="metric-value revenue">{formatCurrency(dashboardData.financialOverview.today.revenue)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Expenses</span>
                        <span className="metric-value expense">{formatCurrency(dashboardData.financialOverview.today.expenses)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Profit</span>
                        <span className={`metric-value ${dashboardData.financialOverview.today.profit >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(dashboardData.financialOverview.today.profit)}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Margin</span>
                        <span className="metric-value margin">{dashboardData.financialOverview.today.profitMargin}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="financial-period-card">
                    <h3>This Week</h3>
                    <div className="financial-metrics">
                      <div className="metric">
                        <span className="metric-label">Revenue</span>
                        <span className="metric-value revenue">{formatCurrency(dashboardData.financialOverview.thisWeek.revenue)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Expenses</span>
                        <span className="metric-value expense">{formatCurrency(dashboardData.financialOverview.thisWeek.expenses)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Profit</span>
                        <span className={`metric-value ${dashboardData.financialOverview.thisWeek.profit >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(dashboardData.financialOverview.thisWeek.profit)}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Margin</span>
                        <span className="metric-value margin">{dashboardData.financialOverview.thisWeek.profitMargin}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="financial-period-card">
                    <h3>This Month</h3>
                    <div className="financial-metrics">
                      <div className="metric">
                        <span className="metric-label">Revenue</span>
                        <span className="metric-value revenue">{formatCurrency(dashboardData.financialOverview.thisMonth.revenue)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Expenses</span>
                        <span className="metric-value expense">{formatCurrency(dashboardData.financialOverview.thisMonth.expenses)}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Profit</span>
                        <span className={`metric-value ${dashboardData.financialOverview.thisMonth.profit >= 0 ? 'profit' : 'loss'}`}>
                          {formatCurrency(dashboardData.financialOverview.thisMonth.profit)}
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Margin</span>
                        <span className="metric-value margin">{dashboardData.financialOverview.thisMonth.profitMargin}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NEW: Financial Alerts Section */}
            {dashboardData && dashboardData.alerts && (
              <div className="financial-alerts-section">
                <div className="section-header">
                  <h2>⚠️ Action Items</h2>
                </div>
                
                <div className="alerts-grid">
                  {dashboardData.alerts.pendingExpenseApprovals > 0 && (
                    <div className="alert-card expense-alert">
                      <div className="alert-icon">💸</div>
                      <div className="alert-content">
                        <div className="alert-title">Pending Expense Approvals</div>
                        <div className="alert-value">{dashboardData.alerts.pendingExpenseApprovals} items</div>
                        <div className="alert-subtitle">
                          Total: {formatCurrency(dashboardData.alerts.totalPendingExpenseAmount)}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('financial')}
                        className="alert-action-btn"
                      >
                        Review
                      </button>
                    </div>
                  )}

                  {dashboardData.alerts.unpaidReservations > 0 && (
                    <div className="alert-card payment-alert">
                      <div className="alert-icon">💳</div>
                      <div className="alert-content">
                        <div className="alert-title">Unpaid Reservations</div>
                        <div className="alert-value">{dashboardData.alerts.unpaidReservations} bookings</div>
                        <div className="alert-subtitle">
                          Amount: {formatCurrency(dashboardData.alerts.totalUnpaidReservationAmount)}
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('reservations')}
                        className="alert-action-btn"
                      >
                        Follow Up
                      </button>
                    </div>
                  )}

                  {dashboardData.alerts.lowStockAlerts > 0 && (
                    <div className="alert-card inventory-alert">
                      <div className="alert-icon">📦</div>
                      <div className="alert-content">
                        <div className="alert-title">Low Stock Items</div>
                        <div className="alert-value">{dashboardData.alerts.lowStockAlerts} items</div>
                        <div className="alert-subtitle">Need restocking</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('inventory')}
                        className="alert-action-btn"
                      >
                        Restock
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Existing Today's Activities section... */}
            {/* Today's Activities section */}
            {dashboardData && (
              <div className="today-activities">
                <div className="section-header">
                  <h2>Today's Activities</h2>
                  <div className="activity-summary">
                    <span className="activity-count arrivals">
                      Arrivals: {dashboardData.todayActivities?.arrivals?.count || 0}
                    </span>
                    <span className="activity-count departures">
                      Departures: {dashboardData.todayActivities?.departures?.count || 0}
                    </span>
                    <span className="activity-count stayovers">
                      Stay-overs: {dashboardData.todayActivities?.stayOvers?.count || 0}
                    </span>
                    <span className="activity-count requests">
                      Requests: {dashboardData.todayActivities?.guestRequests?.count || 0}
                    </span>
                  </div>
                </div>

                <div className="activities-grid">
                  <div className="activity-card">
                    <div className="activity-header">
                      <h3>🛬 Arrivals ({dashboardData.todayActivities?.arrivals?.count || 0})</h3>
                    </div>
                    <div className="activity-content">
                      {!dashboardData.todayActivities?.arrivals?.count ? (
                        <p className="no-activity">No arrivals for today</p>
                      ) : (
                        <div className="activity-list">
                          {dashboardData.todayActivities.arrivals.reservations?.map(reservation => (
                            <div key={reservation.id} className="activity-item">
                              <div className="activity-info">
                                <span className="guest-name">{reservation.guestName}</span>
                                <span className="unit-name">{reservation.unit}</span>
                              </div>
                              <div className="activity-details">
                                <span className="confirmation">{reservation.confirmationNumber}</span>
                                <span className="guest-count">{reservation.adults}+{reservation.children}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="activity-card">
                    <div className="activity-header">
                      <h3>🛫 Departures ({dashboardData.todayActivities?.departures?.count || 0})</h3>
                    </div>
                    <div className="activity-content">
                      {!dashboardData.todayActivities?.departures?.count ? (
                        <p className="no-activity">No departures for today</p>
                      ) : (
                        <div className="activity-list">
                          {dashboardData.todayActivities.departures.reservations?.map(reservation => (
                            <div key={reservation.id} className="activity-item">
                              <div className="activity-info">
                                <span className="guest-name">{reservation.guestName}</span>
                                <span className="unit-name">{reservation.unit}</span>
                              </div>
                              <div className="activity-details">
                                <span className="confirmation">{reservation.confirmationNumber}</span>
                                <span className="guest-count">{reservation.adults}+{reservation.children}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="activity-card">
                    <div className="activity-header">
                      <h3>🏠 Stay-overs ({dashboardData.todayActivities?.stayOvers?.count || 0})</h3>
                    </div>
                    <div className="activity-content">
                      {!dashboardData.todayActivities?.stayOvers?.count ? (
                        <p className="no-activity">No stay-overs today</p>
                      ) : (
                        <div className="activity-list">
                          {dashboardData.todayActivities.stayOvers.reservations?.map(reservation => (
                            <div key={reservation.id} className="activity-item">
                              <div className="activity-info">
                                <span className="guest-name">{reservation.guestName}</span>
                                <span className="unit-name">{reservation.unit}</span>
                              </div>
                              <div className="activity-details">
                                <span className="confirmation">{reservation.confirmationNumber}</span>
                                <span className="checkout-date">Until: {reservation.checkOut}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="activity-card">
                    <div className="activity-header">
                      <h3>📝 Guest Requests ({dashboardData.todayActivities?.guestRequests?.count || 0})</h3>
                    </div>
                    <div className="activity-content">
                      {!dashboardData.todayActivities?.guestRequests?.count ? (
                        <p className="no-activity">No guest requests</p>
                      ) : (
                        <div className="activity-list">
                          {dashboardData.todayActivities.guestRequests.requests?.map(request => (
                            <div key={request.id} className="activity-item">
                              <div className="activity-info">
                                <span className="guest-name">{request.guestName}</span>
                                <span className="unit-name">{request.unit}</span>
                              </div>
                              <div className="activity-details">
                                <span className="request-text">{request.request.substring(0, 50)}...</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="view-all-section">
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="btn-primary view-all-btn"
                  >
                    View all reservations
                  </button>
                </div>
              </div>
            )}

            {/* Enhanced Quick Actions */}
            <div className="quick-actions-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions-grid">
                <button
                  onClick={() => setShowAvailabilityModal(true)}
                  className="quick-action-btn availability-btn"
                >
                  <span className="quick-action-icon">🔍</span>
                  <span>Check Availability</span>
                </button>
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="quick-action-btn booking-btn"
                >
                  <span className="quick-action-icon">➕</span>
                  <span>New Reservation</span>
                </button>
                <button
                  onClick={() => setShowExpenseListModal(true)}
                  className="quick-action-btn expense-btn"
                >
                  <span className="quick-action-icon">💸</span>
                  <span>Manage Expenses</span>
                </button>
                <button
                  onClick={handleRevenueModalOpen}
                  className="quick-action-btn revenue-btn"
                >
                  <span className="quick-action-icon">💰</span>
                  <span>Record Revenue</span>
                </button>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="quick-action-btn calendar-btn"
                >
                  <span className="quick-action-icon">🗓️</span>
                  <span>Manage Calendar</span>
                </button>
                <button
                  onClick={() => setShowPricingModal(true)}
                  className="quick-action-btn pricing-btn"
                >
                  <span className="quick-action-icon">🔰</span>
                  <span>Update Pricing</span>
                </button>
                <button
                  onClick={() => setShowMessageModal(true)}
                  className="quick-action-btn message-btn"
                >
                  <span className="quick-action-icon">📨</span>
                  <span>Send Message</span>
                </button>
                <button
                  onClick={syncAllExternalCalendars}
                  className="quick-action-btn sync-btn"
                  disabled={loading || externalCalendars.length === 0}
                >
                  <span className="quick-action-icon">🔄</span>
                  <span>Sync Calendars</span>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'properties' && (
          <div className="properties-section">
            <div className="section-header">
              <h2>Properties</h2>
              <button
                onClick={() => setShowAvailabilityModal(true)}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                <span>🔍</span>
                <span>Check Availability</span>
              </button>
            </div>

            <div className="properties-grid">
              {Array.isArray(properties) && properties.map((property) => (
                <div key={property.id} className="property-card">
                  <div className="property-header">
                    <h3>{property.name || `Halcyon Rest - ${property.unit || 'Unit'}`}</h3>
                    <span className={`status-badge ${property.status || 'available'}`}>
                      {property.status || 'available'}
                    </span>
                  </div>
                  
                  <div className="property-details">
                    <div className="property-detail">
                      <span className="detail-label">Price per night:</span>
                      <div className="detail-value">
                        <div>{formatCurrency(property.basePriceLKR || property.pricing?.basePriceLKR, 'LKR')}</div>
                        <div className="detail-secondary">
                          {formatCurrency((property.basePriceLKR || property.pricing?.basePriceLKR || 20000) / currencyRate, 'USD')}
                        </div>
                        {property.pricing?.priceRangeUSD && (
                          <div className="price-range">
                            US${property.pricing.priceRangeUSD.min}-${property.pricing.priceRangeUSD.max}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="property-detail">
                      <span className="detail-label">Capacity:</span>
                      <span className="detail-value">
                        {property.maxAdults || 4} adults, {property.maxChildren || 3} children
                      </span>
                    </div>
                    <div className="property-detail">
                      <span className="detail-label">Children Policy:</span>
                      <span className="detail-value children-policy">
                        ≤11 years: Free | &gt;11 years: Adult rate
                      </span>
                    </div>
                  </div>

                  <div className="amenities-section">
                    <h4>Amenities</h4>
                    <div className="amenities-list">
                      {Array.isArray(property.amenities) && property.amenities.map((amenity, index) => (
                        <span key={index} className="amenity-tag">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="property-actions">
                    <button
                      onClick={() => {
                        setBookingForm(prev => ({ ...prev, propertyId: property.id }));
                        setShowBookingModal(true);
                      }}
                      className="btn-primary property-btn"
                    >
                      Book Now
                    </button>
                    <button className="btn-secondary property-btn">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="reservations-section">
            <div className="section-header">
              <h2>Reservations</h2>
              <button
                onClick={() => setShowBookingModal(true)}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                <span>➕</span>
                <span>New Reservation</span>
              </button>
            </div>

            <div className="reservations-card">
              {!Array.isArray(reservations) || reservations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📅</div>
                  <h3>No reservations</h3>
                  <p>Get started by creating a new reservation.</p>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="btn-primary btn-professional-primary btn-ripple hover-scale"
                  >
                    <span>➕</span>
                    New Reservation
                  </button>
                </div>
              ) : (
                <div className="table-container">
                  <table className="reservations-table">
                    <thead>
                      <tr>
                        <th>Confirmation</th>
                        <th>Guest</th>
                        <th>Property</th>
                        <th>Dates</th>
                        <th>Guests</th>
                        <th>Amount</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map((reservation, index) => (
                        <tr key={reservation.id || index}>
                          <td>
                            <div className="confirmation-info">
                              <div className="confirmation-number">
                                {reservation.confirmationNumber || 'N/A'}
                              </div>
                              <div className="created-date">
                                {reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString() : ''}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="guest-info">
                              <button 
                                className="guest-name clickable-guest"
                                onClick={() => viewReservationDetails(reservation)}
                                style={{ 
                                  background: 'none', 
                                  border: 'none', 
                                  color: '#2563eb', 
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: 0,
                                  font: 'inherit'
                                }}
                              >
                                {reservation.guestInfo?.bookerName || reservation.guest?.bookerName || 'N/A'}
                              </button>
                              <div className="guest-country">
                                {reservation.guestInfo?.country || reservation.guest?.country || ''}
                              </div>
                              <div className="guest-contact">
                                {reservation.guestInfo?.email || 'No email'}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="property-info">
                              <div className="property-name">
                                {reservation.unitName || reservation.property?.name || reservation.propertyId}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="date-info">
                              <div className="check-dates">
                                {reservation.dates?.checkIn || reservation.checkIn}
                              </div>
                              <div className="check-dates">
                                to {reservation.dates?.checkOut || reservation.checkOut}
                              </div>
                              <div className="nights-count">
                                {reservation.dates?.nights || calculateNights(reservation.checkIn, reservation.checkOut)} nights
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="guest-count-info">
                              <div className="guest-breakdown">
                                {reservation.guestInfo?.adults || 0} adults
                              </div>
                              <div className="guest-breakdown">
                                {reservation.guestInfo?.children || 0} children
                              </div>
                              {reservation.guestInfo?.childrenAges && reservation.guestInfo.childrenAges.length > 0 && (
                                <div className="children-ages">
                                  Ages: {reservation.guestInfo.childrenAges.join(', ')}
                                </div>
                              )}
                              {reservation.guestInfo?.effectiveAdults && (
                                <div className="effective-guests">
                                  Effective: {reservation.guestInfo.effectiveAdults} adults
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="amount-info">
                              <div className="amount-main">
                                {formatCurrency(reservation.pricing?.totalLKR || reservation.totalAmount || 0, 'LKR')}
                              </div>
                              <div className="amount-secondary">
                                {formatCurrency(
                                  (reservation.pricing?.totalUSD || (reservation.pricing?.totalLKR || 0) / currencyRate), 
                                  'USD'
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <select
                              value={reservation.paymentStatus || 'not-paid'}
                              onChange={(e) => updateReservationStatus(reservation.id, reservation.status, e.target.value)}
                              className={`status-badge ${getPaymentStatusStyle(reservation.paymentStatus || 'not-paid')}`}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                              <option value="not-paid">Not Paid</option>
                              <option value="advance-payment">Advance</option>
                              <option value="full-payment">Full Payment</option>
                            </select>
                          </td>
                          <td>
                            <select
                              value={reservation.status || 'pending'}
                              onChange={(e) => updateReservationStatus(reservation.id, e.target.value, reservation.paymentStatus)}
                              className={`status-badge ${reservation.status || 'pending'}`}
                              style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="checked-in">Checked In</option>
                              <option value="checked-out">Checked Out</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <button
                              onClick={() => viewReservationDetails(reservation)}
                              className="btn-secondary btn-professional-secondary"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="messages-section modern-messages">
            <div className="section-header-modern">
              <div className="header-content">
                <h2>💬 Messages & Communications</h2>
                <p className="header-subtitle">Connect with your team and guests</p>
              </div>
              <button
                onClick={() => setShowMessageModal(true)}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                <span>✉️</span>
                <span>New Message</span>
              </button>
            </div>

            <div className="messages-layout-modern">
              <div className="conversations-panel-modern">
                <div className="conversations-header">
                  <h3>Conversations</h3>
                  <span className="conversations-count">{conversations.length}</span>
                </div>
                
                <div className="conversations-search">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder="Search conversations..."
                    className="search-input"
                  />
                </div>

                <div className="conversations-list-modern">
                  {conversations.length === 0 ? (
                    <div className="no-conversations-modern">
                      <div className="empty-icon">💬</div>
                      <h4>No conversations yet</h4>
                      <p>Start connecting with your team or guests</p>
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="btn-start-conversation"
                      >
                        <span>➕</span>
                        Start New Conversation
                      </button>
                    </div>
                  ) : (
                    conversations.map(conversation => (
                      <div
                        key={conversation.conversationId}
                        className={`conversation-item-modern ${selectedConversation?.conversationId === conversation.conversationId ? 'active' : ''}`}
                        onClick={() => setSelectedConversation(conversation)}
                      >
                        <div className="conversation-avatar">
                          <span className="avatar-icon">👤</span>
                          {conversation.unreadCount > 0 && (
                            <span className="avatar-badge">{conversation.unreadCount}</span>
                          )}
                        </div>
                        
                        <div className="conversation-content">
                          <div className="conversation-top">
                            <span className="conversation-name">
                              {conversation.participants.map(p => p.name).join(', ')}
                            </span>
                            <span className="conversation-time">
                              {new Date(conversation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="conversation-bottom">
                            <p className="conversation-preview">
                              {conversation.lastMessage.message.substring(0, 50)}{conversation.lastMessage.message.length > 50 ? '...' : ''}
                            </p>
                          </div>
                          
                          <div className="conversation-badges">
                            <span className={`badge-priority priority-${conversation.priority}`}>
                              {conversation.priority}
                            </span>
                            <span className={`badge-type type-${conversation.type}`}>
                              {conversation.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="messages-panel-modern">
                {selectedConversation ? (
                  <div className="conversation-view-modern">
                    <div className="conversation-header-bar">
                      <div className="header-left">
                        <div className="participant-avatar">
                          <span className="avatar-icon">👤</span>
                        </div>
                        <div className="participant-info">
                          <h3 className="participant-name">
                            {selectedConversation.participants.map(p => p.name).join(', ')}
                          </h3>
                          <span className="participant-status">Active now</span>
                        </div>
                      </div>
                      <div className="header-actions">
                        <button
                          onClick={() => {
                            setMessageForm(prev => ({
                              ...prev,
                              receiverId: selectedConversation.participants.find(p => p.id !== currentUser.id)?.id || '',
                              receiverName: selectedConversation.participants.find(p => p.id !== currentUser.id)?.name || '',
                              subject: `Re: ${selectedConversation.lastMessage.subject || 'Conversation'}`
                            }));
                            setShowMessageModal(true);
                          }}
                          className="btn-icon-action"
                          title="Reply"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                    <div className="messages-list">
                      {messages
                        .filter(m => m.conversationId === selectedConversation.conversationId)
                        .map(message => (
                          <div
                            key={message.id}
                            className={`message-item ${message.senderId === currentUser.id ? 'sent' : 'received'}`}
                          >
                            <div className="message-header">
                              <span className="sender-name">{message.senderName}</span>
                              <span className="message-time">
                                {new Date(message.timestamp).toLocaleString()}
                              </span>
                            </div>
                            {message.subject && (
                              <div className="message-subject">{message.subject}</div>
                            )}
                            <div className="message-content">
                              {message.message}
                            </div>
                            <div className="message-meta">
                              <span className={`priority-badge ${message.priority}`}>
                                {message.priority}
                              </span>
                              {message.reservationId && (
                                <span className="reservation-link">
                                  Related to reservation
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="no-conversation-selected">
                    <div className="placeholder-content">
                      <div className="placeholder-icon">📨</div>
                      <h3>Select a conversation</h3>
                      <p>Choose a conversation from the left to view messages</p>
                      <button
                        onClick={() => setShowMessageModal(true)}
                        className="btn-primary btn-professional-primary btn-ripple hover-scale"
                      >
                        Start New Conversation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'pricing' && (
          <div className="pricing-section modern-pricing">
            <div className="section-header-modern">
              <div className="header-content">
                <h2>💰 Pricing Management</h2>
                <p className="header-subtitle">Manage your property rates and pricing strategies</p>
              </div>
              <button
                onClick={() => setShowPricingModal(true)}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                <span>⚙️</span>
                <span>Update Pricing</span>
              </button>
            </div>

            {/* Exchange Rate Banner */}
            <div className="exchange-rate-banner">
              <div className="rate-info">
                <span className="rate-icon">💱</span>
                <div className="rate-details">
                  <span className="rate-label">Current Exchange Rate</span>
                  <span className="rate-value">1 USD = {currencyRate.toFixed(2)} LKR</span>
                </div>
              </div>
              <span className="rate-note">LKR prices are automatically calculated</span>
            </div>

            {/* Current Pricing Display */}
            {pricingData && pricingData.units ? (
              <div className="pricing-grid-modern">
                {pricingData.units.map(unit => (
                  <div key={unit.id} className="pricing-card-modern">
                    <div className="pricing-card-header">
                      <div className="unit-info">
                        <h3 className="unit-name">{unit.name}</h3>
                        <span className="last-updated">
                          <span className="update-icon">🕐</span>
                          Updated: {new Date(unit.lastUpdated).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="price-range-badge">
                        <span className="range-label">Price Range</span>
                        <span className="range-value">US${unit.priceRangeUSD.min} - US${unit.priceRangeUSD.max}</span>
                      </div>
                    </div>
                    
                    <div className="pricing-table">
                      <div className="pricing-table-header">
                        <span>Guests</span>
                        <span>USD</span>
                        <span>LKR</span>
                      </div>
                      {Object.entries(unit.basePricing).map(([guestType, pricing]) => (
                        <div key={guestType} className="pricing-table-row">
                          <span className="guest-count">
                            <span className="guest-icon">👤</span>
                            {guestType.replace('guest', '')} Guest{guestType !== 'guest1' ? 's' : ''}
                          </span>
                          <span className="price-usd">${pricing.USD}</span>
                          <span className="price-lkr">LKR {pricing.LKR.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pricing-card-footer">
                      <button
                        onClick={() => {
                          setPricingForm({
                            unitId: unit.id,
                            basePricing: unit.basePricing
                          });
                          setShowPricingModal(true);
                        }}
                        className="btn-edit-pricing"
                      >
                        <span>✏️</span>
                        Edit Pricing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pricing-grid-modern">
                {properties.map(property => (
                  <div key={property.id} className="pricing-card-modern">
                    <div className="pricing-card-header">
                      <div className="unit-info">
                        <h3 className="unit-name">{property.name}</h3>
                        <span className="last-updated">
                          <span className="update-icon">🕐</span>
                          Current Pricing
                        </span>
                      </div>
                      <div className="price-range-badge">
                        <span className="range-label">Base Price</span>
                        <span className="range-value">{formatCurrency(property.basePriceLKR || property.pricing?.basePriceLKR, 'LKR')}</span>
                      </div>
                    </div>
                    
                    <div className="pricing-table">
                      <div className="pricing-table-header">
                        <span>Type</span>
                        <span>USD</span>
                        <span>LKR</span>
                      </div>
                      <div className="pricing-table-row">
                        <span className="guest-count">
                          <span className="guest-icon">🌙</span>
                          Per Night
                        </span>
                        <span className="price-usd">${Math.round((property.basePriceLKR || 30000) / currencyRate)}</span>
                        <span className="price-lkr">LKR {(property.basePriceLKR || 30000).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="pricing-card-footer">
                      <button
                        onClick={() => setShowPricingModal(true)}
                        className="btn-edit-pricing"
                      >
                        <span>⚙️</span>
                        Update Pricing
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===== INVENTORY MANAGEMENT TAB ===== */}
        {activeTab === 'inventory' && (
          <InventoryManagement
            inventoryItems={inventoryItems}
            inventoryDashboard={inventoryDashboard}
            inventoryFilter={inventoryFilter}
            setInventoryFilter={setInventoryFilter}
            setShowInventoryModal={setShowInventoryModal}
            setSelectedInventoryItem={setSelectedInventoryItem}
            resetInventoryForm={resetInventoryForm}
            setInventoryForm={setInventoryForm}
            setShowStockInModal={setShowStockInModal}
            setShowStockOutModal={setShowStockOutModal}
            properties={properties}
          />
        )}

        {activeTab === 'accounting' && (
          <Accounting />
        )}

        {activeTab === 'invoices' && (
          <InvoiceManagement />
        )}

        {activeTab === 'guests' && (
          <GuestManagement />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsReports />
        )}

        {activeTab === 'notifications' && (
          <NotificationsEmail />
        )}

        {activeTab === 'upload' && (
          <UploadManagement />
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-section modern-calendar">
            <div className="section-header-modern">
              <div className="header-content">
                <h2>📅 Calendar & Availability</h2>
                <p className="header-subtitle">Manage bookings and property availability</p>
              </div>
              <div className="header-actions-group">
                <button
                  onClick={() => setShowExternalCalendarModal(true)}
                  className="btn-secondary btn-professional-secondary"
                >
                  <span>�</span>
                  <span>External Sync</span>
                </button>
                <button
                  onClick={() => setShowCalendarModal(true)}
                  className="btn-primary btn-professional-primary btn-ripple hover-scale"
                >
                  <span>�️</span>
                  <span>Manage Calendar</span>
                </button>
              </div>
            </div>

            {/* Calendar View Controls */}
            <div className="calendar-controls-modern">
              <div className="controls-group">
                <div className="control-item">
                  <label className="control-label">Property</label>
                  <select
                    value={calendarView.unitId}
                    onChange={(e) => setCalendarView(prev => ({ ...prev, unitId: e.target.value }))}
                    className="form-select-modern"
                  >
                    <option value="">All Properties</option>
                    <option value="ground-floor">Halcyon Rest - Ground Floor</option>
                    <option value="first-floor">Halcyon Rest - First Floor</option>
                  </select>
                </div>
                
                <div className="control-item">
                  <label className="control-label">Date Range</label>
                  <div className="date-range-picker">
                    <input
                      type="date"
                      value={calendarView.startDate}
                      onChange={(e) => setCalendarView(prev => ({ ...prev, startDate: e.target.value }))}
                      className="date-input-modern"
                    />
                    <span className="date-separator">→</span>
                    <input
                      type="date"
                      value={calendarView.endDate}
                      onChange={(e) => setCalendarView(prev => ({ ...prev, endDate: e.target.value }))}
                      className="date-input-modern"
                    />
                  </div>
                </div>
              </div>
              
              <button
                onClick={loadCalendarData}
                className="btn-load-calendar"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner">⏳</span>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Load Calendar</span>
                  </>
                )}
              </button>
            </div>

            {/* Calendar Display */}
            {calendarData && calendarData.calendar ? (
              <div className="calendar-display-modern">
                {calendarData.calendar.map(unitCalendar => (
                  <div key={unitCalendar.unitId} className="unit-calendar-modern">
                    <div className="calendar-unit-header">
                      <h3 className="unit-title">{unitCalendar.unitName}</h3>
                      <div className="calendar-legend">
                        <span className="legend-item">
                          <span className="legend-dot available"></span>
                          Available
                        </span>
                        <span className="legend-item">
                          <span className="legend-dot booked"></span>
                          Booked
                        </span>
                        <span className="legend-item">
                          <span className="legend-dot blocked"></span>
                          Blocked
                        </span>
                      </div>
                    </div>
                    
                    <div className="calendar-grid-modern">
                      {unitCalendar.dates.map(day => {
                        const isBooked = !day.available && day.guestName;
                        const isBlocked = !day.available && !day.guestName;
                        const isAvailable = day.available;
                        
                        return (
                          <div
                            key={day.date}
                            className={`calendar-day-modern ${isAvailable ? 'available' : ''} ${isBooked ? 'booked' : ''} ${isBlocked ? 'blocked' : ''} ${day.hasOverride ? 'has-override' : ''}`}
                            title={`${day.date} - ${day.available ? 'Available' : 'Unavailable'} - ${day.source || 'Normal'}`}
                            onClick={() => {
                              setDateBlockForm(prev => ({ 
                                ...prev, 
                                startDate: day.date, 
                                endDate: day.date 
                              }));
                              setShowCalendarModal(true);
                            }}
                          >
                            <div className="day-header">
                              <span className="day-number">{new Date(day.date).getDate()}</span>
                              {day.hasOverride && <span className="override-badge">🏷️</span>}
                            </div>
                            
                            <div className="day-content">
                              {day.pricing && (
                                <div className="day-price">${day.pricing.USD}</div>
                              )}
                              
                              {day.guestName && (
                                <div className="day-guest">
                                  <span className="guest-icon">👤</span>
                                  <span className="guest-name">{day.guestName.substring(0, 12)}</span>
                                </div>
                              )}
                              
                              {!day.guestName && (
                                <div className="day-status">
                                  {isAvailable ? '✓' : '✕'}
                                </div>
                              )}
                            </div>
                            
                            <div className="day-date">
                              {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="calendar-placeholder-modern">
                <div className="placeholder-icon">📅</div>
                <h3>Select dates to view calendar</h3>
                <p>Choose a date range and property to see availability and pricing</p>
                <button
                  onClick={loadCalendarData}
                  className="btn-load-placeholder"
                >
                  Load Calendar
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="financial-section">
            <div className="section-header" style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.8) 0%, rgba(30, 30, 50, 0.8) 100%)',
              padding: '2rem',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              marginBottom: '2rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    💰 Financial Reports Dashboard
                  </h2>
                  {isUpdating && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                <div className="loading-spinner" style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: 'white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Updating...
              </div>
            )}
            {!isUpdating && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '500'
              }}>
                ✅ Live Data
              </div>
            )}

          {/* Real-time Status Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: autoRefreshEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            border: `1px solid ${autoRefreshEnabled ? '#10b981' : '#6b7280'}`
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: autoRefreshEnabled ? '#10b981' : '#6b7280',
              animation: autoRefreshEnabled ? 'pulse 2s infinite' : 'none'
            }}></div>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '500',
              color: autoRefreshEnabled ? '#065f46' : '#374151'
            }}>
              {autoRefreshEnabled ? 'Auto-sync ON' : 'Auto-sync OFF'}
            </span>
          </div>
          
          {/* Last Update Time */}
          <div style={{
            fontSize: '0.75rem',
            color: '#6b7280',
            background: 'rgba(20, 20, 35, 0.8)',
            padding: '0.5rem',
            borderRadius: '6px',
            border: '1px solid #e5e7eb'
          }}>
            Last updated: {new Date(lastDataUpdate).toLocaleTimeString()}
          </div>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Auto-refresh Toggle */}
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            className={`btn-secondary ${autoRefreshEnabled ? 'active' : ''}`}
            style={{
              background: autoRefreshEnabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(20, 20, 35, 0.6)',
              color: autoRefreshEnabled ? 'white' : '#374151',
              border: `1px solid ${autoRefreshEnabled ? '#059669' : '#d1d5db'}`,
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            {autoRefreshEnabled ? '⏸️ Pause Auto-sync' : '▶️ Enable Auto-sync'}
          </button>
          
          <button
  onClick={diagnoseRevenueIssue}
  className="btn-secondary btn-professional-secondary"
  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
>
  🔍 Diagnose Revenue Issue
</button>
          {/* Period Selector */}
          <div className="period-selector">
            <select
              value={selectedReportPeriod}
              onChange={(e) => handleDashboardPeriodChange(e.target.value)}
              className="form-input"
              style={{ marginRight: '1rem', fontSize: '0.875rem' }}
            >
              <option value="3months">Last 3 Months</option>
              <option value="6months">Last 6 Months</option>
              <option value="12months">Last 12 Months</option>
              <option value="24months">Last 24 Months</option>
            </select>
          </div>

          {/* Manual Refresh Button */}
          <button
  onClick={async () => {
    console.log('🔄 FORCE SYNCING Financial tab with Dashboard data...');
    setIsUpdating(true);
    
    try {
      // Step 1: Force reload ALL revenue and expense data
      console.log('1️⃣ Force reloading revenue data...');
      await loadRevenue();
      
      console.log('2️⃣ Force reloading expense data...');
      await loadExpenses();
      
      // Step 3: Recreate charts from current data
      console.log('3️⃣ Recreating charts from current data...');
      const freshChartData = await createChartDataFromCurrentState();
      setComprehensiveDashboard(freshChartData);
      
      // Step 4: Refresh real-time metrics
      console.log('4️⃣ Refreshing real-time metrics...');
      await loadRealtimeMetrics();
      
      // Step 5: Force state update
      setLastDataUpdate(Date.now());
      
      console.log('✅ Force sync completed successfully!');
      setSuccess('Financial charts synced with dashboard data!');
      
    } catch (error) {
      console.error('💥 Force sync failed:', error);
      setError('Failed to sync financial data');
    } finally {
      setIsUpdating(false);
    }
  }}
  className="btn-primary btn-professional-primary"
  disabled={isUpdating}
  style={{
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    marginRight: '1rem'
  }}
>
  {isUpdating ? '🔄 Syncing...' : '🎯 Force Sync Charts'}
</button>

          <button
            onClick={() => refreshAllFinancialData('Manual refresh')}
            className="btn-secondary btn-professional-secondary"
            disabled={isUpdating}
            style={{
              marginRight: '1rem',
              background: isUpdating ? 'rgba(168, 85, 247, 0.3)' : 'rgba(20, 20, 35, 0.6)',
              opacity: isUpdating ? 0.6 : 1
            }}
          >
            {isUpdating ? (
              <>
                <div className="loading-spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #d1d5db',
                  borderTopColor: '#6b7280',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '0.5rem'
                }}></div>
                Refreshing...
              </>
            ) : (
              <>🔄 Refresh Data</>
            )}
          </button>

          {/* Export Button */}
          <button
            onClick={() => setShowExportModal(true)}
            className="btn-primary btn-professional-primary"
          >
            <span>📄</span>
            <span>Export Reports</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'rgba(20, 20, 35, 0.8)',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div className="quick-stat">
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Today's Revenue</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#059669' }}>
            {realtimeMetrics ? formatCurrency(realtimeMetrics.today.revenue) : formatCurrency(0)}
          </div>
        </div>
        <div className="quick-stat">
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Today's Expenses</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#dc2626' }}>
            {realtimeMetrics ? formatCurrency(realtimeMetrics.today.expenses) : formatCurrency(0)}
          </div>
        </div>
        <div className="quick-stat">
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Net Profit Today</div>
          <div style={{ 
            fontSize: '1.125rem', 
            fontWeight: '700', 
            color: realtimeMetrics && realtimeMetrics.today.netCashFlow >= 0 ? '#059669' : '#dc2626'
          }}>
            {realtimeMetrics ? formatCurrency(realtimeMetrics.today.netCashFlow) : formatCurrency(0)}
          </div>
        </div>
        <div className="quick-stat">
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Pending Approvals</div>
          <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#f59e0b' }}>
            {expenses.filter(e => e.status === 'pending').length}
          </div>
                </div>
              </div>
            </div>

            {/* Comprehensive Dashboard Charts */}
            {comprehensiveDashboard ? (
  <div className="dashboard-charts-section">
    <div className="section-header">
      <h3>📈 Financial Trends & Analysis</h3>
      <div className="chart-controls">
        <div className="chart-toggles">
          {Object.entries(dashboardCharts).map(([chartName, isVisible]) => (
            <button
              key={chartName}
              onClick={() => toggleChart(chartName)}
              className={`chart-toggle ${isVisible ? 'active' : ''}`}
              style={{
                padding: '0.5rem 1rem',
                margin: '0 0.25rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                background: isVisible ? '#3b82f6' : 'rgba(20, 20, 35, 0.6)',
                color: isVisible ? 'white' : '#374151',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {chartName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
    </div>

    <div className="charts-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
      gap: '2rem',
      marginBottom: '2rem'
    }}>
      {/* Monthly Trends Chart */}
      {dashboardCharts.monthlyTrends && comprehensiveDashboard.timeSeriesData && (
        <div className="chart-container" style={{
          background: 'rgba(20, 20, 35, 0.8)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Revenue & Expense Trends
          </h4>
          <div style={{ height: '300px' }}>
            {renderChart(
              Line,
              formatChartData(comprehensiveDashboard.timeSeriesData, 'line'),
              getChartOptions('line'),
              'No trend data available'
            )}
          </div>
        </div>
      )}

      {/* Revenue Breakdown Pie Chart */}
      {dashboardCharts.revenueBreakdown && comprehensiveDashboard.revenueBreakdown && (
        <div className="chart-container" style={{
          background: 'rgba(20, 20, 35, 0.8)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🥧 Revenue Breakdown
          </h4>
          <div style={{ height: '300px' }}>
            {renderChart(
              Pie,
              formatChartData(comprehensiveDashboard.revenueBreakdown.bySource, 'pie'),
              getChartOptions('pie'),
              'No revenue breakdown data'
            )}
          </div>
        </div>
      )}

      {/* Expense Categories Chart */}
      {dashboardCharts.expenseCategories && comprehensiveDashboard.expenseBreakdown && (
        <div className="chart-container" style={{
          background: 'rgba(20, 20, 35, 0.8)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            💸 Expense Categories
          </h4>
          <div style={{ height: '300px' }}>
            {renderChart(
              Doughnut,
              formatChartData(comprehensiveDashboard.expenseBreakdown.byCategory, 'doughnut'),
              getChartOptions('doughnut'),
              'No expense category data'
            )}
          </div>
        </div>
      )}

      {/* Unit Performance Chart */}
      {dashboardCharts.unitPerformance && comprehensiveDashboard.unitPerformance && (
        <div className="chart-container" style={{
          background: 'rgba(20, 20, 35, 0.8)',
          padding: '1.5rem',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏠 Unit Performance
          </h4>
          <div style={{ height: '300px' }}>
            {(() => {
              const unitData = {
                labels: comprehensiveDashboard.unitPerformance.map(unit => unit.unitName),
                datasets: [
                  {
                    label: 'Revenue',
                    data: comprehensiveDashboard.unitPerformance.map(unit => unit.totalRevenue),
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 2
                  },
                  {
                    label: 'Bookings (×10K)',
                    data: comprehensiveDashboard.unitPerformance.map(unit => unit.totalBookings * 10000),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 2,
                    yAxisID: 'y1'
                  }
                ]
              };

              const unitOptions = {
                ...getChartOptions('bar'),
                scales: {
                  ...getChartOptions('bar').scales,
                  y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    beginAtZero: true,
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: {
                      color: '#6b7280',
                      font: { size: 11 },
                      callback: function(value) {
                        return (value / 10000) + ' bookings';
                      }
                    }
                  }
                },
                plugins: {
                  ...getChartOptions('bar').plugins,
                  tooltip: {
                    ...getChartOptions('bar').plugins.tooltip,
                    callbacks: {
                      label: function(context) {
                        if (context.dataset.label.includes('Bookings')) {
                          return `Bookings: ${context.parsed.y / 10000}`;
                        }
                        return `Revenue: ${formatCurrency(context.parsed.y)}`;
                      }
                    }
                  }
                }
              };

              return renderChart(Bar, unitData, unitOptions, 'No unit performance data');
            })()}
          </div>
        </div>
      )}
    </div>
  </div>
) : (
  <div className="dashboard-charts-placeholder" style={{
    background: 'rgba(20, 20, 35, 0.8)',
    padding: '3rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
    margin: '2rem 0'
  }}>
    <div style={{ marginBottom: '1.5rem', fontSize: '3rem' }}>📊</div>
    <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Financial Charts & Analytics</h3>
    <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1.1rem' }}>
      Load comprehensive dashboard to view detailed financial trends, revenue breakdowns, expense categories, and unit performance analytics.
    </p>
    <button
      onClick={async () => {
        console.log('🔄 Loading financial charts button clicked');
        try {
          setLoadingDashboard(true);
          await loadComprehensiveDashboard(selectedReportPeriod);
          setSuccess('Financial charts loaded successfully!');
        } catch (error) {
          console.error('Error loading charts:', error);
          setError('Failed to load financial charts');
        } finally {
          setLoadingDashboard(false);
        }
      }}
      disabled={loadingDashboard}
      className="btn-primary btn-professional-primary"
      style={{ 
        padding: '0.75rem 2rem',
        fontSize: '1rem',
        fontWeight: '600'
      }}
    >
      {loadingDashboard ? '🔄 Loading Charts...' : '📈 Load Financial Charts'}
    </button>
  </div>
)}

            {/* Interactive P&L Report */}
            {interactiveProfitLoss && (
              <div className="interactive-pl-section">
                <div className="section-header">
                  <h3>📊 Interactive Profit & Loss Statement</h3>
                  <div className="pl-controls">
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="form-input"
                      style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ margin: '0 0.5rem' }}>to</span>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="form-input"
                      style={{ marginRight: '1rem' }}
                    />
                    <button
                      onClick={() => handleCustomDateRange(customDateRange.startDate, customDateRange.endDate)}
                      className="btn-primary btn-professional-primary btn-ripple hover-scale"
                      disabled={!customDateRange.startDate || !customDateRange.endDate}
                    >
                      Update P&L
                    </button>
                  </div>
                </div>

                <div className="pl-statement" style={{
                  background: 'rgba(20, 20, 35, 0.8)',
                  padding: '2rem',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                  marginBottom: '2rem'
                }}>
                  <div className="pl-header" style={{ 
                    textAlign: 'center', 
                    marginBottom: '2rem',
                    borderBottom: '2px solid #e5e7eb',
                    paddingBottom: '1rem'
                  }}>
                    <h3 style={{ margin: '0', color: '#1f2937' }}>Profit & Loss Statement</h3>
                    <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280' }}>
                      {interactiveProfitLoss.period.startDate} to {interactiveProfitLoss.period.endDate}
                      ({interactiveProfitLoss.period.days} days)
                    </p>
                  </div>

                  {/* Revenue Section */}
                  <div className="pl-section revenue-section" style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      color: '#059669', 
                      borderBottom: '1px solid #d1fae5', 
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      💰 REVENUE
                    </h4>
                    <div className="pl-items">
                      {Object.entries(interactiveProfitLoss.revenue.details).map(([type, details]) => (
                        <div key={type} className="pl-item" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: 'rgba(20, 20, 35, 0.6)',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => console.log(`Drill down into ${type} revenue`, details)}
                        >
                          <div>
                            <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{type} Revenue</span>
                            <span style={{ 
                              marginLeft: '1rem', 
                              fontSize: '0.875rem', 
                              color: '#6b7280' 
                            }}>
                              ({details.transactions} transactions, avg: {formatCurrency(details.average)})
                            </span>
                          </div>
                          <span style={{ fontWeight: '700', color: '#059669' }}>
                            {formatCurrency(details.total)}
                          </span>
                        </div>
                      ))}
                      <div className="pl-total" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                        borderRadius: '8px',
                        border: '2px solid #a7f3d0',
                        fontWeight: '700',
                        fontSize: '1.125rem'
                      }}>
                        <span>TOTAL REVENUE</span>
                        <span style={{ color: '#059669' }}>
                          {formatCurrency(interactiveProfitLoss.revenue.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div className="pl-section expenses-section" style={{ marginBottom: '2rem' }}>
                    <h4 style={{ 
                      color: '#dc2626', 
                      borderBottom: '1px solid #fecaca', 
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      💸 EXPENSES
                    </h4>
                    <div className="pl-items">
                      {Object.entries(interactiveProfitLoss.expenses.details).map(([category, details]) => (
                        <div key={category} className="pl-item" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '0.75rem',
                          marginBottom: '0.5rem',
                          background: 'rgba(20, 20, 35, 0.7)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: '1px solid #f3f4f6'
                        }}
                        onClick={() => console.log(`Drill down into ${category} expenses`, details)}
                        >
                          <div>
                            <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>{category} Expenses</span>
                            <span style={{ 
                              marginLeft: '1rem', 
                              fontSize: '0.875rem', 
                              color: '#6b7280' 
                            }}>
                              ({details.transactions} items, avg: {formatCurrency(details.average)})
                            </span>
                            {Object.keys(details.subcategories).length > 0 && (
                              <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.25rem' }}>
                                Subcategories: {Object.keys(details.subcategories).join(', ')}
                              </div>
                            )}
                          </div>
                          <span style={{ fontWeight: '700', color: '#dc2626' }}>
                            {formatCurrency(details.total)}
                          </span>
                        </div>
                      ))}
                      <div className="pl-total" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.3) 100%)',
                        borderRadius: '8px',
                        border: '2px solid #fca5a5',
                        fontWeight: '700',
                        fontSize: '1.125rem'
                      }}>
                        <span>TOTAL EXPENSES</span>
                        <span style={{ color: '#dc2626' }}>
                          {formatCurrency(interactiveProfitLoss.expenses.total)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profit Section */}
                  <div className="pl-section profit-section">
                    <h4 style={{ 
                      color: interactiveProfitLoss.profitLoss.grossProfit >= 0 ? '#059669' : '#dc2626', 
                      borderBottom: `1px solid ${interactiveProfitLoss.profitLoss.grossProfit >= 0 ? '#d1fae5' : '#fecaca'}`, 
                      paddingBottom: '0.5rem',
                      marginBottom: '1rem'
                    }}>
                      📈 PROFIT & LOSS
                    </h4>
                    <div className="profit-metrics" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1rem'
                    }}>
                      <div className="profit-metric" style={{
                        padding: '1rem',
                        background: interactiveProfitLoss.profitLoss.grossProfit >= 0 
                          ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' 
                          : 'linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: `2px solid ${interactiveProfitLoss.profitLoss.grossProfit >= 0 ? '#a7f3d0' : '#fca5a5'}`
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Gross Profit</div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: interactiveProfitLoss.profitLoss.grossProfit >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {formatCurrency(interactiveProfitLoss.profitLoss.grossProfit)}
                        </div>
                      </div>
                      <div className="profit-metric" style={{
                        padding: '1rem',
                        background: 'rgba(20, 20, 35, 0.6)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Gross Margin</div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: interactiveProfitLoss.profitLoss.grossMargin >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {interactiveProfitLoss.profitLoss.grossMargin.toFixed(1)}%
                        </div>
                      </div>
                      <div className="profit-metric" style={{
                        padding: '1rem',
                        background: 'rgba(20, 20, 35, 0.6)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Expense Ratio</div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: interactiveProfitLoss.ratios.expenseRatio > 70 ? '#dc2626' : '#059669'
                        }}>
                          {interactiveProfitLoss.ratios.expenseRatio.toFixed(1)}%
                        </div>
                      </div>
                      <div className="profit-metric" style={{
                        padding: '1rem',
                        background: 'rgba(20, 20, 35, 0.6)',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Daily Profit</div>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: interactiveProfitLoss.ratios.profitPerDay >= 0 ? '#059669' : '#dc2626'
                        }}>
                          {formatCurrency(interactiveProfitLoss.ratios.profitPerDay)}
                        </div>
                      </div>
                    </div>

                    {/* Comparison with Previous Period */}
                    {interactiveProfitLoss.comparison && (
                      <div className="period-comparison" style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(25, 25, 40, 0.6)',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1'
                      }}>
                        <h5 style={{ margin: '0 0 1rem 0', color: '#475569' }}>📊 Period Comparison</h5>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                          gap: '1rem',
                          fontSize: '0.875rem'
                        }}>
                          <div>
                            <div style={{ color: '#6b7280' }}>Revenue Growth</div>
                            <div style={{ 
                              fontWeight: '600',
                              color: interactiveProfitLoss.comparison.growth.revenue >= 0 ? '#059669' : '#dc2626'
                            }}>
                              {interactiveProfitLoss.comparison.growth.revenue >= 0 ? '+' : ''}{interactiveProfitLoss.comparison.growth.revenue.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#6b7280' }}>Expense Growth</div>
                            <div style={{ 
                              fontWeight: '600',
                              color: interactiveProfitLoss.comparison.growth.expenses <= 0 ? '#059669' : '#dc2626'
                            }}>
                              {interactiveProfitLoss.comparison.growth.expenses >= 0 ? '+' : ''}{interactiveProfitLoss.comparison.growth.expenses.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div style={{ color: '#6b7280' }}>Profit Growth</div>
                            <div style={{ 
                              fontWeight: '600',
                              color: interactiveProfitLoss.comparison.growth.profit >= 0 ? '#059669' : '#dc2626'
                            }}>
                              {interactiveProfitLoss.comparison.growth.profit >= 0 ? '+' : ''}{interactiveProfitLoss.comparison.growth.profit.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Advanced Analytics with Forecasting */}
            {advancedAnalytics && (
              <div className="advanced-analytics-section">
                <div className="section-header">
                  <h3>🔮 Advanced Analytics & Forecasting</h3>
                  <button
                    onClick={() => loadAdvancedAnalytics(selectedReportPeriod, true)}
                    className="btn-secondary btn-professional-secondary"
                  >
                    🔄 Refresh Analytics
                  </button>
                </div>

                <div className="analytics-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {/* Key Insights */}
                  <div className="analytics-card insights" style={{
                    background: 'rgba(20, 20, 35, 0.8)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4>💡 Key Insights</h4>
                    <div className="insights-list">
                      <div className="insight-item">
                        <span className="insight-label">Strongest Revenue Month:</span>
                        <span className="insight-value">
                          {advancedAnalytics.insights.strongestMonth.month || 'N/A'}
                          {advancedAnalytics.insights.strongestMonth.averageRevenue && 
                            ` (${formatCurrency(advancedAnalytics.insights.strongestMonth.averageRevenue)})`
                          }
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Revenue Trend:</span>
                        <span className={`insight-value ${
                          advancedAnalytics.insights.revenueGrowthRate === 'Positive' ? 'positive' : 
                          advancedAnalytics.insights.revenueGrowthRate === 'Negative' ? 'negative' : 'neutral'
                        }`}>
                          {advancedAnalytics.insights.revenueGrowthRate}
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Expense Control:</span>
                        <span className={`insight-value ${
                          advancedAnalytics.insights.expenseControl === 'Good' ? 'positive' : 'negative'
                        }`}>
                          {advancedAnalytics.insights.expenseControl}
                        </span>
                      </div>
                      <div className="insight-item">
                        <span className="insight-label">Volatility Risk:</span>
                        <span className={`insight-value ${
                          advancedAnalytics.insights.volatilityRisk === 'Low' ? 'positive' : 'negative'
                        }`}>
                          {advancedAnalytics.insights.volatilityRisk}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Performance Summary */}
                  <div className="analytics-card summary" style={{
                    background: 'rgba(20, 20, 35, 0.8)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}>
                    <h4>📊 Performance Summary</h4>
                    <div className="summary-metrics">
                      <div className="summary-metric">
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-value revenue">
                          {formatCurrency(advancedAnalytics.summary.totalRevenue)}
                        </div>
                      </div>
                      <div className="summary-metric">
                        <div className="metric-label">Total Profit</div>
                        <div className="metric-value profit">
                          {formatCurrency(advancedAnalytics.summary.totalProfit)}
                        </div>
                      </div>
                      <div className="summary-metric">
                        <div className="metric-label">Avg Monthly Revenue</div>
                        <div className="metric-value">
                          {formatCurrency(advancedAnalytics.summary.averageMonthlyRevenue)}
                        </div>
                      </div>
                      <div className="summary-metric">
                        <div className="metric-label">Total Bookings</div>
                        <div className="metric-value">
                          {advancedAnalytics.summary.totalBookings}
                        </div>
                      </div>
                    </div>
                  </div>
                  
{/* Historical Trends Chart */}
{advancedAnalytics && advancedAnalytics.historicalData && (
  <div className="chart-container" style={{
    background: 'rgba(20, 20, 35, 0.8)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    marginTop: '2rem',
    gridColumn: 'span 3'
  }}>
    <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      📈 Historical Financial Trends with Forecast
    </h4>
    <div style={{ height: '400px' }}>
      <Line
        data={{
          labels: [
            ...advancedAnalytics.historicalData.map(d => d.month),
            ...(advancedAnalytics.forecast ? advancedAnalytics.forecast.map(f => f.month + ' (Forecast)') : [])
          ],
          datasets: [
            {
              label: 'Revenue',
              data: [
                ...advancedAnalytics.historicalData.map(d => d.revenue),
                ...(advancedAnalytics.forecast ? advancedAnalytics.forecast.map(f => f.forecastRevenue) : [])
              ],
              borderColor: 'rgb(16, 185, 129)',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              tension: 0.4,
              fill: true,
              borderDash: advancedAnalytics.forecast ? 
                [...Array(advancedAnalytics.historicalData.length).fill(0), ...Array(advancedAnalytics.forecast.length).fill([5, 5])] : []
            },
            {
              label: 'Expenses',
              data: advancedAnalytics.historicalData.map(d => d.expenses),
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Profit',
              data: [
                ...advancedAnalytics.historicalData.map(d => d.profit),
                ...(advancedAnalytics.forecast ? advancedAnalytics.forecast.map(f => f.forecastProfit) : [])
              ],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4,
              fill: true,
              borderDash: advancedAnalytics.forecast ? 
                [...Array(advancedAnalytics.historicalData.length).fill(0), ...Array(advancedAnalytics.forecast.length).fill([5, 5])] : []
            }
          ]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label;
                  const value = formatCurrency(context.parsed.y);
                  if (context.label.includes('Forecast')) {
                    return label + ' (Forecast): ' + value;
                  }
                  return label + ': ' + value;
                }
              }
            },
            annotation: advancedAnalytics.forecast ? {
              annotations: {
                line1: {
                  type: 'line',
                  xMin: advancedAnalytics.historicalData.length - 0.5,
                  xMax: advancedAnalytics.historicalData.length - 0.5,
                  borderColor: 'rgb(156, 163, 175)',
                  borderWidth: 2,
                  borderDash: [5, 5],
                  label: {
                    enabled: true,
                    content: 'Forecast',
                    position: 'top'
                  }
                }
              }
            } : {}
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }}
      />
    </div>
  </div>
)}

{/* Payment Methods Distribution */}
{dashboardCharts.paymentMethods && comprehensiveDashboard.revenueBreakdown && (
  <div className="chart-container" style={{
    background: 'rgba(20, 20, 35, 0.8)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  }}>
    <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      💳 Payment Methods Distribution
    </h4>
    <div style={{ height: '300px' }}>
      <Pie
        data={{
          labels: Object.keys(comprehensiveDashboard.revenueBreakdown.byPaymentMethod).map(method => 
            method.replace('_', ' ').toUpperCase()
          ),
          datasets: [{
            data: Object.values(comprehensiveDashboard.revenueBreakdown.byPaymentMethod),
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgb(16, 185, 129)',
              'rgb(59, 130, 246)',
              'rgb(245, 158, 11)',
              'rgb(139, 92, 246)'
            ],
            borderWidth: 2
          }]
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                  return context.label + ': ' + formatCurrency(context.parsed) + ' (' + percentage + '%)';
                }
              }
            }
          }
        }}
      />
    </div>
  </div>
)}
                  {/* Forecasting */}
                  {advancedAnalytics.forecast && (
                    <div className="analytics-card forecast" style={{
                      background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      border: '1px solid #c4b5fd',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                    }}>
                      <h4 style={{ color: '#5b21b6' }}>🔮 Revenue Forecast</h4>
                      <div className="forecast-list">
                        {advancedAnalytics.forecast.map((forecast, index) => (
                          <div key={index} className="forecast-item" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.7)',
                            borderRadius: '8px'
                          }}>
                            <div>
                              <div style={{ fontWeight: '600' }}>{forecast.month}</div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Confidence: {(forecast.confidence * 100).toFixed(0)}%
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: '700', color: '#5b21b6' }}>
                                {formatCurrency(forecast.forecastRevenue)}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                Profit: {formatCurrency(forecast.forecastProfit)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="financial-actions-section">
              <div className="section-header">
                <h3>🚀 Quick Actions</h3>
              </div>
              <div className="actions-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="action-button expense"
                  style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600'
                  }}
                >
                  <span>💸</span>
                  Add Expense
                </button>
                <button
                  onClick={() => setShowRevenueModal(true)}
                  className="action-button revenue"
                  style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600'
                  }}
                >
                  <span>💰</span>
                  Record Revenue
                </button>
                <button
                  onClick={() => setShowExpenseListModal(true)}
                  className="action-button manage"
                  style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600'
                  }}
                >
                  <span>📋</span>
                  Manage Expenses
                </button>
                <button
                  onClick={() => setShowRevenueListModal(true)}
                  className="action-button manage-revenue"
                  style={{
                    padding: '1rem',
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontWeight: '600'
                  }}
                >
                  <span>📊</span>
                  Manage Revenue
                </button>
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="recent-expenses-section">
              <h3>📋 Recent Expenses</h3>
              {expenses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💸</div>
                  <h4>No expenses recorded yet</h4>
                  <p>Start by adding your first expense</p>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="btn-primary btn-professional-primary btn-ripple hover-scale"
                  >
                    Add First Expense
                  </button>
                </div>
              ) : (
                <div className="recent-expenses-list">
                  {expenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="expense-item-preview">
                      <div className="expense-preview-info">
                        <div className="expense-preview-description">{expense.description}</div>
                        <div className="expense-preview-meta">
                          {expense.vendor} • {expense.category} • {new Date(expense.expenseDate).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="expense-preview-amount">
                        <div className="amount">{formatCurrency(expense.amount)}</div>
                        <div className={`status ${expense.status}`}>{expense.status}</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowExpenseDetailModal(true);
                        }}
                        className="btn-secondary btn-sm"
                      >
                        View
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setShowExpenseListModal(true)}
                    className="view-all-expenses-btn"
                  >
                    View All {expenses.length} Expenses →
                  </button>
                </div>
              )}
            </div>

            {/* Invoice Management Section */}
            <div className="invoice-management-section" style={{
              marginTop: '2rem',
              background: 'rgba(20, 20, 35, 0.8)',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📄 Invoice & Document Management
                </h3>
                <button
                  onClick={() => setShowUploadInvoiceModal(true)}
                  className="btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <span>📤</span>
                  Upload Invoice/Bill
                </button>
              </div>

              {/* Invoice Filters */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(25, 25, 40, 0.6)',
                borderRadius: '8px',
                border: '1px solid #cbd5e1'
              }}>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Type</label>
                  <select
                    value={invoiceFilter.type}
                    onChange={(e) => setInvoiceFilter(prev => ({ ...prev, type: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">All Types</option>
                    <option value="guest_invoice">Guest Invoice</option>
                    <option value="supplier_bill">Supplier Bill</option>
                    <option value="expense_receipt">Expense Receipt</option>
                    <option value="utility_bill">Utility Bill</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Payment Status</label>
                  <select
                    value={invoiceFilter.paymentStatus}
                    onChange={(e) => setInvoiceFilter(prev => ({ ...prev, paymentStatus: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>Search</label>
                  <input
                    type="text"
                    placeholder="Invoice #, Customer..."
                    value={invoiceFilter.search}
                    onChange={(e) => setInvoiceFilter(prev => ({ ...prev, search: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>From Date</label>
                  <input
                    type="date"
                    value={invoiceFilter.startDate}
                    onChange={(e) => setInvoiceFilter(prev => ({ ...prev, startDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.875rem', color: '#6b7280', display: 'block', marginBottom: '0.5rem' }}>To Date</label>
                  <input
                    type="date"
                    value={invoiceFilter.endDate}
                    onChange={(e) => setInvoiceFilter(prev => ({ ...prev, endDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Invoice List */}
              {invoices.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="empty-icon" style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
                  <h4>No invoices yet</h4>
                  <p style={{ color: '#6b7280' }}>Upload invoices or generate them from reservations</p>
                </div>
              ) : (
                <div className="invoice-table-container">
                  <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(25, 25, 40, 0.8)', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Invoice #</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Type</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '1rem', textAlign: 'left' }}>Issued To</th>
                        <th style={{ padding: '1rem', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                        <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices
                        .filter(invoice => {
                          // Apply filters
                          if (invoiceFilter.type && invoice.type !== invoiceFilter.type) return false;
                          if (invoiceFilter.paymentStatus && invoice.paymentStatus !== invoiceFilter.paymentStatus) return false;
                          if (invoiceFilter.search) {
                            const search = invoiceFilter.search.toLowerCase();
                            const matches = 
                              invoice.invoiceNumber?.toLowerCase().includes(search) ||
                              invoice.issuedTo?.toLowerCase().includes(search) ||
                              invoice.notes?.toLowerCase().includes(search);
                            if (!matches) return false;
                          }
                          if (invoiceFilter.startDate && invoice.issueDate < invoiceFilter.startDate) return false;
                          if (invoiceFilter.endDate && invoice.issueDate > invoiceFilter.endDate) return false;
                          return true;
                        })
                        .map(invoice => (
                          <tr key={invoice.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '1rem', fontWeight: '600' }}>{invoice.invoiceNumber}</td>
                            <td style={{ padding: '1rem' }}>
                              <span style={{
                                background: invoice.type === 'guest_invoice' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: invoice.type === 'guest_invoice' ? '#059669' : '#dc2626',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                {invoice.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', color: '#6b7280' }}>
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '1rem' }}>{invoice.issuedTo || '-'}</td>
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                              {formatCurrency(invoice.totalAmount, invoice.currency)}
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <span style={{
                                background: 
                                  invoice.paymentStatus === 'paid' ? 'rgba(16, 185, 129, 0.1)' :
                                  invoice.paymentStatus === 'partial' ? 'rgba(245, 158, 11, 0.1)' :
                                  invoice.paymentStatus === 'overdue' ? 'rgba(239, 68, 68, 0.1)' :
                                  'rgba(107, 114, 128, 0.1)',
                                color:
                                  invoice.paymentStatus === 'paid' ? '#059669' :
                                  invoice.paymentStatus === 'partial' ? '#d97706' :
                                  invoice.paymentStatus === 'overdue' ? '#dc2626' :
                                  '#6b7280',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                fontWeight: '500'
                              }}>
                                {invoice.paymentStatus.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                <button
                                  onClick={() => downloadInvoice(invoice.id)}
                                  className="btn-secondary btn-sm"
                                  style={{
                                    padding: '0.5rem 1rem',
                                    fontSize: '0.875rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  📥 Download
                                </button>
                                {invoice.paymentStatus !== 'paid' && invoice.paymentStatus !== 'cancelled' && (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice);
                                      setShowInvoiceModal(true);
                                    }}
                                    className="btn-secondary btn-sm"
                                    style={{
                                      padding: '0.5rem 1rem',
                                      fontSize: '0.875rem',
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '6px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    💳 Record Payment
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content">
            <div className="tab-header">
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>User Management</h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                  Manage staff accounts and permissions
                </p>
              </div>
              <button
                onClick={() => {
                  resetUserForm();
                  setShowUserModal(true);
                }}
                className="btn-primary"
              >
                ➕ Add New User
              </button>
            </div>

            <div className="filters-section">
              <div className="filter-group">
                <select
                  value={userFilter.role}
                  onChange={(e) => setUserFilter(prev => ({ ...prev, role: e.target.value }))}
                  className="form-select"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="front_desk">Front Desk</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="finance">Finance</option>
                </select>

                <select
                  value={userFilter.status}
                  onChange={(e) => setUserFilter(prev => ({ ...prev, status: e.target.value }))}
                  className="form-select"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>

                <input
                  type="text"
                  placeholder="Search users..."
                  value={userFilter.search}
                  onChange={(e) => setUserFilter(prev => ({ ...prev, search: e.target.value }))}
                  className="form-input"
                  style={{ flex: 1 }}
                />

                <button
                  onClick={loadUsers}
                  className="btn-secondary"
                >
                  🔍 Search
                </button>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h4>No users found</h4>
                <p>Click "Add New User" to create your first staff account</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.25rem',
                              fontWeight: '600',
                              color: 'white'
                            }}>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>
                                {user.firstName} {user.lastName}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                                {user.phone || 'No phone'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontFamily: 'monospace',
                            background: 'rgba(59, 130, 246, 0.1)',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.875rem'
                          }}>
                            {user.username}
                          </span>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span style={{
                            background: 
                              user.role === 'super_admin' ? 'rgba(239, 68, 68, 0.1)' :
                              user.role === 'admin' ? 'rgba(245, 158, 11, 0.1)' :
                              user.role === 'manager' ? 'rgba(16, 185, 129, 0.1)' :
                              'rgba(59, 130, 246, 0.1)',
                            color:
                              user.role === 'super_admin' ? '#dc2626' :
                              user.role === 'admin' ? '#d97706' :
                              user.role === 'manager' ? '#059669' :
                              '#3b82f6',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span style={{
                            background: 
                              user.status === 'active' ? 'rgba(16, 185, 129, 0.1)' :
                              user.status === 'suspended' ? 'rgba(239, 68, 68, 0.1)' :
                              'rgba(107, 114, 128, 0.1)',
                            color:
                              user.status === 'active' ? '#059669' :
                              user.status === 'suspended' ? '#dc2626' :
                              '#6b7280',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textTransform: 'capitalize'
                          }}>
                            {user.status}
                          </span>
                        </td>
                        <td style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}>
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => openEditUserModal(user)}
                              className="btn-secondary btn-sm"
                              title="Edit User"
                            >
                              ✏️
                            </button>
                            {user.status === 'active' ? (
                              <button
                                onClick={() => toggleUserStatus(user.id, 'inactive')}
                                className="btn-secondary btn-sm"
                                style={{
                                  background: 'rgba(245, 158, 11, 0.1)',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  color: '#f59e0b'
                                }}
                                title="Deactivate"
                              >
                                ⏸️
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleUserStatus(user.id, 'active')}
                                className="btn-secondary btn-sm"
                                style={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#10b981'
                                }}
                                title="Activate"
                              >
                                ▶️
                              </button>
                            )}
                            {authenticatedUser?.role === 'super_admin' && user.id !== authenticatedUser.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="btn-secondary btn-sm"
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444'
                                }}
                                title="Delete User"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Availability Check Modal */}
      {showAvailabilityModal && (
        <div className="modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3>Check Availability</h3>
                          <button onClick={() => setShowAvailabilityModal(false)} className="modal-close">✕</button>
                        </div>
                        <div className="modal-content">
                          <div className="date-inputs">
                          <div className="input-group">
                            <label>Check-in Date</label>
                            <input
                            type="date"
                            value={availabilityDates.checkIn}
                            onChange={(e) => setAvailabilityDates(prev => ({ ...prev, checkIn: e.target.value }))}
                            className="form-input"
                            />
                          </div>
                          <div className="input-group">
                            <label>Check-out Date</label>
                            <input
                            type="date"
                            value={availabilityDates.checkOut}
                            onChange={(e) => setAvailabilityDates(prev => ({ ...prev, checkOut: e.target.value }))}
                            className="form-input"
                            />
                          </div>
                          </div>

                          <button
                          onClick={checkAvailability}
                          disabled={loading}
                          className="btn-primary full-width"
                          style={{ margin: '1rem 0' }}
                          >
                          {loading ? 'Checking...' : 'Check Availability'}
                          </button>

                          {availabilityData && (
                          <div className="availability-results">
                            <h4>Available Units for {availabilityData.checkIn} to {availabilityData.checkOut}</h4>
                            <div className="availability-grid">
                            {availabilityData.availability?.map((unit, index) => (
                              <div key={index} className="availability-unit">
                              <div className="unit-info">
                                <h5>{unit.property.name} - {unit.property.unit}</h5>
                                <p>Capacity: {unit.property.maxAdults} adults, {unit.property.maxChildren} children</p>
                                <p><strong>{unit.pricing.nights} nights</strong></p>
                                {unit.pricing.seasonalFactor && (
                                <p className="seasonal-info">
                                  Season: <span className={`season-${unit.pricing.seasonalFactor}`}>
                                  {unit.pricing.seasonalFactor}
                                  </span>
                                </p>
                                )}
                              </div>
                              <div className="unit-pricing">
                                <div className="price-main">{formatCurrency(unit.pricing.totalLKR, 'LKR')}</div>
                                <div className="price-secondary">{formatCurrency(unit.pricing.totalUSD, 'USD')}</div>
                                <div className="exchange-rate">Rate: {unit.pricing.exchangeRate}</div>
                              </div>
                              {unit.available ? (
                                <button
                                onClick={() => {
                                        setBookingForm(prev => ({
                                          ...prev,
                                          propertyId: unit.property.id,
                                          checkIn: availabilityData.checkIn,
                                          checkOut: availabilityData.checkOut
                                        }));
                                        setShowAvailabilityModal(false);
                                        setShowBookingModal(true);
                                      }}
                                      className="btn-success full-width"
                                    >
                                      Book Now
                                    </button>
                                  ) : (
                                    <div className="not-available">
                                      {unit.capacityIssue ? 'Exceeds Capacity' : 'Not Available'}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              {/* Financial Report Export Modal */}
      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal export-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Export Financial Reports</h3>
              <button onClick={() => setShowExportModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="export-form">
                <div className="input-group">
                  <label>Report Type *</label>
                  <select
                    value={exportOptions.reportType}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, reportType: e.target.value }))}
                    className="form-input"
                  >
                    <option value="comprehensive">Comprehensive Financial Report</option>
                    <option value="profit-loss">Profit & Loss Statement</option>
                    <option value="revenue">Revenue Report</option>
                    <option value="expenses">Expenses Report</option>
                    <option value="cash-flow">Cash Flow Analysis</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Export Format *</label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
                    className="form-input"
                  >
                    <option value="csv">CSV (Excel Compatible)</option>
                    <option value="json">JSON (Data Exchange)</option>
                    <option value="excel">Excel Format (Structured)</option>
                  </select>
                </div>

                <div className="date-inputs">
                  <div className="input-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={exportOptions.startDate}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, startDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={exportOptions.endDate}
                      onChange={(e) => setExportOptions(prev => ({ ...prev, endDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="include-charts"
                    checked={exportOptions.includeCharts}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                  />
                  <label htmlFor="include-charts">Include chart data (where applicable)</label>
                </div>

                <div className="export-preview" style={{
                  background: 'rgba(20, 20, 35, 0.6)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem'
                }}>
                  <h4>📋 Export Preview</h4>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    <div>Report: <strong>{exportOptions.reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</strong></div>
                    <div>Format: <strong>{exportOptions.format.toUpperCase()}</strong></div>
                    <div>Period: <strong>
                      {exportOptions.startDate && exportOptions.endDate 
                        ? `${exportOptions.startDate} to ${exportOptions.endDate}`
                        : 'Current period (default)'
                      }
                    </strong></div>
                    <div>Charts: <strong>{exportOptions.includeCharts ? 'Included' : 'Not included'}</strong></div>
                  </div>
                </div>

                <div className="export-options-info" style={{
                  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  border: '1px solid #93c5fd'
                }}>
                  <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>💡 Export Information</h5>
                  <ul style={{ margin: '0', paddingLeft: '1rem', fontSize: '0.875rem', color: '#1e40af' }}>
                    <li><strong>CSV:</strong> Best for Excel analysis and data processing</li>
                    <li><strong>JSON:</strong> Best for technical integration and data exchange</li>
                    <li><strong>Excel:</strong> Structured format with multiple sheets and formatting</li>
                    <li>Leave dates empty to export current period data</li>
                    <li>Large exports may take a few moments to process</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  exportFinancialReport(
                    exportOptions.reportType,
                    exportOptions.format,
                    exportOptions.startDate,
                    exportOptions.endDate
                  );
                  setShowExportModal(false);
                }}
                disabled={loading}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
                style={{
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    📥 Export Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Real-time Metrics Cards */}
{realtimeMetrics && (
  <div className="realtime-metrics-section">
    <div className="section-header">
      <h3>⚡ Real-time Metrics</h3>
      <button
        onClick={loadRealtimeMetrics}
        className="btn-secondary btn-sm"
      >
        🔄 Update
      </button>
    </div>
    
    <div className="metrics-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      {/* Today's Metrics */}
      <div className="metric-card today" style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📅 Today's Performance
        </h4>
        <div className="metric-values">
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Revenue:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.today.revenue)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Expenses:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.today.expenses)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Net Cash Flow:</span>
            <span style={{ 
              fontWeight: '700',
              color: realtimeMetrics.today.netCashFlow >= 0 ? '#10b981' : '#ef4444'
            }}>
              {formatCurrency(realtimeMetrics.today.netCashFlow)}
            </span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Transactions:</span>
            <span style={{ fontWeight: '700' }}>{realtimeMetrics.today.transactionCount}</span>
          </div>
        </div>
      </div>

      {/* This Week's Metrics */}
      <div className="metric-card week" style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📊 This Week
        </h4>
        <div className="metric-values">
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Revenue:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.thisWeek.revenue)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Expenses:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.thisWeek.expenses)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Net Cash Flow:</span>
            <span style={{ 
              fontWeight: '700',
              color: realtimeMetrics.thisWeek.netCashFlow >= 0 ? '#10b981' : '#ef4444'
            }}>
              {formatCurrency(realtimeMetrics.thisWeek.netCashFlow)}
            </span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Profit Margin:</span>
            <span style={{ fontWeight: '700' }}>{realtimeMetrics.thisWeek.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* This Month's Metrics */}
      <div className="metric-card month" style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🗓️ This Month
        </h4>
        <div className="metric-values">
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Revenue:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.thisMonth.revenue)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Expenses:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.thisMonth.expenses)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Net Cash Flow:</span>
            <span style={{ 
              fontWeight: '700',
              color: realtimeMetrics.thisMonth.netCashFlow >= 0 ? '#10b981' : '#ef4444'
            }}>
              {formatCurrency(realtimeMetrics.thisMonth.netCashFlow)}
            </span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Profit Margin:</span>
            <span style={{ fontWeight: '700' }}>{realtimeMetrics.thisMonth.profitMargin.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Alerts & Cash Position */}
      <div className="metric-card alerts" style={{
        background: realtimeMetrics.alerts.lowCashWarning 
          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
          : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {realtimeMetrics.alerts.lowCashWarning ? '⚠️ Alerts' : '✅ Status'}
        </h4>
        <div className="metric-values">
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Cash Position:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.cashPosition.current)}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Pending Expenses:</span>
            <span style={{ fontWeight: '700' }}>{realtimeMetrics.alerts.pendingExpenseCount}</span>
          </div>
          <div className="metric-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Unpaid Bookings:</span>
            <span style={{ fontWeight: '700' }}>{formatCurrency(realtimeMetrics.alerts.pendingRevenueAmount)}</span>
          </div>
          {realtimeMetrics.alerts.lowCashWarning && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '0.5rem',
              borderRadius: '6px',
              marginTop: '0.5rem',
              fontSize: '0.875rem'
            }}>
              💡 Cash position below threshold
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
      {/* Enhanced Booking Modal with Children Ages */}
      {showBookingModal && (
        <div className="modal-overlay" onClick={() => setShowBookingModal(false)}>
          <div className="modal booking-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Reservation</h3>
              <button onClick={() => setShowBookingModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content booking-content">
              {/* Property Selection */}
              <div className="input-group">
                <label>Property *</label>
                <select
                  value={bookingForm.propertyId}
                  onChange={(e) => updateBookingForm('propertyId', e.target.value)}
                  className="form-input"
                >
                  <option value="">Select a property</option>
                  <option value="ground-floor">Halcyon Rest - Ground Floor (US$104-122/night)</option>
                  <option value="first-floor">Halcyon Rest - First Floor (US$102-120/night)</option>
                </select>
              </div>

              {/* Dates */}
              <div className="date-inputs">
                <div className="input-group">
                  <label>Check-in Date *</label>
                  <input
                    type="date"
                    value={bookingForm.checkIn}
                    onChange={(e) => updateBookingForm('checkIn', e.target.value)}
                    className="form-input"
                  />
                </div>
                <div className="input-group">
                  <label>Check-out Date *</label>
                  <input
                    type="date"
                    value={bookingForm.checkOut}
                    onChange={(e) => updateBookingForm('checkOut', e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Guest Count with Children Ages */}
              <div className="guest-section">
                <h4>👥 Guest Information</h4>
                
                <div className="guest-inputs">
                  <div className="input-group">
                    <label>Adults *</label>
                    <input
                      type="number"
                      min="1"
                      max="4"
                      value={bookingForm.adults}
                      onChange={(e) => updateBookingForm('adults', parseInt(e.target.value) || 1)}
                      className="form-input"
                    />
                  </div>
                  <div className="input-group">
                    <label>Children</label>
                    <input
                      type="number"
                      min="0"
                      max="3"
                      value={bookingForm.children}
                      onChange={(e) => handleChildrenCountChange(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Children Ages Input */}
                {bookingForm.children > 0 && (
                  <div className="children-ages-section">
                    <label className="children-ages-label">
                      Children Ages * (≤11 years: Free | &gt;11 years: Adult rate)
                    </label>
                    <div className="children-ages-grid">
                      {Array.from({ length: bookingForm.children }, (_, index) => (
                        <div key={index} className="child-age-input">
                          <label>Child {index + 1} Age:</label>
                          <input
                            type="number"
                            min="0"
                            max="17"
                            value={bookingForm.childrenAges[index] || ''}
                            onChange={(e) => handleChildAgeChange(index, e.target.value)}
                            placeholder="Age"
                            className="form-input"
                          />
                        </div>
                      ))}
                    </div>
                    
                    {/* Guest Capacity Display */}
                    {bookingForm.childrenAges.length === bookingForm.children && (
                      <div className="capacity-info">
                        {(() => {
                          const effective = calculateEffectiveGuests(
                            bookingForm.adults, 
                            bookingForm.children, 
                            bookingForm.childrenAges
                          );
                          return (
                            <div className="effective-guests-display">
                              <strong>Effective Guests:</strong> {effective.effectiveAdults} adults, {effective.effectiveChildren} children (free)
                              {bookingForm.childrenAges.some(age => age > 11) && (
                                <div className="adult-rate-notice">
                                  ⚠️ Children over 11 will be charged adult rates
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Booker Information */}
              <div className="guest-section">
                <h4>📝 Booker Information</h4>
                
                <div className="input-group">
                  <label>Booker Name *</label>
                  <input
                    type="text"
                    value={bookingForm.guestInfo.bookerName}
                    onChange={(e) => updateBookingForm('guestInfo.bookerName', e.target.value)}
                    placeholder="Enter guest name"
                    autoComplete="name"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    value={bookingForm.guestInfo.country}
                    onChange={(e) => updateBookingForm('guestInfo.country', e.target.value)}
                    placeholder="Enter country"
                    autoComplete="country"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={bookingForm.guestInfo.email}
                    onChange={(e) => updateBookingForm('guestInfo.email', e.target.value)}
                    placeholder="Enter email address"
                    autoComplete="email"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={bookingForm.guestInfo.phone}
                    onChange={(e) => updateBookingForm('guestInfo.phone', e.target.value)}
                    placeholder="Enter phone number"
                    autoComplete="tel"
                    className="form-input"
                  />
                </div>
              </div>

              {/* Payment Currency */}
              <div className="input-group">
                <label>Payment Currency</label>
                <select
                  value={bookingForm.paymentCurrency}
                  onChange={(e) => updateBookingForm('paymentCurrency', e.target.value)}
                  className="form-input"
                >
                  <option value="USD">USD</option>
                  <option value="LKR">LKR</option>
                </select>
              </div>

              {/* Special Requests */}
              <div className="input-group">
                <label>Special Requests</label>
                <textarea
                  value={bookingForm.specialRequests}
                  onChange={(e) => updateBookingForm('specialRequests', e.target.value)}
                  placeholder="Any special requests or notes..."
                  rows="3"
                  className="form-input"
                />
              </div>

              {/* Enhanced Booking Summary */}
              {bookingForm.checkIn && bookingForm.checkOut && bookingForm.propertyId && (
                <div className="booking-summary">
                  <h4>💰 Booking Summary</h4>
                  <div className="summary-details">
                    <div className="summary-row">
                      <span>Property:</span>
                      <span>
                        {bookingForm.propertyId === 'first-floor' ? 'First Floor (US$102-120)' : 'Ground Floor (US$104-122)'}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span>Check-in:</span>
                      <span>{new Date(bookingForm.checkIn).toLocaleDateString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Check-out:</span>
                      <span>{new Date(bookingForm.checkOut).toLocaleDateString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Nights:</span>
                      <span>{calculateNights(bookingForm.checkIn, bookingForm.checkOut)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Guests:</span>
                      <span>
                        {bookingForm.adults} adults
                        {bookingForm.children > 0 && `, ${bookingForm.children} children`}
                        {bookingForm.childrenAges.length > 0 && ` (ages: ${bookingForm.childrenAges.join(', ')})`}
                      </span>
                    </div>
                    {bookingForm.childrenAges.length === bookingForm.children && (
                      <div className="summary-row effective-row">
                        <span>Effective Billing:</span>
                        <span>
                          {(() => {
                            const effective = calculateEffectiveGuests(
                              bookingForm.adults, 
                              bookingForm.children, 
                              bookingForm.childrenAges
                            );
                            return `${effective.effectiveAdults} adults, ${effective.effectiveChildren} children (free)`;
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="summary-row">
                      <span>Rate per night:</span>
                      <span>
                        {formatCurrency(getPropertyPrice(bookingForm.propertyId), 'LKR')}
                      </span>
                    </div>
                    <div className="summary-row total-row">
                      <span>Total (LKR):</span>
                      <span>
                        {formatCurrency(calculateTotalPrice(), 'LKR')}
                      </span>
                    </div>
                    {bookingForm.paymentCurrency === 'USD' && (
                      <div className="summary-row usd-row">
                        <span>Total (USD):</span>
                        <span>
                          {formatCurrency(calculateTotalPrice() / currencyRate, 'USD')}
                        </span>
                      </div>
                    )}
                    <div className="summary-row exchange-row">
                      <span>Exchange Rate:</span>
                      <span>1 USD = {currencyRate.toFixed(2)} LKR</span>
                    </div>
                    <div className="summary-row policy-row">
                      <span>Children Policy:</span>
                      <span>≤11 years: Free | &gt; 11 years: Adult rate</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                onClick={() => setShowBookingModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createReservation}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating...
                  </>
                ) : (
                  'Create Reservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Enhanced Expense Management Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal expense-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💸 Add New Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="expense-form">
                {/* Category Selection */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Category *</label>
                    <select
                      value={enhancedExpenseForm.category}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ 
                        ...prev, 
                        category: e.target.value,
                        subcategory: '' // Reset subcategory when category changes
                      }))}
                      className="form-input"
                    >
                      <option value="utilities">Utilities</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="supplies">Supplies</option>
                      <option value="staff">Staff</option>
                      <option value="marketing">Marketing</option>
                      <option value="services">Services</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Subcategory</label>
                    <select
                      value={enhancedExpenseForm.subcategory}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, subcategory: e.target.value }))}
                      className="form-input"
                    >
                      <option value="">Select subcategory</option>
                      {enhancedExpenseForm.category === 'utilities' && (
                        <>
                          <option value="electricity">Electricity</option>
                          <option value="water">Water</option>
                          <option value="internet">Internet</option>
                          <option value="gas">Gas</option>
                        </>
                      )}
                      {enhancedExpenseForm.category === 'maintenance' && (
                        <>
                          <option value="plumbing">Plumbing</option>
                          <option value="electrical">Electrical</option>
                          <option value="cleaning">Cleaning</option>
                          <option value="repairs">Repairs</option>
                        </>
                      )}
                      {enhancedExpenseForm.category === 'supplies' && (
                        <>
                          <option value="housekeeping">Housekeeping</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="office">Office</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                {/* Description and Amount */}
                <div className="form-row">
                  <div className="input-group flex-2">
                    <label>Description *</label>
                    <input
                      type="text"
                      value={enhancedExpenseForm.description}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter expense description"
                      className={`form-input ${expenseFormErrors.description ? 'error' : ''}`}
                    />
                    {expenseFormErrors.description && (
                      <span className="error-text">{expenseFormErrors.description}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Amount *</label>
                    <div className="amount-input-group">
                      <select
                        value={enhancedExpenseForm.currency}
                        onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="currency-select"
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={enhancedExpenseForm.amount}
                        onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        className={`form-input amount-input ${expenseFormErrors.amount ? 'error' : ''}`}
                      />
                    </div>
                    {expenseFormErrors.amount && (
                      <span className="error-text">{expenseFormErrors.amount}</span>
                    )}
                    {enhancedExpenseForm.amount && enhancedExpenseForm.currency === 'USD' && (
                      <div className="conversion-hint">
                        ≈ LKR {(parseFloat(enhancedExpenseForm.amount) * currencyRate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor and Date */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Vendor *</label>
                    <input
                      type="text"
                      value={enhancedExpenseForm.vendor}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, vendor: e.target.value }))}
                      placeholder="Enter vendor name"
                      className={`form-input ${expenseFormErrors.vendor ? 'error' : ''}`}
                    />
                    {expenseFormErrors.vendor && (
                      <span className="error-text">{expenseFormErrors.vendor}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Expense Date</label>
                    <input
                      type="date"
                      value={enhancedExpenseForm.expenseDate}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Invoice Number *</label>
                    <input
                      type="text"
                      value={enhancedExpenseForm.invoiceNumber}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Enter invoice number"
                      className={`form-input ${expenseFormErrors.invoiceNumber ? 'error' : ''}`}
                    />
                    {expenseFormErrors.invoiceNumber && (
                      <span className="error-text">{expenseFormErrors.invoiceNumber}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Payment Method</label>
                    <select
                      value={enhancedExpenseForm.paymentMethod}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="form-input"
                    >
                      <option value="cash">Cash</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="file-upload-section">
                  <div className="input-group">
                    <label>Invoice File * <span className="required-notice">(Mandatory)</span></label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'invoice')}
                        className="file-input"
                        id="invoice-file"
                      />
                      <label htmlFor="invoice-file" className="file-upload-label">
                        <span className="upload-icon">📄</span>
                        <span>
                          {enhancedExpenseForm.invoiceFile 
                            ? enhancedExpenseForm.invoiceFile.name || 'File selected'
                            : 'Click to upload invoice (PDF, JPG, PNG)'}
                        </span>
                      </label>
                      {expenseFormErrors.invoiceFile && (
                        <span className="error-text">{expenseFormErrors.invoiceFile}</span>
                      )}
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Receipt File <span className="optional-notice">(Optional)</span></label>
                    <div className="file-upload-area">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileUpload(e.target.files[0], 'receipt')}
                        className="file-input"
                        id="receipt-file"
                      />
                      <label htmlFor="receipt-file" className="file-upload-label">
                        <span className="upload-icon">🧾</span>
                        <span>
                          {enhancedExpenseForm.receiptFile 
                            ? enhancedExpenseForm.receiptFile.name || 'File selected'
                            : 'Click to upload receipt (optional)'}
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Recurring Expense Options */}
                <div className="recurring-section">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="recurring-checkbox"
                      checked={enhancedExpenseForm.isRecurring}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, isRecurring: e.target.checked }))}
                    />
                    <label htmlFor="recurring-checkbox">This is a recurring expense</label>
                  </div>
                  
                  {enhancedExpenseForm.isRecurring && (
                    <div className="input-group">
                      <label>Frequency</label>
                      <select
                        value={enhancedExpenseForm.recurringFrequency}
                        onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                        className="form-input"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Additional Options */}
                <div className="additional-options">
                  <div className="checkbox-group">
                    <input
                      type="checkbox"
                      id="tax-deductible-checkbox"
                      checked={enhancedExpenseForm.taxDeductible}
                      onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, taxDeductible: e.target.checked }))}
                    />
                    <label htmlFor="tax-deductible-checkbox">Tax Deductible</label>
                  </div>
                </div>

                {/* Notes */}
                <div className="input-group">
                  <label>Notes</label>
                  <textarea
                    value={enhancedExpenseForm.notes}
                    onChange={(e) => setEnhancedExpenseForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or comments..."
                    rows="3"
                    className="form-input"
                  />
                </div>

                {/* Expense Summary */}
                {enhancedExpenseForm.amount && (
                  <div className="expense-summary">
                    <h4>💰 Expense Summary</h4>
                    <div className="summary-details">
                      <div className="summary-row">
                        <span>Category:</span>
                        <span>{enhancedExpenseForm.category} {enhancedExpenseForm.subcategory && `→ ${enhancedExpenseForm.subcategory}`}</span>
                      </div>
                      <div className="summary-row">
                        <span>Amount:</span>
                        <span className="amount-display">
                          {enhancedExpenseForm.currency} {parseFloat(enhancedExpenseForm.amount || 0).toLocaleString()}
                          {enhancedExpenseForm.currency === 'USD' && (
                            <span className="conversion"> (≈ LKR {(parseFloat(enhancedExpenseForm.amount || 0) * currencyRate).toLocaleString()})</span>
                          )}
                        </span>
                      </div>
                      <div className="summary-row">
                        <span>Vendor:</span>
                        <span>{enhancedExpenseForm.vendor || 'Not specified'}</span>
                      </div>
                      <div className="summary-row">
                        <span>Status:</span>
                        <span className="status-pending">Pending Approval</span>
                      </div>
                      <div className="summary-row">
                        <span>Tax Deductible:</span>
                        <span>{enhancedExpenseForm.taxDeductible ? '✅ Yes' : '❌ No'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createExpense}
                disabled={loading}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating...
                  </>
                ) : (
                  'Submit for Approval'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expense List & Management Modal */}


      {/* Revenue Creation Modal */}
      {showRevenueModal && (
        <div className="modal-overlay" onClick={() => setShowRevenueModal(false)}>
          <div className="modal revenue-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Record Revenue</h3>
              <button onClick={() => setShowRevenueModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="revenue-form">
                {/* Revenue Type Selection */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Revenue Type *</label>
                    <select
                      value={revenueForm.type}
                      onChange={(e) => setRevenueForm(prev => ({ 
                        ...prev, 
                        type: e.target.value,
                        guestName: e.target.value === 'accommodation' ? prev.guestName : '' // Keep guest name for accommodation
                      }))}
                      className="form-input"
                    >
                      <option value="services">Additional Services</option>
                      <option value="other">Other Income</option>
                      <option value="accommodation">Accommodation (Manual)</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Payment Method</label>
                    <select
                      value={revenueForm.paymentMethod}
                      onChange={(e) => setRevenueForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      className="form-input"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="online">Online Payment</option>
                    </select>
                  </div>
                </div>

                {/* Description and Amount */}
                <div className="form-row">
                  <div className="input-group flex-2">
                    <label>Description *</label>
                    <input
                      type="text"
                      value={revenueForm.description}
                      onChange={(e) => setRevenueForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={
                        revenueForm.type === 'services' ? 'e.g., Laundry service, Airport transfer, Extra cleaning' :
                        revenueForm.type === 'accommodation' ? 'e.g., Ground Floor - 3 nights' :
                        'e.g., Security deposit return, Utility refund'
                      }
                      className={`form-input ${revenueFormErrors.description ? 'error' : ''}`}
                    />
                    {revenueFormErrors.description && (
                      <span className="error-text">{revenueFormErrors.description}</span>
                    )}
                  </div>
                  <div className="input-group">
                    <label>Amount *</label>
                    <div className="amount-input-group">
                      <select
                        value={revenueForm.currency}
                        onChange={(e) => setRevenueForm(prev => ({ ...prev, currency: e.target.value }))}
                        className="currency-select"
                      >
                        <option value="LKR">LKR</option>
                        <option value="USD">USD</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={revenueForm.amount}
                        onChange={(e) => setRevenueForm(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                        className={`form-input amount-input ${revenueFormErrors.amount ? 'error' : ''}`}
                      />
                    </div>
                    {revenueFormErrors.amount && (
                      <span className="error-text">{revenueFormErrors.amount}</span>
                    )}
                    {revenueForm.amount && revenueForm.currency === 'USD' && (
                      <div className="conversion-hint">
                        ≈ LKR {(parseFloat(revenueForm.amount) * currencyRate).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Guest Information (for services and accommodation) */}
                {(revenueForm.type === 'services' || revenueForm.type === 'accommodation') && (
                  <div className="form-row">
                    <div className="input-group">
                      <label>Guest Name {revenueForm.type === 'services' ? '*' : ''}</label>
                      <input
                        type="text"
                        value={revenueForm.guestName}
                        onChange={(e) => setRevenueForm(prev => ({ ...prev, guestName: e.target.value }))}
                        placeholder="Enter guest name"
                        className={`form-input ${revenueFormErrors.guestName ? 'error' : ''}`}
                      />
                      {revenueFormErrors.guestName && (
                        <span className="error-text">{revenueFormErrors.guestName}</span>
                      )}
                    </div>
                    <div className="input-group">
                      <label>Confirmation Number</label>
                      <input
                        type="text"
                        value={revenueForm.confirmationNumber}
                        onChange={(e) => setRevenueForm(prev => ({ ...prev, confirmationNumber: e.target.value }))}
                        placeholder="e.g., HR12345678"
                        className="form-input"
                      />
                    </div>
                  </div>
                )}

                {/* Service Type Examples */}
                {revenueForm.type === 'services' && (
                  <div className="service-examples-section">
                    <h4>💡 Service Examples</h4>
                    <div className="service-examples-grid">
                      {[
                        'Laundry Service',
                        'Airport Transfer',
                        'Extra Cleaning', 
                        'Late Checkout Fee',
                        'Additional Towels',
                        'Breakfast Service',
                        'Tour Booking Commission',
                        'Extra Guest Fee',
                        'Damage Deposit',
                        'Utility Charges'
                      ].map(service => (
                        <button
                          key={service}
                          type="button"
                          onClick={() => setRevenueForm(prev => ({ ...prev, description: service }))}
                          className="service-example-btn"
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="input-group">
                  <label>Notes</label>
                  <textarea
                    value={revenueForm.notes}
                    onChange={(e) => setRevenueForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes or details..."
                    rows="3"
                    className="form-input"
                  />
                </div>

                {/* Revenue Summary */}
                {revenueForm.amount && (
                  <div className="revenue-summary" style={{
                    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                    border: '1px solid #a7f3d0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginTop: '1rem'
                  }}>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#065f46',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      💰 Revenue Summary
                    </h4>
                    <div className="summary-details">
                      <div className="summary-row">
                        <span>Type:</span>
                        <span>{revenueForm.type === 'services' ? 'Additional Services' : 
                              revenueForm.type === 'accommodation' ? 'Accommodation' : 'Other Income'}</span>
                      </div>
                      <div className="summary-row">
                        <span>Amount:</span>
                        <span className="amount-display" style={{ color: '#059669', fontWeight: '700' }}>
                          {revenueForm.currency} {parseFloat(revenueForm.amount || 0).toLocaleString()}
                          {revenueForm.currency === 'USD' && (
                            <span className="conversion" style={{ color: '#6b7280', fontWeight: '400', marginLeft: '0.5rem' }}>
                              (≈ LKR {(parseFloat(revenueForm.amount || 0) * currencyRate).toLocaleString()})
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="summary-row">
                        <span>Payment Method:</span>
                        <span>{revenueForm.paymentMethod.replace('_', ' ')}</span>
                      </div>
                      {revenueForm.guestName && (
                        <div className="summary-row">
                          <span>Guest:</span>
                          <span>{revenueForm.guestName}</span>
                        </div>
                      )}
                      <div className="summary-row">
                        <span>Status:</span>
                        <span style={{ color: '#059669', fontWeight: '600' }}>Will be marked as Completed</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowRevenueModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createRevenueEntry}
                disabled={loading}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
                style={{
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Creating...
                  </>
                ) : (
                  'Record Revenue'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

{/* Revenue List & Management Modal */}
{showRevenueListModal && (
  <div className="modal-overlay" onClick={() => setShowRevenueListModal(false)}>
    <div className="modal revenue-list-modal" style={{ maxWidth: '1200px', width: '95vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>💰 Revenue Management</h3>
        <div className="header-actions">
          <button
            onClick={() => setShowRevenueModal(true)}
            className="btn-primary btn-professional-primary"
            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
          >
            <span>➕</span>
            Add Revenue
          </button>
          <button onClick={() => setShowRevenueListModal(false)} className="modal-close">✕</button>
        </div>
      </div>
      
      <div className="modal-content">
        {/* Revenue Filters */}
          <div className="revenue-filters form-section">
            {/* Quick Type Tabs - using FilterTabs helper */}
            <FilterTabs
              items={[
                { id: 'all', label: 'All Revenue', count: revenue.length },
                { id: 'services', label: 'Services', count: revenue.filter(r => r.type === 'services').length },
                { id: 'accommodation', label: 'Accommodation', count: revenue.filter(r => r.type === 'accommodation').length },
                { id: 'other', label: 'Other', count: revenue.filter(r => r.type === 'other').length }
              ]}
              current={revenueFilters.type}
              onChange={(id) => setRevenueFilters(prev => ({ ...prev, type: id }))}
            />

          {/* Advanced Filters */}
          <div className="advanced-filters">
            <div className="filters-row">
              {/* Search */}
              <div className="filter-group">
                <label>🔍 Search</label>
                <input
                  type="text"
                  placeholder="Search description, guest, confirmation..."
                  value={revenueFilters.searchText}
                  onChange={(e) => setRevenueFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="filter-input"
                />
              </div>

              {/* Payment Method Filter */}
              <div className="filter-group">
                <label>💳 Payment Method</label>
                <select
                  value={revenueFilters.paymentMethod}
                  onChange={(e) => setRevenueFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="filter-group">
                <label>📅 Date Range</label>
                <select
                  value={revenueFilters.dateRange}
                  onChange={(e) => setRevenueFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Amount Range Filter */}
              <div className="filter-group">
                <label>💰 Amount Range</label>
                <select
                  value={revenueFilters.amountRange}
                  onChange={(e) => setRevenueFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">All Amounts</option>
                  <option value="under_5000">Under LKR 5,000</option>
                  <option value="5000_25000">LKR 5,000 - 25,000</option>
                  <option value="25000_100000">LKR 25,000 - 100,000</option>
                  <option value="over_100000">Over LKR 100,000</option>
                </select>
              </div>

              {/* Reset Filters Button */}
              <div className="filter-group">
                <label>&nbsp;</label>
                <button
                  onClick={resetRevenueFilters}
                  className="reset-filters-btn"
                  style={{
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  }}
                >
                  🔄 Reset All
                </button>
              </div>
            </div>

            {/* Custom Date Range */}
            {revenueFilters.dateRange === 'custom' && (
              <div className="filters-row">
                <div className="filter-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={revenueFilters.startDate}
                    onChange={(e) => setRevenueFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="filter-input"
                  />
                </div>
                <div className="filter-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={revenueFilters.endDate}
                    onChange={(e) => setRevenueFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="filter-input"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Filter Results Summary */}
          <div className="filter-results-summary">
            <div className="results-info">
              <span className="results-count">
                Showing {getFilteredAndSortedRevenue().length} of {revenue.length} revenue entries
              </span>
              {revenueFilters.searchText && (
                <span className="search-info">
                  for "{revenueFilters.searchText}"
                </span>
              )}
            </div>
            <div className="results-total">
              <span className="total-amount" style={{
                color: '#059669',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid #a7f3d0'
              }}>
                Total: {formatCurrency(getFilteredAndSortedRevenue().reduce((sum, r) => sum + r.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue List */}
        <div className="revenue-list">
          {getFilteredAndSortedRevenue().length === 0 ? (
            <div className="no-results-state">
              <div className="empty-icon">💰</div>
              <h4>No revenue entries found</h4>
              <p>
                {revenueFilters.type === 'all' 
                  ? 'No revenue has been recorded yet.'
                  : `No ${revenueFilters.type} revenue found.`}
              </p>
              <button
                onClick={() => setShowRevenueModal(true)}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                Add First Revenue Entry
              </button>
            </div>
          ) : (
            <div className="revenue-table-container">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th className="table-header-dark">Date</th>
                    <th className="table-header-dark">Description</th>
                    <th className="table-header-dark">Type</th>
                    <th className="table-header-dark">Guest</th>
                    <th className="table-header-dark">Amount</th>
                    <th className="table-header-dark">Status</th>
                    <th className="table-header-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredAndSortedRevenue().map((rev) => (
                    <tr key={rev.id}>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-date">
                          <div style={{ fontWeight: '600', color: '#1f2937' }}>{new Date(rev.date).toLocaleDateString()}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Created: {new Date(rev.createdAt).toLocaleDateString()}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-description">
                          <div style={{ fontWeight: '600', color: '#1f2937', lineHeight: '1.4', maxWidth: '200px' }}>{rev.description}</div>
                          {rev.confirmationNumber && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Confirmation: {rev.confirmationNumber}</div>
                          )}
                          {rev.source === 'reservation' && (
                            <div style={{
                              display: 'inline-block',
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              marginTop: '0.25rem'
                            }}>
                              🔄 Auto from Booking
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-type">
                          <div style={{ fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>{rev.type}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'capitalize' }}>{rev.paymentMethod.replace('_', ' ')}</div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-guest">
                          {rev.guestName ? (
                            <div style={{ fontWeight: '600', color: '#1f2937' }}>{rev.guestName}</div>
                          ) : (
                            <div style={{ color: '#9ca3af', fontStyle: 'italic' }}>No guest</div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-amount" style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: '700', color: '#059669', fontSize: '1rem' }}>{formatCurrency(rev.amount)}</div>
                          {rev.amountUSD && (
                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatCurrency(rev.amountUSD, 'USD')}</div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <span className={`status-badge ${getRevenueStatusBadge(rev.paymentStatus)}`}>
                          {rev.paymentStatus}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 0.75rem' }}>
                        <div className="revenue-actions">
                          <button
                            onClick={() => {
                              setSelectedRevenue(rev);
                              setShowRevenueDetailModal(true);
                            }}
                            className="btn-secondary btn-sm"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="modal-footer">
        <div className="footer-stats">
          <span>Showing {getFilteredAndSortedRevenue().length} of {revenue.length} revenue entries</span>
          <span>Total: {formatCurrency(getFilteredAndSortedRevenue().reduce((sum, r) => sum + r.amount, 0))}</span>
        </div>
        <button
          onClick={() => setShowRevenueListModal(false)}
          className="btn-secondary btn-professional-secondary"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}

{/* Revenue Detail Modal */}
{showRevenueDetailModal && selectedRevenue && (
  <div className="modal-overlay" onClick={() => setShowRevenueDetailModal(false)}>
    <div className="modal revenue-detail-modal" style={{ maxWidth: '800px', width: '95vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>💰 Revenue Details - {selectedRevenue.id}</h3>
        <button onClick={() => setShowRevenueDetailModal(false)} className="modal-close">✕</button>
      </div>
      
      <div className="modal-content">
        <div className="revenue-detail-grid">
          {/* Basic Information */}
          <div className="detail-section">
            <h4>📋 Basic Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Description:</span>
                <span className="detail-value">{selectedRevenue.description}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Type:</span>
                <span className="detail-value">
                  {selectedRevenue.type === 'services' ? 'Additional Services' :
                   selectedRevenue.type === 'accommodation' ? 'Accommodation' : 'Other Income'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{new Date(selectedRevenue.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Method:</span>
                <span className="detail-value">{selectedRevenue.paymentMethod.replace('_', ' ')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Source:</span>
                <span className="detail-value">
                  {selectedRevenue.source === 'reservation' ? '🔄 Auto from Booking' : '✍️ Manual Entry'}
                </span>
              </div>
              {selectedRevenue.confirmationNumber && (
                <div className="detail-item">
                  <span className="detail-label">Confirmation:</span>
                  <span className="detail-value">{selectedRevenue.confirmationNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Financial Information */}
          <div className="detail-section">
            <h4>💰 Financial Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Amount (LKR):</span>
                <span className="detail-value amount" style={{ color: '#059669', fontWeight: '700' }}>{formatCurrency(selectedRevenue.amount)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Amount (USD):</span>
                <span className="detail-value amount" style={{ color: '#059669', fontWeight: '700' }}>{formatCurrency(selectedRevenue.amountUSD, 'USD')}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Exchange Rate:</span>
                <span className="detail-value">1 USD = {selectedRevenue.exchangeRate} LKR</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Payment Status:</span>
                <span className={`detail-value status-badge ${getRevenueStatusBadge(selectedRevenue.paymentStatus)}`}>
                  {selectedRevenue.paymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Guest Information */}
          {(selectedRevenue.guestName || selectedRevenue.confirmationNumber) && (
            <div className="detail-section">
              <h4>👤 Guest Information</h4>
              <div className="detail-grid">
                {selectedRevenue.guestName && (
                  <div className="detail-item">
                    <span className="detail-label">Guest Name:</span>
                    <span className="detail-value">{selectedRevenue.guestName}</span>
                  </div>
                )}
                {selectedRevenue.confirmationNumber && (
                  <div className="detail-item">
                    <span className="detail-label">Confirmation Number:</span>
                    <span className="detail-value">{selectedRevenue.confirmationNumber}</span>
                  </div>
                )}
                {selectedRevenue.sourceId && (
                  <div className="detail-item">
                    <span className="detail-label">Related Reservation:</span>
                    <span className="detail-value">
                      <button
                        onClick={() => {
                          const reservation = reservations.find(r => r.id === selectedRevenue.sourceId);
                          if (reservation) {
                            setSelectedRevenue(null);
                            setShowRevenueDetailModal(false);
                            setSelectedReservation(reservation);
                            setShowReservationModal(true);
                          }
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563eb',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          padding: '0',
                          font: 'inherit'
                        }}
                      >
                        View Reservation →
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Details (for service revenue) */}
          {selectedRevenue.type === 'services' && (
            <div className="detail-section">
              <h4>🛎️ Service Details</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Service Type:</span>
                  <span className="detail-value">{selectedRevenue.description}</span>
                </div>
                {selectedRevenue.guestName && (
                  <div className="detail-item">
                    <span className="detail-label">Provided To:</span>
                    <span className="detail-value">{selectedRevenue.guestName}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value" style={{ textTransform: 'capitalize' }}>
                    {selectedRevenue.paymentMethod.replace('_', ' ')}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Service Category:</span>
                  <span className="detail-value">Additional Services</span>
                </div>
              </div>
            </div>
          )}

          {/* System Information */}
          <div className="detail-section">
            <h4>📊 System Information</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Created:</span>
                <span className="detail-value">{new Date(selectedRevenue.createdAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Last Updated:</span>
                <span className="detail-value">{new Date(selectedRevenue.updatedAt).toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Entry ID:</span>
                <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{selectedRevenue.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Tags:</span>
                <span className="detail-value">
                  {selectedRevenue.tags?.map(tag => (
                    <span key={tag} style={{
                      background: 'rgba(25, 25, 40, 0.6)',
                      color: '#374151',
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      marginRight: '0.25rem'
                    }}>
                      {tag}
                    </span>
                  )) || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Analytics (if available) */}
          {selectedRevenue.type === 'accommodation' && selectedRevenue.sourceId && (
            <div className="detail-section">
              <h4>📈 Revenue Analytics</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Revenue per Night:</span>
                  <span className="detail-value">
                    {(() => {
                      const reservation = reservations.find(r => r.id === selectedRevenue.sourceId);
                      const nights = reservation?.dates?.nights || 1;
                      return formatCurrency(selectedRevenue.amount / nights);
                    })()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Revenue Type:</span>
                  <span className="detail-value">Accommodation Booking</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Auto-Generated:</span>
                  <span className="detail-value">
                    {selectedRevenue.source === 'reservation' ? '✅ Yes' : '❌ No'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Unit:</span>
                  <span className="detail-value">
                    {selectedRevenue.tags?.find(tag => tag.includes('floor')) || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedRevenue.notes && (
            <div className="detail-section full-width">
              <h4>📝 Notes</h4>
              <div className="notes-content" style={{
                background: 'rgba(20, 20, 35, 0.8)',
                padding: '1rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                color: '#374151',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedRevenue.notes}
              </div>
            </div>
          )}

          {/* Revenue Performance Indicator */}
          <div className="detail-section full-width">
            <h4>🎯 Performance Indicators</h4>
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
              padding: '1rem',
              borderRadius: '0.5rem',
              border: '1px solid #a7f3d0'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Revenue Amount</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#059669' }}>
                    {formatCurrency(selectedRevenue.amount)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Revenue Type</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937', textTransform: 'capitalize' }}>
                    {selectedRevenue.type}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Payment Status</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#059669', textTransform: 'capitalize' }}>
                    {selectedRevenue.paymentStatus}
                  </div>
                </div>
                {selectedRevenue.type === 'services' && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Service Category</div>
                    <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1f2937' }}>
                      Additional Service
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="modal-footer">
        <div className="footer-actions">
          {selectedRevenue.sourceId && (
            <button
              onClick={() => {
                const reservation = reservations.find(r => r.id === selectedRevenue.sourceId);
                if (reservation) {
                  setSelectedRevenue(null);
                  setShowRevenueDetailModal(false);
                  setSelectedReservation(reservation);
                  setShowReservationModal(true);
                }
              }}
              className="btn-secondary btn-professional-secondary"
            >
              📅 View Related Reservation
            </button>
          )}
          
          {selectedRevenue.type === 'services' && selectedRevenue.guestName && (
            <button
              onClick={() => {
                setMessageForm(prev => ({
                  ...prev,
                  receiverId: 'guest',
                  receiverName: selectedRevenue.guestName,
                  subject: `Service Receipt - ${selectedRevenue.description}`,
                  message: `Dear ${selectedRevenue.guestName},\n\nThank you for using our ${selectedRevenue.description} service.\n\nService Details:\n- Description: ${selectedRevenue.description}\n- Amount: ${formatCurrency(selectedRevenue.amount)}\n- Date: ${new Date(selectedRevenue.date).toLocaleDateString()}\n- Payment Method: ${selectedRevenue.paymentMethod.replace('_', ' ')}\n\nWe hope you enjoyed your stay at Halcyon Rest!\n\nBest regards,\nHalcyon Rest Team`,
                  type: 'guest'
                }));
                setShowRevenueDetailModal(false);
                setShowMessageModal(true);
              }}
              className="btn-secondary btn-professional-secondary"
            >
              📧 Send Service Receipt
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowRevenueDetailModal(false)}
          className="btn-secondary btn-professional-secondary"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
      {showExpenseListModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseListModal(false)}>
          <div className="modal expense-list-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💸 Expense Management</h3>
              <div className="header-actions">
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="btn-primary btn-professional-primary btn-ripple hover-scale"
                >
                  <span>➕</span>
                  Add Expense
                </button>
                <button onClick={() => setShowExpenseListModal(false)} className="modal-close">✕</button>
              </div>
            </div>
            
            <div className="modal-content">
              {/* Expense Filters */}
            <div className="expense-filters form-section">
              {/* Quick Status Tabs */}
              <FilterTabs
                items={[
                  { id: 'all', label: 'All Expenses', count: expenses.length },
                  { id: 'pending', label: 'Pending', count: expenses.filter(e => e.status === 'pending').length },
                  { id: 'approved', label: 'Approved', count: expenses.filter(e => e.status === 'approved').length },
                  { id: 'paid', label: 'Paid', count: expenses.filter(e => e.status === 'paid').length }
                ]}
                current={expenseFilters.status}
                onChange={(id) => setExpenseFilters(prev => ({ ...prev, status: id }))}
              />

              {/* Advanced Filters */}
              <div className="advanced-filters">
                <div className="filters-row">
                  {/* Search */}
                  <div className="filter-group">
                    <label>🔍 Search</label>
                    <input
                      type="text"
                      placeholder="Search description, vendor, invoice..."
                      value={expenseFilters.searchText}
                      onChange={(e) => setExpenseFilters(prev => ({ ...prev, searchText: e.target.value }))}
                      className="filter-input"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="filter-group">
                    <label>📂 Category</label>
                    <select
                      value={expenseFilters.category}
                      onChange={(e) => setExpenseFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Categories</option>
                      {getUniqueCategories().map(category => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Vendor Filter */}
                  <div className="filter-group">
                    <label>🏪 Vendor</label>
                    <select
                      value={expenseFilters.vendor}
                      onChange={(e) => setExpenseFilters(prev => ({ ...prev, vendor: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Vendors</option>
                      {getUniqueVendors().map(vendor => (
                        <option key={vendor} value={vendor}>
                          {vendor}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div className="filter-group">
                    <label>📊 Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="filter-select"
                    >
                      <option value="date_desc">Date (Newest First)</option>
                      <option value="date_asc">Date (Oldest First)</option>
                      <option value="amount_desc">Amount (Highest First)</option>
                      <option value="amount_asc">Amount (Lowest First)</option>
                      <option value="vendor_asc">Vendor (A-Z)</option>
                      <option value="status_asc">Status (A-Z)</option>
                    </select>
                  </div>
                </div>

                <div className="filters-row">
                  {/* Date Range Filter */}
                  <div className="filter-group">
                    <label>📅 Date Range</label>
                    <select
                      value={expenseFilters.dateRange}
                      onChange={(e) => setExpenseFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="this_week">This Week</option>
                      <option value="this_month">This Month</option>
                      <option value="last_month">Last Month</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>

                  {/* Custom Date Range */}
                  {expenseFilters.dateRange === 'custom' && (
                    <>
                      <div className="filter-group">
                        <label>From Date</label>
                        <input
                          type="date"
                          value={expenseFilters.startDate}
                          onChange={(e) => setExpenseFilters(prev => ({ ...prev, startDate: e.target.value }))}
                          className="filter-input"
                        />
                      </div>
                      <div className="filter-group">
                        <label>To Date</label>
                        <input
                          type="date"
                          value={expenseFilters.endDate}
                          onChange={(e) => setExpenseFilters(prev => ({ ...prev, endDate: e.target.value }))}
                          className="filter-input"
                        />
                      </div>
                    </>
                  )}

                  {/* Amount Range Filter */}
                  <div className="filter-group">
                    <label>💰 Amount Range</label>
                    <select
                      value={expenseFilters.amountRange}
                      onChange={(e) => setExpenseFilters(prev => ({ ...prev, amountRange: e.target.value }))}
                      className="filter-select"
                    >
                      <option value="all">All Amounts</option>
                      <option value="under_1000">Under LKR 1,000</option>
                      <option value="1000_5000">LKR 1,000 - 5,000</option>
                      <option value="5000_10000">LKR 5,000 - 10,000</option>
                      <option value="10000_25000">LKR 10,000 - 25,000</option>
                      <option value="over_25000">Over LKR 25,000</option>
                    </select>
                  </div>

                  {/* Reset Filters Button */}
                  <div className="filter-group">
                    <label>&nbsp;</label>
                    <button
                      onClick={resetFilters}
                      className="reset-filters-btn"
                    >
                      🔄 Reset All
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Results Summary */}
              <div className="filter-results-summary">
                <div className="results-info">
                  <span className="results-count">
                    Showing {getFilteredAndSortedExpenses().length} of {expenses.length} expenses
                  </span>
                  {expenseFilters.searchText && (
                    <span className="search-info">
                      for "{expenseFilters.searchText}"
                    </span>
                  )}
                </div>
                <div className="results-total">
                  <span className="total-amount">
                    Total: {formatCurrency(getFilteredAndSortedExpenses().reduce((sum, e) => sum + e.amount, 0))}
                  </span>
                </div>
              </div>
            </div>

              {/* Expense List */}
              <div className="expense-list">
                {getFilteredAndSortedExpenses().length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💸</div>
                    <h3>No expenses found</h3>
                    <p>
                      {expenseFilter === 'all' 
                        ? 'No expenses have been recorded yet.'
                        : `No ${expenseFilter} expenses found.`}
                    </p>
                    <button
                      onClick={() => setShowExpenseModal(true)}
                      className="btn-primary btn-professional-primary btn-ripple hover-scale"
                    >
                      Add First Expense
                    </button>
                  </div>
                ) : (
                  <div className="expenses-table-container">
                    <table className="expenses-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Category</th>
                          <th>Vendor</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredAndSortedExpenses().map((expense) => (
                          <tr key={expense.id}>
                            <td>
                              <div className="expense-date">
                                <div className="date-main">{new Date(expense.expenseDate).toLocaleDateString()}</div>
                                <div className="date-created">Created: {new Date(expense.createdAt).toLocaleDateString()}</div>
                              </div>
                            </td>
                            <td>
                              <div className="expense-description">
                                <div className="description-main">{expense.description}</div>
                                {expense.invoiceNumber && (
                                  <div className="invoice-number">Invoice: {expense.invoiceNumber}</div>
                                )}
                                {expense.isRecurring && (
                                  <div className="recurring-badge">🔄 Recurring ({expense.recurringFrequency})</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="expense-category">
                                <div className="category-main">{expense.category}</div>
                                {expense.subcategory && (
                                  <div className="subcategory">{expense.subcategory}</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <div className="expense-vendor">
                                <div className="vendor-name">{expense.vendor}</div>
                                <div className="payment-method">{expense.paymentMethod}</div>
                              </div>
                            </td>
                            <td>
                              <div className="expense-amount">
                                <div className="amount-main">{formatCurrency(expense.amount)}</div>
                                {expense.amountUSD && (
                                  <div className="amount-usd">{formatCurrency(expense.amountUSD, 'USD')}</div>
                                )}
                                {expense.taxDeductible && (
                                  <div className="tax-badge">💰 Tax Deductible</div>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${getExpenseStatusBadge(expense.status)}`}>
                                {expense.status}
                              </span>
                              {expense.approvedBy && (
                                <div className="approved-by">
                                  By: {expense.approvedBy}
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="expense-actions">
                                <button
                                  onClick={() => {
                                    setSelectedExpense(expense);
                                    setShowExpenseDetailModal(true);
                                  }}
                                  className="btn-secondary btn-sm"
                                >
                                  View
                                </button>
                                
                                {expense.status === 'pending' && currentUser.role === 'manager' && (
                                  <div className="approval-actions">
                                    <button
                                      onClick={() => approveExpense(expense.id, 'approve')}
                                      className="btn-success btn-sm"
                                      disabled={loading}
                                    >
                                      ✅ Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reason = prompt('Reason for rejection (optional):');
                                        if (reason !== null) {
                                          approveExpense(expense.id, 'reject', reason);
                                        }
                                      }}
                                      className="btn-danger btn-sm"
                                      disabled={loading}
                                    >
                                      ❌ Reject
                                    </button>
                                  </div>
                                )}
                                
                                {expense.status === 'approved' && currentUser.role === 'manager' && (
                                  <button
                                    onClick={() => {
                                      const paymentMethod = prompt('Payment method:') || expense.paymentMethod;
                                      const paymentReference = prompt('Payment reference (optional):');
                                      markExpenseAsPaid(expense.id, {
                                        paymentMethod,
                                        paymentReference,
                                        paymentDate: new Date().toISOString().split('T')[0]
                                      });
                                    }}
                                    className="btn-primary btn-sm"
                                    disabled={loading}
                                  >
                                    💳 Mark Paid
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="footer-stats">
                <span>Showing {getFilteredAndSortedExpenses().length} of {expenses.length} expenses</span>
                
              </div>
              <button
                onClick={() => setShowExpenseListModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expense Detail Modal */}
      {showExpenseDetailModal && selectedExpense && (
        <div className="modal-overlay" onClick={() => setShowExpenseDetailModal(false)}>
          <div className="modal expense-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💸 Expense Details - {selectedExpense.invoiceNumber}</h3>
              <button onClick={() => setShowExpenseDetailModal(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-content">
              <div className="expense-detail-grid">
                {/* Basic Information */}
                <div className="detail-section">
                  <h4>📋 Basic Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{selectedExpense.description}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">
                        {selectedExpense.category}
                        {selectedExpense.subcategory && ` → ${selectedExpense.subcategory}`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Vendor:</span>
                      <span className="detail-value">{selectedExpense.vendor}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expense Date:</span>
                      <span className="detail-value">{new Date(selectedExpense.expenseDate).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Payment Method:</span>
                      <span className="detail-value">{selectedExpense.paymentMethod}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Invoice Number:</span>
                      <span className="detail-value">{selectedExpense.invoiceNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="detail-section">
                  <h4>💰 Financial Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Amount (LKR):</span>
                      <span className="detail-value amount">{formatCurrency(selectedExpense.amount)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Amount (USD):</span>
                      <span className="detail-value amount">{formatCurrency(selectedExpense.amountUSD, 'USD')}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Tax Deductible:</span>
                      <span className="detail-value">{selectedExpense.taxDeductible ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Budget Category:</span>
                      <span className="detail-value">{selectedExpense.budgetCategory || selectedExpense.category}</span>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div className="detail-section">
                  <h4>📊 Status Information</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Current Status:</span>
                      <span className={`detail-value status-badge ${getExpenseStatusBadge(selectedExpense.status)}`}>
                        {selectedExpense.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created By:</span>
                      <span className="detail-value">{selectedExpense.createdBy || 'System'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created Date:</span>
                      <span className="detail-value">{new Date(selectedExpense.createdAt).toLocaleString()}</span>
                    </div>
                    {selectedExpense.approvedBy && (
                      <div className="detail-item">
                        <span className="detail-label">Approved By:</span>
                        <span className="detail-value">{selectedExpense.approvedBy}</span>
                      </div>
                    )}
                    {selectedExpense.approvedDate && (
                      <div className="detail-item">
                        <span className="detail-label">Approval Date:</span>
                        <span className="detail-value">{new Date(selectedExpense.approvedDate).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recurring Information */}
                {selectedExpense.isRecurring && (
                  <div className="detail-section">
                    <h4>🔄 Recurring Information</h4>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Frequency:</span>
                        <span className="detail-value">{selectedExpense.recurringFrequency}</span>
                      </div>
                      {selectedExpense.nextDueDate && (
                        <div className="detail-item">
                          <span className="detail-label">Next Due Date:</span>
                          <span className="detail-value">{new Date(selectedExpense.nextDueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Files */}
                <div className="detail-section">
                  <h4>📎 Attached Files</h4>
                  <div className="file-attachments">
                    {selectedExpense.invoiceFile && (
                      <div className="file-item">
                        <span className="file-icon">📄</span>
                        <span className="file-info">
                          <span className="file-label">Invoice File</span>
                          <span className="file-name">{selectedExpense.invoiceFile}</span>
                        </span>
                        <button className="btn-secondary btn-sm">📥 Download</button>
                      </div>
                    )}
                    {selectedExpense.receiptFile && (
                      <div className="file-item">
                        <span className="file-icon">🧾</span>
                        <span className="file-info">
                          <span className="file-label">Receipt File</span>
                          <span className="file-name">{selectedExpense.receiptFile}</span>
                        </span>
                        <button className="btn-secondary btn-sm">📥 Download</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedExpense.notes && (
                  <div className="detail-section full-width">
                    <h4>📝 Notes</h4>
                    <div className="notes-content">
                      {selectedExpense.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <div className="footer-actions">
                {selectedExpense.status === 'pending' && currentUser.role === 'manager' && (
                  <>
                    <button
                      onClick={() => {
                        approveExpense(selectedExpense.id, 'approve');
                        setShowExpenseDetailModal(false);
                      }}
                      className="btn-success"
                      disabled={loading}
                    >
                      ✅ Approve Expense
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Reason for rejection (optional):');
                        if (reason !== null) {
                          approveExpense(selectedExpense.id, 'reject', reason);
                          setShowExpenseDetailModal(false);
                        }
                      }}
                      className="btn-danger"
                      disabled={loading}
                    >
                      ❌ Reject Expense
                    </button>
                  </>
                )}
                
                {selectedExpense.status === 'approved' && currentUser.role === 'manager' && (
                  <button
                    onClick={() => {
                      const paymentMethod = prompt('Payment method:') || selectedExpense.paymentMethod;
                      const paymentReference = prompt('Payment reference (optional):');
                      markExpenseAsPaid(selectedExpense.id, {
                        paymentMethod,
                        paymentReference,
                        paymentDate: new Date().toISOString().split('T')[0],
                        notes: 'Marked as paid from expense details'
                      });
                      setShowExpenseDetailModal(false);
                    }}
                    className="btn-primary btn-professional-primary btn-ripple hover-scale"
                    disabled={loading}
                  >
                    💳 Mark as Paid
                  </button>
                )}
              </div>
              
              <button
                onClick={() => setShowExpenseDetailModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Message Compose Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal message-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📨 New Message</h3>
              <button onClick={() => setShowMessageModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="message-form">
                <div className="input-group">
                  <label>Message Type</label>
                  <select
                    value={messageForm.type}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, type: e.target.value }))}
                    className="form-input"
                  >
                    <option value="staff">Staff Communication</option>
                    <option value="guest">Guest Message</option>
                    <option value="maintenance">Maintenance Request</option>
                    <option value="system">System Notification</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Priority</label>
                  <select
                    value={messageForm.priority}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="form-input"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Recipient (Leave empty for broadcast)</label>
                  <input
                    type="text"
                    value={messageForm.receiverName}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, receiverName: e.target.value }))}
                    placeholder="Enter recipient name or leave empty for all staff"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter message subject"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Related Reservation (Optional)</label>
                  <select
                    value={messageForm.reservationId}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, reservationId: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">No related reservation</option>
                    {reservations.map(reservation => (
                      <option key={reservation.id} value={reservation.id}>
                        {reservation.confirmationNumber} - {reservation.guestInfo?.bookerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="input-group">
                  <label>Message *</label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter your message..."
                    rows="5"
                    className="form-input"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowMessageModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={loading || !messageForm.message.trim()}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Reservation Details Modal */}
      {showReservationModal && selectedReservation && (
        <div className="modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="modal reservation-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Reservation Details - {selectedReservation.confirmationNumber}</h3>
              <button onClick={() => setShowReservationModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              {/* Guest Information Section */}
              <div className="detail-section">
                <h4 className="section-title">👤 Guest Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Booker Name:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.bookerName || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Country:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.country || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Adults:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.adults || 0}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Children:</span>
                    <span className="detail-value">{selectedReservation.guestInfo?.children || 0}</span>
                  </div>
                  {selectedReservation.guestInfo?.childrenAges && selectedReservation.guestInfo.childrenAges.length > 0 && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Children Ages:</span>
                      <span className="detail-value">
                        {selectedReservation.guestInfo.childrenAges.join(', ')} years
                        {selectedReservation.guestInfo.childrenAges.some(age => age > 11) && 
                          <span className="adult-rate-indicator"> (Some charged as adults)</span>
                        }
                      </span>
                    </div>
                  )}
                  {selectedReservation.guestInfo?.effectiveAdults && (
                    <div className="detail-item full-width">
                      <span className="detail-label">Effective Billing:</span>
                      <span className="detail-value highlight">
                        {selectedReservation.guestInfo.effectiveAdults} adults, {selectedReservation.guestInfo.effectiveChildren || 0} children (free)
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reservation Details Section */}
              <div className="detail-section">
                <h4 className="section-title">📅 Reservation Details</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Confirmation Number:</span>
                    <span className="detail-value highlight">{selectedReservation.confirmationNumber}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Property:</span>
                    <span className="detail-value">{selectedReservation.unitName || selectedReservation.propertyId}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-in:</span>
                    <span className="detail-value">{selectedReservation.dates?.checkIn || selectedReservation.checkIn}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Check-out:</span>
                    <span className="detail-value">{selectedReservation.dates?.checkOut || selectedReservation.checkOut}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Nights:</span>
                    <span className="detail-value">{selectedReservation.dates?.nights || calculateNights(selectedReservation.checkIn, selectedReservation.checkOut)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Source:</span>
                    <span className="detail-value">{selectedReservation.source || 'direct'}</span>
                  </div>
                  {selectedReservation.pricing?.seasonalFactor && (
                    <div className="detail-item">
                      <span className="detail-label">Season:</span>
                      <span className={`detail-value season-${selectedReservation.pricing.seasonalFactor}`}>
                        {selectedReservation.pricing.seasonalFactor}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Information Section */}
              <div className="detail-section">
                <h4 className="section-title">💰 Payment Information</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Total Amount (LKR):</span>
                    <span className="detail-value highlight">{formatCurrency(selectedReservation.pricing?.totalLKR || 0, 'LKR')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Total Amount (USD):</span>
                    <span className="detail-value">{formatCurrency(selectedReservation.pricing?.totalUSD || 0, 'USD')}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Currency:</span>
                    <span className="detail-value">{selectedReservation.pricing?.currency || 'USD'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Exchange Rate Used:</span>
                    <span className="detail-value">1 USD = {selectedReservation.pricing?.exchangeRateUsed || currencyRate} LKR</span>
                  </div>
                  <div className="detail-item full-width">
                    <span className="detail-label">Payment Status:</span>
                    <select
                      value={selectedReservation.paymentStatus || 'not-paid'}
                      onChange={(e) => {
                        updateReservationStatus(selectedReservation.id, selectedReservation.status, e.target.value);
                        setSelectedReservation({
                          ...selectedReservation,
                          paymentStatus: e.target.value
                        });
                      }}
                      className={`status-badge ${getPaymentStatusStyle(selectedReservation.paymentStatus || 'not-paid')}`}
                      style={{ border: '1px solid #ccc', padding: '0.5rem', borderRadius: '0.25rem' }}
                    >
                      <option value="not-paid">Not Paid</option>
                      <option value="advance-payment">Advance Payment</option>
                      <option value="full-payment">Full Payment</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Management Section */}
              <div className="detail-section">
                <h4 className="section-title">📊 Status Management</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Reservation Status:</span>
                    <select
                      value={selectedReservation.status || 'pending'}
                      onChange={(e) => {
                        updateReservationStatus(selectedReservation.id, e.target.value, selectedReservation.paymentStatus);
                        setSelectedReservation({
                          ...selectedReservation,
                          status: e.target.value
                        });
                      }}
                      className={`status-badge ${selectedReservation.status || 'pending'}`}
                      style={{ border: '1px solid #ccc', padding: '0.5rem', borderRadius: '0.25rem' }}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked In</option>
                      <option value="checked-out">Checked Out</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{selectedReservation.createdAt ? new Date(selectedReservation.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Last Updated:</span>
                    <span className="detail-value">{selectedReservation.lastUpdated ? new Date(selectedReservation.lastUpdated).toLocaleString() : 'Not updated'}</span>
                  </div>
                </div>
              </div>

              {/* Special Requests Section */}
              {selectedReservation.specialRequests && (
                <div className="detail-section">
                  <h4 className="section-title">📝 Special Requests</h4>
                  <div className="special-requests-box">
                    {selectedReservation.specialRequests}
                  </div>
                </div>
              )}

              {/* Quick Actions Section */}
              <div className="detail-section">
                <h4 className="section-title">🚀 Quick Actions</h4>
                <div className="quick-actions-buttons">
                  <button
                    onClick={handleRevenueModalOpen}
                    className="quick-action-btn revenue-btn"
                  >
                    <span className="quick-action-icon">💰</span>
                    <span>Record Revenue</span>
                  </button>
                  <button
                    onClick={() => {
                      setMessageForm(prev => ({
                        ...prev,
                        receiverId: 'guest',
                        receiverName: selectedReservation.guestInfo?.bookerName || 'Guest',
                        subject: `Regarding your reservation ${selectedReservation.confirmationNumber}`,
                        reservationId: selectedReservation.id,
                        type: 'guest'
                      }));
                      setShowMessageModal(true);
                    }}
                    className="btn-secondary action-btn"
                  >
                    📨 Message Guest
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        setLoading(true);
                        
                        // Generate invoice for this reservation
                        const lineItems = [
                          {
                            description: `Accommodation - ${selectedReservation.dates?.nights || calculateNights(selectedReservation.checkIn, selectedReservation.checkOut)} nights`,
                            quantity: selectedReservation.dates?.nights || calculateNights(selectedReservation.checkIn, selectedReservation.checkOut),
                            unitPrice: selectedReservation.pricing?.totalLKR / (selectedReservation.dates?.nights || 1),
                            amount: selectedReservation.pricing?.totalLKR
                          }
                        ];

                        await generateInvoiceForReservation(selectedReservation.id, {
                          lineItems,
                          notes: `Invoice for reservation ${selectedReservation.confirmationNumber}`,
                          dueDate: selectedReservation.dates?.checkOut || selectedReservation.checkOut
                        });

                        setSuccess('Invoice generated successfully!');
                      } catch (error) {
                        setError('Failed to generate invoice: ' + error.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="btn-secondary action-btn"
                    disabled={loading}
                  >
                    {loading ? '⏳ Generating...' : '🧾 Generate Invoice'}
                  </button>
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="btn-secondary action-btn"
                  >
                    🖨️ Print Details
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowReservationModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setBookingForm({
                    ...bookingForm,
                    propertyId: selectedReservation.propertyId,
                    checkIn: '',
                    checkOut: '',
                    guestInfo: selectedReservation.guestInfo
                  });
                  setShowReservationModal(false);
                  setShowBookingModal(true);
                }}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                📅 New Reservation for Guest
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Pricing Management Modal */}
      {showPricingModal && (
        <div className="modal-overlay" onClick={() => setShowPricingModal(false)}>
          <div className="modal pricing-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💰 Update Pricing</h3>
              <button onClick={() => setShowPricingModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="pricing-form">
                <div className="input-group">
                  <label>Select Unit *</label>
                  <select
                    value={pricingForm.unitId}
                    onChange={(e) => setPricingForm(prev => ({ ...prev, unitId: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Select a unit to update pricing</option>
                    <option value="ground-floor">Ground Floor</option>
                    <option value="first-floor">First Floor</option>
                  </select>
                </div>

                {pricingForm.unitId && (
                  <div className="pricing-inputs">
                    <h4>Set Base Pricing (USD)</h4>
                    <p className="pricing-note">LKR prices will be calculated automatically at current rate: 1 USD = {currencyRate.toFixed(2)} LKR</p>
                    
                    <div className="guest-pricing-grid">
                      {Object.entries(pricingForm.basePricing).map(([guestType, pricing]) => (
                        <div key={guestType} className="guest-pricing-item">
                          <label>{guestType.replace('guest', '')} Guest{guestType !== 'guest1' ? 's' : ''}:</label>
                          <div className="price-input-group">
                            <span className="currency-prefix">$</span>
                            <input
                              type="number"
                              min="50"
                              max="500"
                              step="0.01"
                              value={pricing.USD}
                              onChange={(e) => {
                                const usdValue = parseFloat(e.target.value) || 0;
                                const lkrValue = Math.round(usdValue * currencyRate);
                                setPricingForm(prev => ({
                                  ...prev,
                                  basePricing: {
                                    ...prev.basePricing,
                                    [guestType]: {
                                      USD: usdValue,
                                      LKR: lkrValue
                                    }
                                  }
                                }));
                              }}
                              className="form-input price-input"
                            />
                            <span className="lkr-equivalent">≈ LKR {(pricing.USD * currencyRate).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pricing-preview">
                      <h4>Pricing Preview</h4>
                      <div className="preview-grid">
                        {Object.entries(pricingForm.basePricing).map(([guestType, pricing]) => (
                          <div key={guestType} className="preview-item">
                            <span className="guest-count">{guestType.replace('guest', '')} Guest{guestType !== 'guest1' ? 's' : ''}</span>
                            <span className="price-display">
                              <span className="usd-price">${pricing.USD}</span>
                              <span className="lkr-price">LKR {pricing.LKR.toLocaleString()}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="price-range-display">
                        <strong>New Price Range: </strong>
                        ${Math.min(...Object.values(pricingForm.basePricing).map(p => p.USD))} - ${Math.max(...Object.values(pricingForm.basePricing).map(p => p.USD))} USD
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowPricingModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updatePricing}
                disabled={loading || !pricingForm.unitId}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                {loading ? 'Updating...' : 'Update Pricing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Management Modal */}
      {showCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowCalendarModal(false)}>
          <div className="modal calendar-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗓️ Calendar Management</h3>
              <button onClick={() => setShowCalendarModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="calendar-management-tabs">
                {/* Block Dates Section */}
                <div className="management-section">
                  <h4>🚫 Block Dates</h4>
                  <p>Temporarily block dates for maintenance, personal use, or other reasons</p>
                  
                  <div className="block-dates-form form-section">
                    <div className="input-group">
                      <label>Unit *</label>
                      <select
                        value={dateBlockForm.unitId}
                        onChange={(e) => setDateBlockForm(prev => ({ ...prev, unitId: e.target.value }))}
                        className="form-input"
                      >
                        <option value="">Select unit to block</option>
                        <option value="ground-floor">Ground Floor</option>
                        <option value="first-floor">First Floor</option>
                      </select>
                    </div>

                    <div className="date-inputs">
                      <div className="input-group">
                        <label>Start Date *</label>
                        <input
                          type="date"
                          value={dateBlockForm.startDate}
                          onChange={(e) => setDateBlockForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div className="input-group">
                        <label>End Date *</label>
                        <input
                          type="date"
                          value={dateBlockForm.endDate}
                          onChange={(e) => setDateBlockForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Reason</label>
                      <select
                        value={dateBlockForm.reason}
                        onChange={(e) => setDateBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="form-input"
                      >
                        <option value="Manual block">Manual block</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Personal use">Personal use</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Deep cleaning">Deep cleaning</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <button
                      onClick={blockDates}
                      disabled={loading || !dateBlockForm.unitId || !dateBlockForm.startDate || !dateBlockForm.endDate}
                      className="btn-warning full-width"
                    >
                      {loading ? 'Blocking...' : 'Block Dates'}
                    </button>
                  </div>
                </div>

                {/* Custom Pricing Section */}
                <div className="management-section">
                  <h4>💰 Set Custom Pricing</h4>
                  <p>Set special rates for specific date ranges (holidays, events, etc.)</p>
                  
                  <div className="custom-pricing-form">
                    <div className="input-group">
                      <label>Unit *</label>
                      <select
                        value={customPricingForm.unitId}
                        onChange={(e) => setCustomPricingForm(prev => ({ ...prev, unitId: e.target.value }))}
                        className="form-input"
                      >
                        <option value="">Select unit for custom pricing</option>
                        <option value="ground-floor">Ground Floor</option>
                        <option value="first-floor">First Floor</option>
                      </select>
                    </div>

                    <div className="date-inputs">
                      <div className="input-group">
                        <label>Start Date *</label>
                        <input
                          type="date"
                          value={customPricingForm.startDate}
                          onChange={(e) => setCustomPricingForm(prev => ({ ...prev, startDate: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                      <div className="input-group">
                        <label>End Date *</label>
                        <input
                          type="date"
                          value={customPricingForm.endDate}
                          onChange={(e) => setCustomPricingForm(prev => ({ ...prev, endDate: e.target.value }))}
                          className="form-input"
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Reason</label>
                      <select
                        value={customPricingForm.reason}
                        onChange={(e) => setCustomPricingForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="form-input"
                      >
                        <option value="Special rate">Special rate</option>
                        <option value="Holiday pricing">Holiday pricing</option>
                        <option value="Event pricing">Event pricing</option>
                        <option value="Peak season">Peak season</option>
                        <option value="Discount period">Discount period</option>
                        <option value="Promotional rate">Promotional rate</option>
                      </select>
                    </div>

                    {customPricingForm.unitId && (
                      <div className="custom-pricing-inputs">
                        <h5>Custom Rates (USD)</h5>
                        <div className="guest-pricing-grid">
                          {Object.entries(customPricingForm.pricing).map(([guestType, pricing]) => (
                            <div key={guestType} className="guest-pricing-item">
                              <label>{guestType.replace('guest', '')} Guest{guestType !== 'guest1' ? 's' : ''}:</label>
                              <div className="price-input-group">
                                <span className="currency-prefix">$</span>
                                <input
                                  type="number"
                                  min="50"
                                  max="500"
                                  step="0.01"
                                  value={pricing.USD}
                                  onChange={(e) => {
                                    const usdValue = parseFloat(e.target.value) || 0;
                                    setCustomPricingForm(prev => ({
                                      ...prev,
                                      pricing: {
                                        ...prev.pricing,
                                        [guestType]: { USD: usdValue }
                                      }
                                    }));
                                  }}
                                  className="form-input price-input"
                                />
                                <span className="lkr-equivalent">≈ LKR {(pricing.USD * currencyRate).toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={setCustomPricing}
                      disabled={loading || !customPricingForm.unitId || !customPricingForm.startDate || !customPricingForm.endDate}
                      className="btn-primary full-width"
                    >
                      {loading ? 'Setting...' : 'Set Custom Pricing'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Calendar Integration Modal */}
      {showExternalCalendarModal && (
        <div className="modal-overlay" onClick={() => setShowExternalCalendarModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔗 External Calendar Integration</h3>
              <button onClick={() => setShowExternalCalendarModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="external-calendar-form">
                <div className="input-group">
                  <label>Unit *</label>
                  <select
                    value={externalCalendarForm.unitId}
                    onChange={(e) => setExternalCalendarForm(prev => ({ ...prev, unitId: e.target.value }))}
                    className="form-input"
                  >
                    <option value="">Select unit for integration</option>
                    <option value="ground-floor">Ground Floor</option>
                    <option value="first-floor">First Floor</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Platform *</label>
                  <select
                    value={externalCalendarForm.platform}
                    onChange={(e) => setExternalCalendarForm(prev => ({ ...prev, platform: e.target.value }))}
                    className="form-input"
                  >
                    <option value="booking.com">Booking.com</option>
                    <option value="airbnb">Airbnb</option>
                    <option value="expedia">Expedia</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Calendar URL (iCal) *</label>
                  <input
                    type="url"
                    value={externalCalendarForm.calendarUrl}
                    onChange={(e) => setExternalCalendarForm(prev => ({ ...prev, calendarUrl: e.target.value }))}
                    placeholder="https://example.com/calendar.ics"
                    className="form-input"
                  />
                  <small>Enter the iCal URL provided by the booking platform</small>
                </div>

                <div className="input-group">
                  <label>Calendar Name</label>
                  <input
                    type="text"
                    value={externalCalendarForm.name}
                    onChange={(e) => setExternalCalendarForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Booking.com Ground Floor"
                    className="form-input"
                  />
                </div>

                <div className="input-group">
                  <label>Sync Strategy</label>
                  <select
                    value={externalCalendarForm.syncStrategy}
                    onChange={(e) => setExternalCalendarForm(prev => ({ ...prev, syncStrategy: e.target.value }))}
                    className="form-input"
                  >
                    <option value="import_only">Import Only (Block dates from external)</option>
                    <option value="export_only">Export Only (Send our calendar to external)</option>
                    <option value="two_way">Two-way Sync (Import and Export)</option>
                  </select>
                </div>

                <div className="sync-info">
                  <h5>Integration Instructions:</h5>
                  <ul>
                    <li><strong>Booking.com:</strong> Go to Property → Calendar → Export → Copy iCal URL</li>
                    <li><strong>Airbnb:</strong> Go to Calendar → Availability settings → Export calendar</li>
                    <li><strong>Export URL:</strong> Use this URL in external platforms: <code>{getExportUrl(externalCalendarForm.unitId || 'UNIT_ID')}</code></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setShowExternalCalendarModal(false)}
                className="btn-secondary btn-professional-secondary"
              >
                Cancel
              </button>
              <button
                onClick={addExternalCalendar}
                disabled={loading || !externalCalendarForm.unitId || !externalCalendarForm.calendarUrl}
                className="btn-primary btn-professional-primary btn-ripple hover-scale"
              >
                {loading ? 'Adding...' : 'Add Integration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== INVENTORY MODALS ===== */}
      <InventoryModals
        showInventoryModal={showInventoryModal}
        setShowInventoryModal={setShowInventoryModal}
        selectedInventoryItem={selectedInventoryItem}
        inventoryForm={inventoryForm}
        setInventoryForm={setInventoryForm}
        createInventoryItem={createInventoryItem}
        updateInventoryItem={updateInventoryItem}
        loading={loading}
        showStockInModal={showStockInModal}
        setShowStockInModal={setShowStockInModal}
        stockTransactionForm={stockTransactionForm}
        setStockTransactionForm={setStockTransactionForm}
        stockIn={stockIn}
        showStockOutModal={showStockOutModal}
        setShowStockOutModal={setShowStockOutModal}
        stockOut={stockOut}
        showStockAdjustModal={showStockAdjustModal}
        setShowStockAdjustModal={setShowStockAdjustModal}
        stockAdjust={stockAdjust}
        properties={properties}
      />

      {/* Upload Invoice Modal */}
      {showUploadInvoiceModal && (
        <div className="modal-overlay" onClick={() => setShowUploadInvoiceModal(false)}>
          <div className="modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Upload Invoice/Bill</h3>
              <button onClick={() => setShowUploadInvoiceModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div className="form-grid">
                <div className="form-group">
                  <label>Document Type *</label>
                  <select
                    value={uploadInvoiceForm.type}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, type: e.target.value }))}
                    className="form-input"
                  >
                    <option value="guest_invoice">Guest Invoice</option>
                    <option value="supplier_bill">Supplier Bill</option>
                    <option value="expense_receipt">Expense Receipt</option>
                    <option value="utility_bill">Utility Bill</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadInvoiceForm.amount}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Currency *</label>
                  <select
                    value={uploadInvoiceForm.currency}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="form-input"
                  >
                    <option value="LKR">LKR (Sri Lankan Rupee)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="GBP">GBP (British Pound)</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label>Issued To/From *</label>
                  <input
                    type="text"
                    value={uploadInvoiceForm.issuedTo}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, issuedTo: e.target.value }))}
                    className="form-input"
                    placeholder="Company/Person name"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Category</label>
                  <input
                    type="text"
                    value={uploadInvoiceForm.category}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, category: e.target.value }))}
                    className="form-input"
                    placeholder="e.g., Utilities, Maintenance, Supplies"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={uploadInvoiceForm.notes}
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="form-input"
                    rows="3"
                    placeholder="Additional information..."
                  />
                </div>

                <div className="form-group full-width">
                  <label>Upload Document (PDF/Image) *</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, file: e.target.files[0] }))}
                    className="form-input"
                    style={{ padding: '0.5rem' }}
                  />
                  {uploadInvoiceForm.file && (
                    <div style={{
                      marginTop: '0.5rem',
                      padding: '0.5rem',
                      background: 'rgba(16, 185, 129, 0.1)',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#059669'
                    }}>
                      ✅ {uploadInvoiceForm.file.name} ({(uploadInvoiceForm.file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowUploadInvoiceModal(false);
                  resetUploadInvoiceForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={uploadInvoice}
                disabled={loading || !uploadInvoiceForm.file || !uploadInvoiceForm.amount || !uploadInvoiceForm.issuedTo}
                className="btn-primary"
                style={{
                  background: loading ? 'rgba(139, 92, 246, 0.6)' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Uploading...
                  </>
                ) : (
                  <>📤 Upload Invoice</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Invoice Payment Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💳 Record Payment</h3>
              <button onClick={() => setShowInvoiceModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              <div style={{
                padding: '1rem',
                background: 'rgba(25, 25, 40, 0.6)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                border: '1px solid #cbd5e1'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Invoice:</strong> {selectedInvoice.invoiceNumber}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Total:</strong> {formatCurrency(selectedInvoice.totalAmount, selectedInvoice.currency)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Paid:</strong> {formatCurrency(selectedInvoice.paidAmount, selectedInvoice.currency)}
                </div>
                <div style={{ 
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: '#dc2626',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #cbd5e1'
                }}>
                  <strong>Balance Due:</strong> {formatCurrency(selectedInvoice.totalAmount - selectedInvoice.paidAmount, selectedInvoice.currency)}
                </div>
              </div>

              <div className="form-group">
                <label>Payment Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={uploadInvoiceForm.amount}
                  onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="form-input"
                  placeholder="Enter payment amount"
                  max={selectedInvoice.totalAmount - selectedInvoice.paidAmount}
                />
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <select
                  value={uploadInvoiceForm.paymentMethod || 'cash'}
                  onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  className="form-input"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                  <option value="mobile_payment">Mobile Payment</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div className="form-group">
                <label>Payment Date *</label>
                <input
                  type="date"
                  value={uploadInvoiceForm.paymentDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={uploadInvoiceForm.notes}
                  onChange={(e) => setUploadInvoiceForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="form-input"
                  rows="3"
                  placeholder="Payment reference or notes..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                  resetUploadInvoiceForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!uploadInvoiceForm.amount || parseFloat(uploadInvoiceForm.amount) <= 0) {
                    setError('Please enter a valid payment amount');
                    return;
                  }

                  const paymentAmount = parseFloat(uploadInvoiceForm.amount);
                  const balanceDue = selectedInvoice.totalAmount - selectedInvoice.paidAmount;

                  if (paymentAmount > balanceDue) {
                    setError(`Payment amount cannot exceed balance due of ${formatCurrency(balanceDue, selectedInvoice.currency)}`);
                    return;
                  }

                  await recordInvoicePayment(selectedInvoice.id, {
                    amount: paymentAmount,
                    paymentMethod: uploadInvoiceForm.paymentMethod || 'cash',
                    paymentDate: uploadInvoiceForm.paymentDate || new Date().toISOString().split('T')[0],
                    notes: uploadInvoiceForm.notes
                  });

                  setShowInvoiceModal(false);
                  setSelectedInvoice(null);
                  resetUploadInvoiceForm();
                }}
                disabled={loading || !uploadInvoiceForm.amount}
                className="btn-primary"
                style={{
                  background: loading ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processing...
                  </>
                ) : (
                  <>💳 Record Payment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>🏖️ Welcome to Halcyon Rest</h3>
            </div>
            <div className="modal-content">
              <p style={{ 
                textAlign: 'center', 
                marginBottom: '2rem', 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem'
              }}>
                Please sign in to continue
              </p>

              {error && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}>
                <div className="input-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                    className="form-input"
                    placeholder="Enter your username"
                    autoFocus
                    disabled={isLoggingIn}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="form-input"
                    placeholder="Enter your password"
                    disabled={isLoggingIn}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginForm.username || !loginForm.password}
                  className="btn-primary full-width"
                  style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    background: isLoggingIn ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    cursor: isLoggingIn ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <div className="loading-spinner" style={{ display: 'inline-block' }}></div>
                      Signing in...
                    </>
                  ) : (
                    '🔐 Sign In'
                  )}
                </button>
              </form>

              <div style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                <p>Default credentials:</p>
                <p style={{ fontFamily: 'monospace', marginTop: '0.5rem' }}>
                  Username: <strong style={{ color: 'rgba(16, 185, 129, 1)' }}>admin</strong><br />
                  Password: <strong style={{ color: 'rgba(16, 185, 129, 1)' }}>admin123</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => {
          setShowUserModal(false);
          resetUserForm();
        }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingUser ? '✏️ Edit User' : '➕ Add New User'}</h3>
              <button onClick={() => {
                setShowUserModal(false);
                resetUserForm();
              }} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              {error && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="form-input"
                    placeholder="Enter first name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="form-input"
                    placeholder="Enter last name"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="form-input"
                    placeholder="Enter username"
                    disabled={editingUser}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="form-input"
                    placeholder="Enter email"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Password {!editingUser && '*'}</label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="form-input"
                    placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                    required={!editingUser}
                  />
                </div>

                <div className="input-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="form-input"
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Role *</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value }))}
                    className="form-select"
                    required
                  >
                    <option value="front_desk">Front Desk</option>
                    <option value="housekeeping">Housekeeping</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="finance">Finance</option>
                    <option value="manager">Manager</option>
                    {authenticatedUser?.role === 'super_admin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  <div style={{
                    fontSize: '0.75rem',
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '0.5rem'
                  }}>
                    {userForm.role === 'super_admin' && '⚠️ Super Admin has full system access'}
                    {userForm.role === 'admin' && 'Admin can manage users and most system settings'}
                    {userForm.role === 'manager' && 'Manager has access to all operational features'}
                    {userForm.role === 'front_desk' && 'Front Desk can manage reservations and guests'}
                    {userForm.role === 'housekeeping' && 'Housekeeping can manage room status and inventory'}
                    {userForm.role === 'maintenance' && 'Maintenance can manage property maintenance'}
                    {userForm.role === 'finance' && 'Finance can manage financial records and reports'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    resetUserForm();
                  }}
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={editingUser ? updateUser : createUser}
                  disabled={loading || !userForm.username || !userForm.email || !userForm.firstName || !userForm.lastName || (!editingUser && !userForm.password)}
                  className="btn-primary"
                  style={{ 
                    flex: 1,
                    background: loading ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ display: 'inline-block' }}></div>
                      {editingUser ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>{editingUser ? '💾 Update User' : '➕ Create User'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>👤 My Profile</h3>
              <button onClick={() => setShowProfileModal(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-content">
              {error && (
                <div style={{
                  padding: '1rem',
                  marginBottom: '1rem',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              {/* Profile Information Section */}
              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#3b82f6' }}>
                  Personal Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="input-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter first name"
                    />
                  </div>

                  <div className="input-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="form-input"
                      placeholder="Enter last name"
                    />
                  </div>

                  <div className="input-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                      className="form-input"
                      placeholder="Enter email"
                    />
                  </div>

                  <div className="input-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="form-input"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                <button
                  onClick={updateProfile}
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    background: loading ? 'rgba(16, 185, 129, 0.6)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ display: 'inline-block' }}></div>
                      Updating...
                    </>
                  ) : (
                    '💾 Update Profile'
                  )}
                </button>
              </div>

              {/* Change Password Section */}
              <div style={{
                paddingTop: '2rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#3b82f6' }}>
                  Change Password
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div className="input-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={profileForm.currentPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="form-input"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div className="input-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="form-input"
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </div>

                  <div className="input-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="form-input"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <button
                  onClick={changePassword}
                  disabled={loading || !profileForm.currentPassword || !profileForm.newPassword || !profileForm.confirmPassword}
                  className="btn-primary"
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    background: loading ? 'rgba(239, 68, 68, 0.6)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  }}
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" style={{ display: 'inline-block' }}></div>
                      Changing...
                    </>
                  ) : (
                    '🔒 Change Password'
                  )}
                </button>

                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center'
                }}>
                  Password must be at least 8 characters long
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </ProfessionalBackground>
  );
}

export default App;

