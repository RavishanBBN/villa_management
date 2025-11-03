# 🎯 HALCYON REST - API DOCUMENTATION

## Base URL
```
Development: http://localhost:3001/api
Production: https://yourdomain.com/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## 📍 Authentication Endpoints

### POST /auth/register
Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+94771234567",
  "role": "front_desk"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "username": "john_doe", "role": "front_desk" },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

### POST /auth/login
Login with credentials.

**Request Body:**
```json
{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "username": "admin", "role": "admin" },
    "token": "jwt_token_here",
    "refreshToken": "refresh_token_here"
  }
}
```

---

## 📍 Properties Endpoints

### GET /properties
Get all properties with dynamic pricing.

**Query Parameters:**
- `currency` (optional): LKR or USD
- `checkIn` (optional): YYYY-MM-DD
- `checkOut` (optional): YYYY-MM-DD
- `adults` (optional): number
- `children` (optional): number

**Response:**
```json
{
  "success": true,
  "data": {
    "property": "Halcyon Rest",
    "totalUnits": 2,
    "units": [
      {
        "id": "ground-floor",
        "name": "Halcyon Rest - Ground Floor",
        "type": "unit",
        "maxAdults": 4,
        "maxChildren": 3,
        "pricing": {
          "basePriceLKR": 33600,
          "basePriceUSD": 112
        },
        "amenities": ["..."],
        "status": "available"
      }
    ]
  }
}
```

---

## 📍 Reservations Endpoints

### GET /reservations
Get all reservations with filters.

**Query Parameters:**
- `status`: pending, confirmed, checked-in, checked-out, cancelled
- `paymentStatus`: not-paid, advance-payment, paid
- `unitId`: filter by property
- `from`: start date
- `to`: end date

### POST /reservations
Create a new reservation.

**Request Body:**
```json
{
  "unitId": "ground-floor",
  "guestInfo": {
    "bookerName": "John Doe",
    "email": "john@example.com",
    "phone": "+94771234567",
    "country": "Sri Lanka"
  },
  "checkIn": "2024-11-01",
  "checkOut": "2024-11-05",
  "adults": 2,
  "children": 1,
  "childrenAges": [8],
  "paymentCurrency": "USD",
  "specialRequests": "Early check-in if possible"
}
```

### PUT /reservations/:reservationId
Update reservation status.

**Request Body:**
```json
{
  "status": "confirmed",
  "paymentStatus": "paid",
  "paymentAmount": 150000
}
```

---

## 📍 Inventory Endpoints

### GET /inventory/items
Get all inventory items.

**Query Parameters:**
- `category`: housekeeping, kitchen, maintenance, amenities, office, other
- `status`: active, inactive
- `search`: search by name or SKU
- `lowStock`: true/false

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Bed Sheets (Queen)",
        "sku": "HK-BS-001",
        "category": "housekeeping",
        "currentStock": 20,
        "minStock": 8,
        "unit": "sets",
        "costPerUnit": 2500,
        "isActive": true
      }
    ]
  }
}
```

### POST /inventory/items
Create new inventory item.

**Request Body:**
```json
{
  "name": "Toilet Paper",
  "category": "housekeeping",
  "currentStock": 50,
  "minStock": 10,
  "unit": "rolls",
  "costPerUnit": 50,
  "supplierName": "Local Supplier",
  "location": "Storage Room B"
}
```

### POST /inventory/items/:id/stock-in
Add stock (purchase/restock).

**Request Body:**
```json
{
  "quantity": 20,
  "unitCost": 50,
  "supplierName": "ABC Supplies",
  "invoiceNumber": "INV-2024-001",
  "transactionDate": "2024-10-23",
  "notes": "Monthly restock"
}
```

### POST /inventory/items/:id/stock-out
Remove stock (usage).

**Request Body:**
```json
{
  "quantity": 5,
  "reason": "guest_use",
  "usedBy": "John Housekeeping",
  "propertyId": "ground-floor",
  "transactionDate": "2024-10-23",
  "notes": "Room cleaning"
}
```

---

## 📍 Financial Endpoints

### GET /financial/summary
Get financial summary for a period.

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD

**Response:**
```json
{
  "success": true,
  "data": {
    "period": { "startDate": "2024-10-01", "endDate": "2024-10-31" },
    "revenue": {
      "total": 450000,
      "totalUSD": 1500,
      "byType": {
        "accommodation": 400000,
        "services": 50000
      }
    },
    "expenses": {
      "total": 150000,
      "byCategory": {
        "utilities": 50000,
        "maintenance": 30000,
        "supplies": 70000
      }
    },
    "profit": {
      "gross": 300000,
      "margin": "66.67"
    }
  }
}
```

### POST /revenue/manual
Create manual revenue entry.

**Request Body:**
```json
{
  "type": "services",
  "description": "Laundry service",
  "amount": 5000,
  "currency": "LKR",
  "paymentMethod": "cash",
  "paymentStatus": "completed",
  "guestName": "John Doe"
}
```

### POST /expenses
Create expense entry.

**Request Body:**
```json
{
  "category": "utilities",
  "description": "Electricity bill - October",
  "amount": 25000,
  "currency": "LKR",
  "vendor": "Ceylon Electricity Board",
  "invoiceNumber": "CEB-OCT-2024",
  "invoiceFile": "/path/to/file.pdf",
  "expenseDate": "2024-10-23"
}
```

---

## 📍 Dashboard Endpoints

### GET /dashboard
Get dashboard overview.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUnits": 2,
      "activeReservations": 1,
      "monthlyReservations": 15,
      "occupancyRate": "75.0"
    },
    "todayActivities": {
      "arrivals": 2,
      "departures": 1,
      "stayOvers": 1
    },
    "revenue": {
      "monthlyLKR": 450000,
      "monthlyUSD": 1500
    }
  }
}
```

### GET /dashboard/financial
Get enhanced financial dashboard.

**Response:**
```json
{
  "success": true,
  "data": {
    "today": { "revenue": 15000, "expenses": 5000, "profit": 10000 },
    "week": { "revenue": 105000, "expenses": 35000, "profit": 70000 },
    "month": { "revenue": 450000, "expenses": 150000, "profit": 300000 },
    "trends": { "revenueGrowth": 12.5, "expenseGrowth": 8.3 }
  }
}
```

---

## 📍 Messages Endpoints

### GET /messages
Get all messages.

**Query Parameters:**
- `conversationId`: filter by conversation
- `userId`: filter by user
- `type`: staff, guest, system
- `unreadOnly`: true/false

### POST /messages
Send a new message.

**Request Body:**
```json
{
  "senderId": "staff_1",
  "senderName": "Admin",
  "receiverId": "staff_2",
  "subject": "Maintenance Required",
  "message": "Please check AC in ground floor",
  "type": "staff",
  "priority": "high"
}
```

---

## 📍 Invoice Endpoints

### GET /invoices
Get all invoices.

**Query Parameters:**
- `type`: guest_invoice, supplier_bill, receipt
- `paymentStatus`: pending, paid, overdue
- `search`: search by invoice number or customer
- `startDate`, `endDate`: filter by date range

### POST /invoices/generate/:reservationId
Generate invoice for a reservation.

**Request Body:**
```json
{
  "additionalCharges": [
    { "description": "Laundry", "amount": 5000 }
  ],
  "discount": 0,
  "notes": "Thank you for staying with us"
}
```

---

## 📍 User Management Endpoints

### GET /users
Get all users (admin only).

**Query Parameters:**
- `role`: admin, manager, front_desk, housekeeping
- `status`: active, inactive

### POST /users
Create new user (admin only).

**Request Body:**
```json
{
  "username": "staff_user",
  "email": "staff@halcyon.com",
  "password": "SecurePass123",
  "firstName": "Staff",
  "lastName": "Member",
  "role": "front_desk",
  "permissions": ["reservations", "guests"]
}
```

---

## 🔒 Role-Based Access

### Roles:
- **admin**: Full system access
- **manager**: All operations except user management
- **front_desk**: Reservations, guests, messages
- **housekeeping**: Inventory, maintenance
- **viewer**: Read-only access

### Permissions:
- `reservations`: Manage bookings
- `financial`: View/manage finances
- `inventory`: Manage inventory
- `users`: Manage users
- `reports`: Generate reports

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error 1", "Detailed error 2"],
  "timestamp": "2024-10-23T10:30:00.000Z"
}
```

### HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

---

**Last Updated:** 2024-10-23
**API Version:** 1.0.0
