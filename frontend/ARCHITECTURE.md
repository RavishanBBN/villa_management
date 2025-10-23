# Villa Management System - Frontend Architecture

## 📐 Architecture Overview

The application has been refactored from a **monolithic 9,150-line App.js** into a **modular, maintainable architecture** using:

- **Custom Hooks** for data management and business logic
- **Context API** for global state management
- **Service Layer** for API communication
- **Utility Functions** for reusable formatting and validation
- **Component-based UI** for better organization

---

## 🗂️ Project Structure

```
frontend/src/
├── components/
│   ├── tabs/               # Tab-specific components
│   │   ├── Dashboard.js
│   │   ├── Properties.js
│   │   ├── Reservations.js
│   │   ├── Financial.js
│   │   ├── Calendar.js
│   │   ├── Pricing.js
│   │   └── Messages.js
│   ├── modals/             # Modal components
│   │   ├── BookingModal.js
│   │   ├── ExpenseModal.js
│   │   ├── RevenueModal.js
│   │   ├── MessageModal.js
│   │   └── AvailabilityModal.js
│   ├── LoadingScreen.js
│   └── ProfessionalBackground.js
├── context/
│   └── AppContext.js       # Global state management
├── hooks/
│   ├── useProperties.js    # Properties data & operations
│   ├── useReservations.js  # Reservations data & operations
│   ├── useFinancial.js     # Financial data & operations
│   ├── useMessages.js      # Messages data & operations
│   └── useDashboard.js     # Dashboard data
├── services/
│   └── api.js              # All API calls organized by domain
├── utils/
│   ├── formatters.js       # Currency, date, number formatting
│   ├── validators.js       # Form validation functions
│   └── chartConfig.js      # Chart.js configuration
├── styles/
│   ├── App.css
│   ├── ProfessionalStyles.css
│   ├── Animations.css
│   └── ResponsiveDesign.css
├── App.js                  # Main application entry
└── index.js                # React DOM entry
```

---

## 🎯 Key Design Patterns

### 1. **Custom Hooks Pattern**

Each domain has its own hook that manages state and operations:

```javascript
// Example: useProperties.js
export const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const loadProperties = useCallback(async () => {
    // Load data from API
  }, []);
  
  return { properties, loading, loadProperties };
};
```

**Benefits:**
- Separation of concerns
- Reusable business logic
- Easy testing
- Clear data flow

### 2. **Service Layer Pattern**

All API calls are centralized in `services/api.js`:

```javascript
export const reservationAPI = {
  getAll: () => apiClient.get('/reservations'),
  create: (data) => apiClient.post('/reservations', data),
  update: (id, data) => apiClient.put(`/reservations/${id}`, data),
  delete: (id) => apiClient.delete(`/reservations/${id}`),
};
```

**Benefits:**
- Single source of truth for API endpoints
- Easy to mock for testing
- Consistent error handling
- Simple to update API URLs

### 3. **Context API for Global State**

```javascript
<AppProvider>
  <AppContent />
</AppProvider>
```

**Global state includes:**
- Active tab
- Currency rate
- Loading states
- Error/success messages
- Current user

### 4. **Utility Functions**

Reusable functions for common operations:

```javascript
// formatters.js
export const formatCurrency = (amount, currency = 'LKR') => { };
export const formatDate = (dateString) => { };

// validators.js
export const validateBookingForm = (form) => { };
export const validateEmail = (email) => { };
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                    App Component                     │
│              (with AppProvider context)              │
└──────────────────┬──────────────────────────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
   Properties  Reservations Financial
   Component   Component    Component
       │           │           │
       │           │           │
       ▼           ▼           ▼
   useProperties useReservations useFinancial
       │           │           │
       │           │           │
       ▼           ▼           ▼
   ┌────────────────────────────────┐
   │      services/api.js            │
   │  (Centralized API calls)        │
   └────────────────┬───────────────┘
                    │
                    ▼
             Backend API
```

---

## 🛠️ Custom Hooks API

### useProperties()

```javascript
const {
  properties,          // Array of all properties
  loading,             // Loading state
  error,               // Error message
  loadProperties,      // Fetch all properties
  getPropertyById,     // Get single property
  createProperty,      // Create new property
  updateProperty,      // Update existing property
  deleteProperty,      // Delete property
} = useProperties();
```

### useReservations()

```javascript
const {
  reservations,              // Array of all reservations
  loading,                   // Loading state
  loadReservations,          // Fetch all reservations
  checkAvailability,         // Check property availability
  calculatePricing,          // Calculate reservation pricing
  createReservation,         // Create new reservation
  updateReservation,         // Update reservation
  updateReservationStatus,   // Change reservation status
  getReservationStats,       // Get statistics
} = useReservations();
```

### useFinancial()

```javascript
const {
  revenue,                    // Revenue array
  expenses,                   // Expenses array
  pendingExpenses,            // Pending expenses
  comprehensiveDashboard,     // Dashboard data
  realtimeMetrics,            // Real-time metrics
  loading,                    // Loading state
  loadRevenue,                // Fetch revenue
  loadExpenses,               // Fetch expenses
  createRevenue,              // Add revenue
  createExpense,              // Add expense
  approveExpense,             // Approve/reject expense
  refreshAllFinancialData,    // Refresh all data
  exportFinancialData,        // Export to CSV/Excel
} = useFinancial();
```

### useMessages()

```javascript
const {
  messages,              // All messages
  conversations,         // Conversation list
  loading,               // Loading state
  loadMessages,          // Fetch messages
  sendMessage,           // Send new message
  markAsRead,            // Mark message as read
  getUnreadCount,        // Get unread count
} = useMessages();
```

---

## 🎨 Component Guidelines

### Tab Components

Each tab should:
1. Import necessary hooks
2. Handle its own state
3. Use utility functions for formatting
4. Keep JSX clean and readable

```javascript
// Example: Dashboard.js
import React from 'react';
import { useDashboard } from '../../hooks/useDashboard';
import { formatCurrency } from '../../utils/formatters';

export const Dashboard = () => {
  const { dashboardData, loading } = useDashboard();
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="dashboard">
      {/* Dashboard content */}
    </div>
  );
};
```

### Modal Components

Modals should:
1. Accept props for show/hide
2. Handle form validation
3. Use appropriate hooks for data operations
4. Show loading states

```javascript
// Example: BookingModal.js
export const BookingModal = ({ show, onClose, onSuccess }) => {
  const { createReservation } = useReservations();
  
  const handleSubmit = async (formData) => {
    const result = await createReservation(formData);
    if (result.success) {
      onSuccess();
      onClose();
    }
  };
  
  // Modal JSX
};
```

---

## 🚀 Migration Guide

### From Old App.js to New Architecture

1. **State Management:**
   - Old: `const [properties, setProperties] = useState([])`
   - New: `const { properties } = useProperties()`

2. **API Calls:**
   - Old: `axios.get('http://localhost:3001/api/properties')`
   - New: `propertyAPI.getAll()`

3. **Formatting:**
   - Old: Inline formatting logic
   - New: `formatCurrency(amount, 'LKR')`

4. **Validation:**
   - Old: Inline validation
   - New: `validateBookingForm(formData)`

---

## ✅ Benefits of New Architecture

### Maintainability
- **9,150 lines → ~500 lines** per file
- Clear separation of concerns
- Easy to locate and fix bugs

### Testability
- Each hook can be tested independently
- Service layer can be mocked
- Utility functions are pure functions

### Scalability
- Easy to add new features
- Reusable components and hooks
- No prop drilling with Context API

### Developer Experience
- Better code organization
- Clear file structure
- Easier onboarding for new developers

### Performance
- Better code splitting opportunities
- Optimized re-renders with proper memoization
- Lazy loading for tab components

---

## 📝 Next Steps

1. **Complete Tab Components:** Create Dashboard, Properties, Reservations, etc.
2. **Complete Modal Components:** Create all modal components
3. **Add Calendar Hook:** Create `useCalendar.js` and `usePricing.js`
4. **Implement Charts:** Extract chart components with Chart.js
5. **Add Tests:** Unit tests for hooks and utilities
6. **Documentation:** Component-level documentation

---

## 🔧 Usage Example

```javascript
import React from 'react';
import { AppProvider } from './context/AppContext';
import { useReservations } from './hooks/useReservations';
import { useFinancial } from './hooks/useFinancial';
import { formatCurrency, formatDate } from './utils/formatters';
import { validateBookingForm } from './utils/validators';

function ReservationsPage() {
  const { 
    reservations, 
    createReservation, 
    loading 
  } = useReservations();
  
  const { revenue } = useFinancial();
  
  const handleCreateBooking = async (formData) => {
    // Validate
    const { isValid, errors } = validateBookingForm(formData);
    if (!isValid) {
      console.error(errors);
      return;
    }
    
    // Create
    const result = await createReservation(formData);
    if (result.success) {
      console.log('Booking created!');
    }
  };
  
  return (
    <div>
      {reservations.map(r => (
        <div key={r.id}>
          <h3>{r.guestInfo.bookerName}</h3>
          <p>{formatDate(r.checkIn)} - {formatDate(r.checkOut)}</p>
          <p>{formatCurrency(r.pricing.totalLKR, 'LKR')}</p>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <ReservationsPage />
    </AppProvider>
  );
}

export default App;
```

---

## 🎓 Learning Resources

- **React Hooks:** https://react.dev/reference/react
- **Context API:** https://react.dev/reference/react/useContext
- **Chart.js:** https://www.chartjs.org/docs/
- **Axios:** https://axios-http.com/docs/intro

---

## 📞 Support

For questions or issues with the new architecture:
1. Check this documentation
2. Review example components
3. Check console logs for debugging
4. Test hooks independently

---

**Last Updated:** October 2025
**Version:** 2.0.0 - Modular Architecture
