import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Property API calls
export const propertyAPI = {
  getAll: () => apiClient.get('/properties'),
  getById: (id) => apiClient.get(`/properties/${id}`),
  create: (data) => apiClient.post('/properties', data),
  update: (id, data) => apiClient.put(`/properties/${id}`, data),
  delete: (id) => apiClient.delete(`/properties/${id}`),
};

// Reservation API calls
export const reservationAPI = {
  getAll: () => apiClient.get('/reservations'),
  getById: (id) => apiClient.get(`/reservations/${id}`),
  create: (data) => apiClient.post('/reservations', data),
  update: (id, data) => apiClient.put(`/reservations/${id}`, data),
  updateStatus: (id, status, reason) => apiClient.put(`/reservations/${id}/status`, { status, reason }),
  delete: (id) => apiClient.delete(`/reservations/${id}`),
  checkAvailability: (params) => apiClient.post('/reservations/check-availability', params),
  calculatePricing: (data) => apiClient.post('/reservations/calculate-pricing', data),

  // Reservation management operations
  cancel: (id, data) => apiClient.post(`/reservations/${id}/cancel`, data),
  modify: (id, data) => apiClient.post(`/reservations/${id}/modify`, data),
  checkIn: (id, data) => apiClient.post(`/reservations/${id}/check-in`, data),
  checkOut: (id, data) => apiClient.post(`/reservations/${id}/check-out`, data),
};

// Payment API calls
export const paymentAPI = {
  getAll: () => apiClient.get('/payments'),
  getByReservation: (reservationId) => apiClient.get(`/payments/reservation/${reservationId}`),
  create: (data) => apiClient.post('/payments', data),
  update: (id, data) => apiClient.put(`/payments/${id}`, data),
  delete: (id) => apiClient.delete(`/payments/${id}`),
};

// Financial API calls
export const financialAPI = {
  // Dashboard and reports (LEGACY - OLD ENDPOINTS)
  getDashboard: (period = '6months', granularity = 'monthly') =>
    apiClient.get('/financial/dashboard', { params: { period, granularity } }),
  getSummary: () => apiClient.get('/financial/summary'),
  getProfitLoss: () => apiClient.get('/financial/profit-loss'),
  getCashFlow: () => apiClient.get('/financial/cash-flow'),
  getRealtimeMetrics: () => apiClient.get('/financial/realtime-metrics'),

  // Revenue (LEGACY)
  getAllRevenue: () => apiClient.get('/financial/revenue'),
  createRevenue: (data) => apiClient.post('/financial/revenue', data),
  updateRevenue: (id, data) => apiClient.put(`/financial/revenue/${id}`, data),
  deleteRevenue: (id) => apiClient.delete(`/financial/revenue/${id}`),

  // Expenses (LEGACY)
  getAllExpenses: () => apiClient.get('/financial/expenses'),
  getPendingExpenses: () => apiClient.get('/financial/expenses/pending'),
  createExpense: (data) => apiClient.post('/financial/expenses', data),
  updateExpense: (id, data) => apiClient.put(`/financial/expenses/${id}`, data),
  approveExpense: (id, action, reason) => apiClient.put(`/financial/expenses/${id}/approve`, { action, reason }),
  deleteExpense: (id) => apiClient.delete(`/financial/expenses/${id}`),

  // Export (LEGACY)
  exportFinancialData: (params) => apiClient.post('/financial/export', params),
};

// Automated Accounting API calls (NEW - Double-Entry Bookkeeping System)
export const accountingAPI = {
  // System Initialization
  initializeFinancialSystem: () => apiClient.post('/financial/initialize'),
  initializeAccounts: () => apiClient.post('/financial/initialize/accounts'),

  // Chart of Accounts
  getAllAccounts: (params) => apiClient.get('/financial/accounts', { params }),
  getAccountById: (id) => apiClient.get(`/financial/accounts/${id}`),
  createAccount: (data) => apiClient.post('/financial/accounts', data),
  updateAccount: (id, data) => apiClient.put(`/financial/accounts/${id}`, data),
  deactivateAccount: (id) => apiClient.put(`/financial/accounts/${id}/deactivate`),

  // Transactions (Double-Entry Journal Entries)
  getAllTransactions: (params) => apiClient.get('/financial/transactions', { params }),
  getTransactionById: (id) => apiClient.get(`/financial/transactions/${id}`),
  createTransaction: (data) => apiClient.post('/financial/transactions', data),
  reverseTransaction: (id, reason) => apiClient.post(`/financial/transactions/${id}/reverse`, { reason }),

  // Financial Reports (NEW - Professional Accounting Reports)
  getProfitLossStatement: (startDate, endDate) =>
    apiClient.get('/financial/reports/profit-loss', { params: { startDate, endDate } }),
  getBalanceSheet: (asOfDate) =>
    apiClient.get('/financial/reports/balance-sheet', { params: { asOfDate } }),
  getCashFlowStatement: (startDate, endDate) =>
    apiClient.get('/financial/reports/cash-flow', { params: { startDate, endDate } }),

  // Budgets
  getAllBudgets: (params) => apiClient.get('/financial/budgets', { params }),
  getBudgetById: (id) => apiClient.get(`/financial/budgets/${id}`),
  createBudget: (data) => apiClient.post('/financial/budgets', data),
  updateBudget: (id, data) => apiClient.put(`/financial/budgets/${id}`, data),
  updateBudgetActuals: (id) => apiClient.put(`/financial/budgets/${id}/update-actuals`),
  approveBudget: (id) => apiClient.post(`/financial/budgets/${id}/approve`),
  getBudgetSummary: (startDate, endDate) =>
    apiClient.get('/financial/budgets/summary', { params: { startDate, endDate } }),

  // Dashboard (NEW - Automated Accounting Dashboard)
  getAccountingDashboard: (startDate, endDate) =>
    apiClient.get('/financial/dashboard', { params: { startDate, endDate } }),
};

// Invoice API calls
export const invoiceAPI = {
  // Invoice Generation
  generateForReservation: (reservationId, data) =>
    apiClient.post(`/invoices/generate/reservation/${reservationId}`, data),
  createManual: (data) => apiClient.post('/invoices/manual', data),
  upload: (formData) => apiClient.post('/invoices/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),

  // Invoice Management
  getAll: (params) => apiClient.get('/invoices', { params }),
  getById: (id) => apiClient.get(`/invoices/${id}`),
  recordPayment: (id, data) => apiClient.put(`/invoices/${id}/payment`, data),
  void: (id, reason) => apiClient.put(`/invoices/${id}/void`, { reason }),
  delete: (id) => apiClient.delete(`/invoices/${id}`),

  // Invoice Actions
  download: (id) => apiClient.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  send: (id) => apiClient.post(`/invoices/${id}/send`),
};

// Message API calls
export const messageAPI = {
  getAll: (userId) => apiClient.get('/messages', { params: { userId } }),
  getConversations: (userId) => apiClient.get('/messages/conversations', { params: { userId } }),
  getConversation: (userId1, userId2) => apiClient.get('/messages/conversation', { params: { userId1, userId2 } }),
  send: (data) => apiClient.post('/messages', data),
  markAsRead: (id) => apiClient.put(`/messages/${id}/read`),
  delete: (id) => apiClient.delete(`/messages/${id}`),
};

// Calendar API calls
export const calendarAPI = {
  getAvailability: (params) => apiClient.get('/calendar/availability', { params }),
  getOverrides: () => apiClient.get('/calendar/overrides'),
  createOverride: (data) => apiClient.post('/calendar/overrides', data),
  updateOverride: (id, data) => apiClient.put(`/calendar/overrides/${id}`, data),
  deleteOverride: (id) => apiClient.delete(`/calendar/overrides/${id}`),
  
  // External calendars
  getExternalCalendars: () => apiClient.get('/calendar/external'),
  createExternalCalendar: (data) => apiClient.post('/calendar/external', data),
  syncExternalCalendar: (id) => apiClient.post(`/calendar/external/${id}/sync`),
  deleteExternalCalendar: (id) => apiClient.delete(`/calendar/external/${id}`),
};

// Pricing API calls
export const pricingAPI = {
  getAll: () => apiClient.get('/pricing'),
  getByUnit: (unitId) => apiClient.get(`/pricing/${unitId}`),
  updateBasePricing: (unitId, data) => apiClient.put(`/pricing/${unitId}/base`, data),
  
  // Seasonal rates
  getSeasonalRates: () => apiClient.get('/pricing/seasonal'),
  createSeasonalRate: (data) => apiClient.post('/pricing/seasonal', data),
  updateSeasonalRate: (id, data) => apiClient.put(`/pricing/seasonal/${id}`, data),
  deleteSeasonalRate: (id) => apiClient.delete(`/pricing/seasonal/${id}`),
  
  // Custom pricing
  getCustomPricing: (params) => apiClient.get('/pricing/custom', { params }),
  createCustomPricing: (data) => apiClient.post('/pricing/custom', data),
  deleteCustomPricing: (id) => apiClient.delete(`/pricing/custom/${id}`),
};

// Dashboard API calls
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  getKPIs: () => apiClient.get('/dashboard/kpis'),
  getChartData: (period) => apiClient.get('/dashboard/charts', { params: { period } }),
};

// Currency API calls
export const currencyAPI = {
  getRate: () => apiClient.get('/currency/rate'),
  updateRate: (rate) => apiClient.post('/currency/rate', { rate }),
};

// Authentication API calls
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
  getCurrentUser: () => apiClient.get('/auth/me'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => apiClient.post(`/auth/reset-password/${token}`, { password }),

  // 2FA endpoints
  setup2FA: () => apiClient.post('/auth/2fa/setup'),
  verifySetup2FA: (token) => apiClient.post('/auth/2fa/verify-setup', { token }),
  verify2FA: (userId, token, isBackupCode = false) =>
    apiClient.post('/auth/2fa/verify', { userId, token, isBackupCode }),
  disable2FA: (password) => apiClient.post('/auth/2fa/disable', { password }),
  regenerateBackupCodes: (password) => apiClient.post('/auth/2fa/regenerate-backup-codes', { password }),

  // Email verification
  sendVerification: () => apiClient.post('/auth/send-verification'),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email/${token}`),
  resendVerification: () => apiClient.post('/auth/resend-verification'),
};

// User Management API calls
export const userAPI = {
  getAll: (params) => apiClient.get('/users', { params }),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
  updateStatus: (id, status) => apiClient.put(`/users/${id}/status`, { status }),
};

// Guest Management API calls
export const guestAPI = {
  getAll: (params) => apiClient.get('/guests', { params }),
  getById: (id, params) => apiClient.get(`/guests/${id}`, { params }),
  create: (data) => apiClient.post('/guests', data),
  update: (id, data) => apiClient.put(`/guests/${id}`, data),
  delete: (id) => apiClient.delete(`/guests/${id}`),
  search: (query) => apiClient.get('/guests/search', { params: { q: query } }),
  getHistory: (id) => apiClient.get(`/guests/${id}/history`),
  getReservations: (id) => apiClient.get(`/guests/${id}/reservations`),
};

// Inventory Management API calls
export const inventoryAPI = {
  getAll: (params) => apiClient.get('/inventory', { params }),
  getItems: (params) => apiClient.get('/inventory/items', { params }),
  getById: (id) => apiClient.get(`/inventory/items/${id}`),
  create: (data) => apiClient.post('/inventory/items', data),
  update: (id, data) => apiClient.put(`/inventory/items/${id}`, data),
  delete: (id) => apiClient.delete(`/inventory/items/${id}`),
  getLowStock: () => apiClient.get('/inventory/low-stock'),
  getTransactions: (itemId) => apiClient.get(`/inventory/items/${itemId}/transactions`),
  createTransaction: (itemId, data) => apiClient.post(`/inventory/${itemId}/transaction`, data),
};

// Analytics API calls
export const analyticsAPI = {
  getDashboard: () => apiClient.get('/analytics/dashboard'),
  getOccupancy: (params) => apiClient.get('/analytics/occupancy', { params }),
  getRevenue: (params) => apiClient.get('/analytics/revenue', { params }),
  getGuests: () => apiClient.get('/analytics/guests'),
};

// Report API calls
export const reportAPI = {
  getFinancial: (params) => apiClient.get('/reports/financial', { params }),
  getOccupancy: (params) => apiClient.get('/reports/occupancy', { params }),
  getRevenue: (params) => apiClient.get('/reports/revenue', { params }),
  getGuests: (params) => apiClient.get('/reports/guests', { params }),
  getMonthly: (month) => apiClient.get('/reports/monthly', { params: { month } }),
  getCustom: (params) => apiClient.get('/reports/custom', { params }),
  download: (type, params) => apiClient.get(`/reports/${type}/download`, { params, responseType: 'blob' }),
};

// Export API calls
export const exportAPI = {
  exportReservationsCSV: (params) => apiClient.get('/export/reservations/csv', { params, responseType: 'blob' }),
  exportInventoryCSV: () => apiClient.get('/export/inventory/csv', { responseType: 'blob' }),
  exportFinancialCSV: (params) => apiClient.get('/export/financial/csv', { params, responseType: 'blob' }),
  exportRevenueCSV: (params) => apiClient.get('/export/revenue/csv', { params, responseType: 'blob' }),
  exportExpensesCSV: (params) => apiClient.get('/export/expenses/csv', { params, responseType: 'blob' }),
  exportProfitLossCSV: (params) => apiClient.get('/export/profit-loss/csv', { params, responseType: 'blob' }),
  exportInvoicePDF: (reservationId) => apiClient.get(`/export/invoice/${reservationId}`, { responseType: 'blob' }),
  exportReceiptPDF: (reservationId, data) => apiClient.post(`/export/receipt/${reservationId}`, data, { responseType: 'blob' }),
  exportSummaryJSON: (params) => apiClient.get('/export/summary/json', { params }),
};

// Notification API calls
export const notificationAPI = {
  getAll: (params) => apiClient.get('/notifications', { params }),
  markAsRead: (id) => apiClient.patch(`/notifications/${id}/read`),
  markAllAsRead: () => apiClient.patch('/notifications/mark-all-read'),
  delete: (id) => apiClient.delete(`/notifications/${id}`),
};

// Audit API calls
export const auditAPI = {
  getLogs: (params) => apiClient.get('/audit', { params }),
  getSummary: () => apiClient.get('/audit/summary'),
};

// Email API calls
export const emailAPI = {
  sendConfirmation: (reservationId) => apiClient.post('/email/confirmation', { reservationId }),
  sendReminder: (reservationId) => apiClient.post('/email/reminder', { reservationId }),
  sendCustom: (data) => apiClient.post('/email/custom', data),
};

// Upload API calls
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadInvoice: (file) => {
    const formData = new FormData();
    formData.append('invoice', file);
    return apiClient.post('/upload/invoice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadReceipt: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return apiClient.post('/upload/receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadMultiple: (files) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return apiClient.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  deleteFile: (type, filename) => apiClient.delete(`/upload/${type}/${filename}`),
};

// Revenue API calls
export const revenueAPI = {
  getAll: (params) => apiClient.get('/revenues', { params }),
  getById: (id) => apiClient.get(`/revenues/${id}`),
  create: (data) => apiClient.post('/revenues', data),
  update: (id, data) => apiClient.put(`/revenues/${id}`, data),
  delete: (id) => apiClient.delete(`/revenues/${id}`),
};

// Expense API calls
export const expenseAPI = {
  getAll: (params) => apiClient.get('/expenses', { params }),
  getById: (id) => apiClient.get(`/expenses/${id}`),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
};

// Setup request interceptor for auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try to refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await authAPI.refreshToken(refreshToken);
          localStorage.setItem('token', data.token);
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${data.token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE_URL };
