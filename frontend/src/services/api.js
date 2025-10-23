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
  // Dashboard and reports
  getDashboard: (period = '6months', granularity = 'monthly') => 
    apiClient.get('/financial/dashboard', { params: { period, granularity } }),
  getSummary: () => apiClient.get('/financial/summary'),
  getProfitLoss: () => apiClient.get('/financial/profit-loss'),
  getCashFlow: () => apiClient.get('/financial/cash-flow'),
  getRealtimeMetrics: () => apiClient.get('/financial/realtime-metrics'),
  
  // Revenue
  getAllRevenue: () => apiClient.get('/financial/revenue'),
  createRevenue: (data) => apiClient.post('/financial/revenue', data),
  updateRevenue: (id, data) => apiClient.put(`/financial/revenue/${id}`, data),
  deleteRevenue: (id) => apiClient.delete(`/financial/revenue/${id}`),
  
  // Expenses
  getAllExpenses: () => apiClient.get('/financial/expenses'),
  getPendingExpenses: () => apiClient.get('/financial/expenses/pending'),
  createExpense: (data) => apiClient.post('/financial/expenses', data),
  updateExpense: (id, data) => apiClient.put(`/financial/expenses/${id}`, data),
  approveExpense: (id, action, reason) => apiClient.put(`/financial/expenses/${id}/approve`, { action, reason }),
  deleteExpense: (id) => apiClient.delete(`/financial/expenses/${id}`),
  
  // Export
  exportFinancialData: (params) => apiClient.post('/financial/export', params),
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

export { API_BASE_URL };
