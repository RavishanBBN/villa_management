/**
 * Data Storage Service
 * In-memory data storage (will be replaced with database later)
 */

class DataStore {
  constructor() {
    // Reservations
    this.reservations = [];
    
    // Guests
    this.guests = [];
    
    // Messages
    this.messages = [];
    
    // Inventory
    this.inventory = [
      { id: 1, item: 'Bed Sheets', category: 'housekeeping', currentStock: 20, minStock: 5, unit: 'sets' },
      { id: 2, item: 'Towels', category: 'housekeeping', currentStock: 15, minStock: 8, unit: 'pieces' },
      { id: 3, item: 'Toilet Paper', category: 'housekeeping', currentStock: 30, minStock: 10, unit: 'rolls' },
      { id: 4, item: 'Cleaning Supplies', category: 'housekeeping', currentStock: 5, minStock: 3, unit: 'bottles' },
      { id: 5, item: 'Coffee', category: 'kitchen', currentStock: 3, minStock: 2, unit: 'kg' },
      { id: 6, item: 'Tea Bags', category: 'kitchen', currentStock: 100, minStock: 20, unit: 'pieces' }
    ];
    
    // Revenue entries
    this.revenueEntries = [
      {
        id: 'rev_sample_001',
        type: 'accommodation',
        source: 'reservation',
        sourceId: null,
        description: 'Sample accommodation revenue',
        amount: 90000,
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
    
    // Financial expenses
    this.financialExpenses = [
      {
        id: 'exp_sample_001',
        category: 'utilities',
        subcategory: 'electricity',
        description: 'Monthly electricity bill - December 2024',
        amount: 25000,
        amountUSD: 83.33,
        currency: 'LKR',
        expenseDate: '2024-12-15',
        paymentMethod: 'bank_transfer',
        vendor: 'Ceylon Electricity Board',
        invoiceNumber: 'CEB_DEC_2024_001',
        invoiceFile: '/uploads/invoices/sample_electricity.pdf',
        receiptFile: null,
        approvedBy: 'staff_1',
        approvedDate: '2024-12-15T09:00:00Z',
        status: 'approved',
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
        invoiceFile: '/uploads/invoices/sample_plumbing.pdf',
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
    
    // Financial invoices
    this.financialInvoices = [];
    
    // Financial periods
    this.financialPeriods = [];
    
    // Calendar overrides
    this.calendarOverrides = [];
    
    // External calendars
    this.externalCalendars = [];
    
    // Seasonal rates
    this.seasonalRates = [];
    
    // Staff
    this.staff = [
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
    
    // Notifications
    this.notifications = [];
    
    // Pricing data
    this.pricingData = {
      units: [
        {
          id: 'ground-floor',
          name: 'Halcyon Rest - Ground Floor',
          lastUpdated: new Date().toISOString(),
          priceRangeUSD: { min: 104, max: 122 },
          basePricing: {
            guest1: { USD: 104, LKR: Math.round(104 * 300) },
            guest2: { USD: 112, LKR: Math.round(112 * 300) },
            guest3: { USD: 122, LKR: Math.round(122 * 300) },
            guest4: { USD: 122, LKR: Math.round(122 * 300) }
          }
        },
        {
          id: 'first-floor',
          name: 'Halcyon Rest - First Floor',
          lastUpdated: new Date().toISOString(),
          priceRangeUSD: { min: 102, max: 120 },
          basePricing: {
            guest1: { USD: 102, LKR: Math.round(102 * 300) },
            guest2: { USD: 110, LKR: Math.round(110 * 300) },
            guest3: { USD: 120, LKR: Math.round(120 * 300) },
            guest4: { USD: 120, LKR: Math.round(120 * 300) }
          }
        }
      ]
    };
  }

  // Initialize and fix existing data
  initializeFinancialData() {
    console.log('🔧 Initializing financial data...');
    
    this.revenueEntries.forEach((entry) => {
      entry.amount = parseFloat(entry.amount) || 0;
      entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / 300;
      entry.exchangeRate = parseFloat(entry.exchangeRate) || 300;
      
      if (!entry.id) entry.id = 'rev_' + Date.now();
      if (!entry.date) entry.date = new Date().toISOString().split('T')[0];
      if (!entry.paymentStatus) entry.paymentStatus = 'completed';
      if (!entry.currency) entry.currency = 'LKR';
    });
    
    this.financialExpenses.forEach((entry) => {
      entry.amount = parseFloat(entry.amount) || 0;
      entry.amountUSD = parseFloat(entry.amountUSD) || entry.amount / 300;
      
      if (!entry.id) entry.id = 'exp_' + Date.now();
      if (!entry.expenseDate) entry.expenseDate = new Date().toISOString().split('T')[0];
      if (!entry.status) entry.status = 'pending';
    });
    
    console.log(`✅ Fixed ${this.revenueEntries.length} revenue entries and ${this.financialExpenses.length} expense entries`);
  }
}

module.exports = new DataStore();
