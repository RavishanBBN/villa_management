#!/bin/bash

# Comprehensive Testing Suite for Halcyon Rest Management System
# This script tests EVERY endpoint, functionality, and integration

BASE_URL="http://localhost:3001"
API_URL="$BASE_URL/api"
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).log"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Test variables
TOKEN=""
USER_ID=""
GUEST_ID=""
PROPERTY_ID=""
RESERVATION_ID=""
PAYMENT_ID=""
INVENTORY_ITEM_ID=""
EXPENSE_ID=""
REVENUE_ID=""
MESSAGE_ID=""
INVOICE_ID=""

echo "======================================================================" | tee -a $RESULTS_FILE
echo "   HALCYON REST MANAGEMENT SYSTEM - COMPREHENSIVE TEST SUITE" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE
echo "Started at: $(date)" | tee -a $RESULTS_FILE
echo "Testing URL: $BASE_URL" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Function to run a test
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo "" | tee -a $RESULTS_FILE
    echo -e "${BLUE}TEST $TOTAL_TESTS: $test_name${NC}" | tee -a $RESULTS_FILE
    echo "Method: $method | Endpoint: $endpoint" | tee -a $RESULTS_FILE
    
    if [ -n "$data" ]; then
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data")
        fi
    else
        if [ -n "$TOKEN" ]; then
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint" \
                -H "Authorization: Bearer $TOKEN")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method "$endpoint")
        fi
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    echo "Status Code: $status_code" | tee -a $RESULTS_FILE
    echo "Response: $body" | jq '.' 2>/dev/null | tee -a $RESULTS_FILE || echo "$body" | tee -a $RESULTS_FILE
    
    if [ "$status_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC}" | tee -a $RESULTS_FILE
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo "$body"
    else
        echo -e "${RED}✗ FAILED - Expected $expected_status, got $status_code${NC}" | tee -a $RESULTS_FILE
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
    fi
}

# Function to extract value from JSON response
extract_json_value() {
    local json="$1"
    local key="$2"
    echo "$json" | jq -r ".$key" 2>/dev/null
}

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 1: BASIC CONNECTIVITY & SERVER HEALTH" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 1: Root endpoint
response=$(run_test "Root Endpoint - Server Info" "GET" "$BASE_URL/" "" 200)

# Test 2: API Documentation
run_test "API Documentation Access" "GET" "$BASE_URL/api-docs/" "" 200

# Test 3: Health check
run_test "Health Check Endpoint" "GET" "$API_URL/health" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 2: AUTHENTICATION & AUTHORIZATION" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 4: Register new user
register_data='{
  "username": "testadmin'$(date +%s)'",
  "email": "testadmin'$(date +%s)'@halcyonrest.com",
  "password": "TestPass123!",
  "firstName": "Test",
  "lastName": "Admin",
  "role": "admin"
}'
response=$(run_test "User Registration" "POST" "$API_URL/auth/register" "$register_data" 201)
USER_ID=$(extract_json_value "$response" "data.user.id")

# Test 5: Login
login_data='{
  "email": "testadmin'$(date +%s)'@halcyonrest.com",
  "password": "TestPass123!"
}'
response=$(run_test "User Login" "POST" "$API_URL/auth/login" "$login_data" 200)
TOKEN=$(extract_json_value "$response" "data.token")
echo "Auth Token: $TOKEN" | tee -a $RESULTS_FILE

# Test 6: Get current user profile
run_test "Get Current User Profile" "GET" "$API_URL/auth/me" "" 200

# Test 7: Update profile
update_profile='{
  "phone": "+94771234567"
}'
run_test "Update User Profile" "PUT" "$API_URL/auth/profile" "$update_profile" 200

# Test 8: Change password
change_pass='{
  "currentPassword": "TestPass123!",
  "newPassword": "NewPass123!"
}'
run_test "Change Password" "PUT" "$API_URL/auth/change-password" "$change_pass" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 3: PROPERTY MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 9: Create property
property_data='{
  "name": "Ground Floor Suite",
  "unit": "Ground Floor",
  "maxAdults": 4,
  "maxChildren": 2,
  "basePrice": 25000,
  "currency": "LKR",
  "amenities": ["WiFi", "AC", "TV", "Kitchen"],
  "description": "Beautiful ground floor suite",
  "isActive": true
}'
response=$(run_test "Create Property" "POST" "$API_URL/properties" "$property_data" 201)
PROPERTY_ID=$(extract_json_value "$response" "data.id")

# Test 10: Get all properties
run_test "Get All Properties" "GET" "$API_URL/properties" "" 200

# Test 11: Get single property
run_test "Get Property by ID" "GET" "$API_URL/properties/$PROPERTY_ID" "" 200

# Test 12: Update property
update_property='{
  "basePrice": 30000,
  "description": "Updated description"
}'
run_test "Update Property" "PUT" "$API_URL/properties/$PROPERTY_ID" "$update_property" 200

# Test 13: Check property availability
availability_params="?checkIn=2024-12-01&checkOut=2024-12-05"
run_test "Check Property Availability" "GET" "$API_URL/properties/$PROPERTY_ID/availability$availability_params" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 4: GUEST MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 14: Create guest
guest_data='{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+94771234567",
  "country": "Sri Lanka",
  "nationality": "Sri Lankan",
  "passportNumber": "N1234567",
  "dateOfBirth": "1990-01-15",
  "address": {
    "street": "123 Main St",
    "city": "Colombo",
    "country": "Sri Lanka"
  }
}'
response=$(run_test "Create Guest" "POST" "$API_URL/guests" "$guest_data" 201)
GUEST_ID=$(extract_json_value "$response" "data.id")

# Test 15: Get all guests
run_test "Get All Guests" "GET" "$API_URL/guests" "" 200

# Test 16: Get single guest
run_test "Get Guest by ID" "GET" "$API_URL/guests/$GUEST_ID" "" 200

# Test 17: Search guests
run_test "Search Guests" "GET" "$API_URL/guests?search=John" "" 200

# Test 18: Update guest
update_guest='{
  "phone": "+94779876543",
  "isVip": true
}'
run_test "Update Guest" "PUT" "$API_URL/guests/$GUEST_ID" "$update_guest" 200

# Test 19: Get guest reservations
run_test "Get Guest Reservations" "GET" "$API_URL/guests/$GUEST_ID/reservations" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 5: RESERVATION MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 20: Create reservation
reservation_data='{
  "propertyId": "'$PROPERTY_ID'",
  "guestId": "'$GUEST_ID'",
  "checkInDate": "2024-12-10",
  "checkOutDate": "2024-12-15",
  "adults": 2,
  "children": 1,
  "totalAmount": 150000,
  "currency": "LKR",
  "source": "direct",
  "specialRequests": "Late check-in requested"
}'
response=$(run_test "Create Reservation" "POST" "$API_URL/reservations" "$reservation_data" 201)
RESERVATION_ID=$(extract_json_value "$response" "data.id")

# Test 21: Get all reservations
run_test "Get All Reservations" "GET" "$API_URL/reservations" "" 200

# Test 22: Get single reservation
run_test "Get Reservation by ID" "GET" "$API_URL/reservations/$RESERVATION_ID" "" 200

# Test 23: Get reservations by date range
run_test "Get Reservations by Date Range" "GET" "$API_URL/reservations?startDate=2024-12-01&endDate=2024-12-31" "" 200

# Test 24: Update reservation
update_reservation='{
  "status": "confirmed",
  "internalNotes": "Guest confirmed via phone"
}'
run_test "Update Reservation" "PUT" "$API_URL/reservations/$RESERVATION_ID" "$update_reservation" 200

# Test 25: Check-in
checkin_data='{
  "checkedInBy": "Test Admin"
}'
run_test "Check-in Guest" "POST" "$API_URL/reservations/$RESERVATION_ID/checkin" "$checkin_data" 200

# Test 26: Get calendar view
run_test "Get Calendar View" "GET" "$API_URL/reservations/calendar?month=12&year=2024" "" 200

# Test 27: Get dashboard stats
run_test "Get Dashboard Statistics" "GET" "$API_URL/reservations/dashboard" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 6: PAYMENT MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 28: Create payment
payment_data='{
  "reservationId": "'$RESERVATION_ID'",
  "amount": 50000,
  "currency": "LKR",
  "method": "cash",
  "notes": "Advance payment received"
}'
response=$(run_test "Create Payment" "POST" "$API_URL/payments" "$payment_data" 201)
PAYMENT_ID=$(extract_json_value "$response" "data.id")

# Test 29: Get all payments
run_test "Get All Payments" "GET" "$API_URL/payments" "" 200

# Test 30: Get payment by ID
run_test "Get Payment by ID" "GET" "$API_URL/payments/$PAYMENT_ID" "" 200

# Test 31: Get payments by reservation
run_test "Get Payments for Reservation" "GET" "$API_URL/payments?reservationId=$RESERVATION_ID" "" 200

# Test 32: Update payment
update_payment='{
  "notes": "Cash payment - updated note"
}'
run_test "Update Payment" "PUT" "$API_URL/payments/$PAYMENT_ID" "$update_payment" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 7: INVENTORY MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 33: Create inventory item
inventory_data='{
  "name": "Bath Towels",
  "category": "housekeeping",
  "subcategory": "linens",
  "currentStock": 50,
  "minStock": 20,
  "unit": "pieces",
  "costPerUnit": 500,
  "supplierName": "Linen Suppliers Ltd"
}'
response=$(run_test "Create Inventory Item" "POST" "$API_URL/inventory" "$inventory_data" 201)
INVENTORY_ITEM_ID=$(extract_json_value "$response" "data.id")

# Test 34: Get all inventory items
run_test "Get All Inventory Items" "GET" "$API_URL/inventory" "" 200

# Test 35: Get inventory item by ID
run_test "Get Inventory Item by ID" "GET" "$API_URL/inventory/$INVENTORY_ITEM_ID" "" 200

# Test 36: Update inventory
update_inventory='{
  "currentStock": 45,
  "notes": "Used 5 towels"
}'
run_test "Update Inventory Item" "PUT" "$API_URL/inventory/$INVENTORY_ITEM_ID" "$update_inventory" 200

# Test 37: Get low stock items
run_test "Get Low Stock Items" "GET" "$API_URL/inventory/low-stock" "" 200

# Test 38: Get inventory by category
run_test "Get Inventory by Category" "GET" "$API_URL/inventory?category=housekeeping" "" 200

# Test 39: Stock in transaction
stock_in_data='{
  "inventoryItemId": "'$INVENTORY_ITEM_ID'",
  "transactionType": "stock_in",
  "quantity": 20,
  "unitCost": 500,
  "supplierName": "Linen Suppliers Ltd",
  "invoiceNumber": "INV-2024-001",
  "reason": "Regular restocking"
}'
run_test "Stock In Transaction" "POST" "$API_URL/inventory/transactions" "$stock_in_data" 201

# Test 40: Get stock transactions
run_test "Get Stock Transactions" "GET" "$API_URL/inventory/transactions" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 8: FINANCIAL MANAGEMENT - EXPENSES" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 41: Create expense
expense_data='{
  "category": "utilities",
  "subcategory": "electricity",
  "description": "Monthly electricity bill",
  "amount": 15000,
  "currency": "LKR",
  "expenseDate": "2024-11-01",
  "vendor": "Ceylon Electricity Board",
  "invoiceNumber": "EB-2024-11-001",
  "invoiceFile": "/uploads/invoices/eb-invoice.pdf",
  "paymentMethod": "bank_transfer"
}'
response=$(run_test "Create Expense" "POST" "$API_URL/expenses" "$expense_data" 201)
EXPENSE_ID=$(extract_json_value "$response" "data.id")

# Test 42: Get all expenses
run_test "Get All Expenses" "GET" "$API_URL/expenses" "" 200

# Test 43: Get expense by ID
run_test "Get Expense by ID" "GET" "$API_URL/expenses/$EXPENSE_ID" "" 200

# Test 44: Get expenses by category
run_test "Get Expenses by Category" "GET" "$API_URL/expenses?category=utilities" "" 200

# Test 45: Get expenses by date range
run_test "Get Expenses by Date Range" "GET" "$API_URL/expenses?startDate=2024-11-01&endDate=2024-11-30" "" 200

# Test 46: Update expense
update_expense='{
  "status": "approved",
  "approvedBy": "Admin",
  "notes": "Approved for payment"
}'
run_test "Update Expense" "PUT" "$API_URL/expenses/$EXPENSE_ID" "$update_expense" 200

# Test 47: Get expense statistics
run_test "Get Expense Statistics" "GET" "$API_URL/expenses/stats?year=2024&month=11" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 9: FINANCIAL MANAGEMENT - REVENUES" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 48: Create revenue
revenue_data='{
  "type": "accommodation",
  "source": "reservation",
  "sourceId": "'$RESERVATION_ID'",
  "description": "Room booking revenue",
  "amount": 150000,
  "currency": "LKR",
  "date": "2024-12-10",
  "paymentMethod": "cash",
  "guestName": "John Doe"
}'
response=$(run_test "Create Revenue" "POST" "$API_URL/revenues" "$revenue_data" 201)
REVENUE_ID=$(extract_json_value "$response" "data.id")

# Test 49: Get all revenues
run_test "Get All Revenues" "GET" "$API_URL/revenues" "" 200

# Test 50: Get revenue by ID
run_test "Get Revenue by ID" "GET" "$API_URL/revenues/$REVENUE_ID" "" 200

# Test 51: Get revenues by date range
run_test "Get Revenues by Date Range" "GET" "$API_URL/revenues?startDate=2024-12-01&endDate=2024-12-31" "" 200

# Test 52: Get revenue statistics
run_test "Get Revenue Statistics" "GET" "$API_URL/revenues/stats?year=2024&month=12" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 10: FINANCIAL REPORTS" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 53: Get profit/loss report
run_test "Get Profit/Loss Report" "GET" "$API_URL/reports/profit-loss?year=2024&month=11" "" 200

# Test 54: Get cash flow report
run_test "Get Cash Flow Report" "GET" "$API_URL/reports/cash-flow?year=2024" "" 200

# Test 55: Get revenue by category
run_test "Get Revenue by Category Report" "GET" "$API_URL/reports/revenue-by-category?year=2024" "" 200

# Test 56: Get expense by category
run_test "Get Expense by Category Report" "GET" "$API_URL/reports/expense-by-category?year=2024" "" 200

# Test 57: Get occupancy report
run_test "Get Occupancy Report" "GET" "$API_URL/reports/occupancy?year=2024&month=12" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 11: MESSAGING SYSTEM" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 58: Send message
message_data='{
  "conversationId": "conv-'$(date +%s)'",
  "receiverId": "'$USER_ID'",
  "subject": "Test Message",
  "message": "This is a test message",
  "type": "staff",
  "priority": "normal"
}'
response=$(run_test "Send Message" "POST" "$API_URL/messages" "$message_data" 201)
MESSAGE_ID=$(extract_json_value "$response" "data.id")

# Test 59: Get all messages
run_test "Get All Messages" "GET" "$API_URL/messages" "" 200

# Test 60: Get message by ID
run_test "Get Message by ID" "GET" "$API_URL/messages/$MESSAGE_ID" "" 200

# Test 61: Mark message as read
run_test "Mark Message as Read" "PUT" "$API_URL/messages/$MESSAGE_ID/read" "" 200

# Test 62: Get unread messages
run_test "Get Unread Messages" "GET" "$API_URL/messages/unread" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 12: INVOICE MANAGEMENT" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 63: Create invoice
invoice_data='{
  "type": "guest_invoice",
  "reservationId": "'$RESERVATION_ID'",
  "issueDate": "2024-12-10",
  "dueDate": "2024-12-15",
  "issuedTo": "John Doe",
  "issuedToEmail": "john.doe@example.com",
  "issuedFrom": "Halcyon Rest",
  "subtotal": 150000,
  "taxAmount": 0,
  "total": 150000,
  "currency": "LKR",
  "lineItems": [
    {
      "description": "Room rental - 5 nights",
      "quantity": 5,
      "unitPrice": 30000,
      "total": 150000
    }
  ]
}'
response=$(run_test "Create Invoice" "POST" "$API_URL/invoices" "$invoice_data" 201)
INVOICE_ID=$(extract_json_value "$response" "data.id")

# Test 64: Get all invoices
run_test "Get All Invoices" "GET" "$API_URL/invoices" "" 200

# Test 65: Get invoice by ID
run_test "Get Invoice by ID" "GET" "$API_URL/invoices/$INVOICE_ID" "" 200

# Test 66: Update invoice
update_invoice='{
  "paymentStatus": "paid",
  "paidAmount": 150000
}'
run_test "Update Invoice" "PUT" "$API_URL/invoices/$INVOICE_ID" "$update_invoice" 200

# Test 67: Generate invoice PDF
run_test "Generate Invoice PDF" "GET" "$API_URL/invoices/$INVOICE_ID/pdf" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 13: USER MANAGEMENT (Admin)" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 68: Get all users
run_test "Get All Users (Admin)" "GET" "$API_URL/users" "" 200

# Test 69: Get user by ID
run_test "Get User by ID (Admin)" "GET" "$API_URL/users/$USER_ID" "" 200

# Test 70: Update user role
update_user='{
  "role": "manager"
}'
run_test "Update User Role (Admin)" "PUT" "$API_URL/users/$USER_ID" "$update_user" 200

# Test 71: Get user activity logs
run_test "Get User Activity Logs" "GET" "$API_URL/users/$USER_ID/activity" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 14: FILE UPLOAD FUNCTIONALITY" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 72: Upload invoice file
echo "Test invoice content" > /tmp/test-invoice.txt
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/upload/invoice" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/test-invoice.txt")
status_code=$(echo "$response" | tail -n1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED - Upload Invoice File${NC}" | tee -a $RESULTS_FILE
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED - Upload Invoice File (Status: $status_code)${NC}" | tee -a $RESULTS_FILE
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# Test 73: Upload receipt file
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/upload/receipt" \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@/tmp/test-invoice.txt")
status_code=$(echo "$response" | tail -n1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$status_code" -eq 200 ]; then
    echo -e "${GREEN}✓ PASSED - Upload Receipt File${NC}" | tee -a $RESULTS_FILE
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}✗ FAILED - Upload Receipt File (Status: $status_code)${NC}" | tee -a $RESULTS_FILE
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 15: ADVANCED QUERIES & FILTERS" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 74: Complex reservation filters
run_test "Filter Reservations - Multiple Params" "GET" "$API_URL/reservations?status=confirmed&source=direct&limit=10&page=1" "" 200

# Test 75: Sort and pagination
run_test "Get Guests with Sorting & Pagination" "GET" "$API_URL/guests?sortBy=createdAt&order=desc&limit=5&page=1" "" 200

# Test 76: Search across multiple fields
run_test "Search Guests by Email" "GET" "$API_URL/guests?email=john" "" 200

# Test 77: Date range filtering
run_test "Filter Payments by Date Range" "GET" "$API_URL/payments?startDate=2024-11-01&endDate=2024-12-31" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 16: ERROR HANDLING & EDGE CASES" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 78: Invalid endpoint (404)
run_test "Access Invalid Endpoint (404)" "GET" "$API_URL/nonexistent" "" 404

# Test 79: Unauthorized access (401)
OLD_TOKEN=$TOKEN
TOKEN=""
run_test "Unauthorized Access (401)" "GET" "$API_URL/users" "" 401
TOKEN=$OLD_TOKEN

# Test 80: Invalid data format (400)
invalid_data='{"invalid": "data"}'
run_test "Invalid Property Data (400)" "POST" "$API_URL/properties" "$invalid_data" 400

# Test 81: Duplicate email (409)
run_test "Duplicate User Registration (409)" "POST" "$API_URL/auth/register" "$register_data" 409

# Test 82: Non-existent resource (404)
run_test "Get Non-existent Guest (404)" "GET" "$API_URL/guests/99999999-9999-9999-9999-999999999999" "" 404

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 17: BUSINESS LOGIC VALIDATION" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 83: Overlapping reservations
overlap_reservation='{
  "propertyId": "'$PROPERTY_ID'",
  "guestId": "'$GUEST_ID'",
  "checkInDate": "2024-12-12",
  "checkOutDate": "2024-12-14",
  "adults": 2,
  "totalAmount": 60000
}'
run_test "Create Overlapping Reservation (Should Fail)" "POST" "$API_URL/reservations" "$overlap_reservation" 409

# Test 84: Invalid date range
invalid_dates='{
  "propertyId": "'$PROPERTY_ID'",
  "guestId": "'$GUEST_ID'",
  "checkInDate": "2024-12-20",
  "checkOutDate": "2024-12-18",
  "adults": 2,
  "totalAmount": 60000
}'
run_test "Create Reservation with Invalid Dates (Should Fail)" "POST" "$API_URL/reservations" "$invalid_dates" 400

# Test 85: Exceed max guests
exceed_guests='{
  "propertyId": "'$PROPERTY_ID'",
  "guestId": "'$GUEST_ID'",
  "checkInDate": "2025-01-10",
  "checkOutDate": "2025-01-15",
  "adults": 10,
  "children": 5,
  "totalAmount": 150000
}'
run_test "Exceed Maximum Guests (Should Fail)" "POST" "$API_URL/reservations" "$exceed_guests" 400

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 18: DATA INTEGRITY & RELATIONSHIPS" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 86: Get reservation with guest and property details
run_test "Get Reservation with Relations" "GET" "$API_URL/reservations/$RESERVATION_ID?include=guest,property,payments" "" 200

# Test 87: Get guest with all reservations
run_test "Get Guest with All Reservations" "GET" "$API_URL/guests/$GUEST_ID?include=reservations" "" 200

# Test 88: Get property with current reservations
run_test "Get Property with Current Reservations" "GET" "$API_URL/properties/$PROPERTY_ID?include=reservations" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 19: EXPORT & REPORTING" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 89: Export reservations to CSV
run_test "Export Reservations to CSV" "GET" "$API_URL/exports/reservations?format=csv&startDate=2024-12-01&endDate=2024-12-31" "" 200

# Test 90: Export financial report
run_test "Export Financial Report" "GET" "$API_URL/exports/financial?year=2024&month=11&format=pdf" "" 200

# Test 91: Export guest list
run_test "Export Guest List" "GET" "$API_URL/exports/guests?format=csv" "" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "PHASE 20: CLEANUP & DELETION TESTS" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

# Test 92: Delete message
run_test "Delete Message" "DELETE" "$API_URL/messages/$MESSAGE_ID" "" 200

# Test 93: Cancel reservation
cancel_data='{
  "cancellationReason": "Guest requested cancellation"
}'
run_test "Cancel Reservation" "POST" "$API_URL/reservations/$RESERVATION_ID/cancel" "$cancel_data" 200

# Test 94: Soft delete guest
run_test "Soft Delete Guest" "DELETE" "$API_URL/guests/$GUEST_ID" "" 200

# Test 95: Deactivate property
deactivate_prop='{
  "isActive": false
}'
run_test "Deactivate Property" "PUT" "$API_URL/properties/$PROPERTY_ID" "$deactivate_prop" 200

echo ""
echo "======================================================================" | tee -a $RESULTS_FILE
echo "FINAL TEST SUMMARY" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE
echo "Total Tests Run: $TOTAL_TESTS" | tee -a $RESULTS_FILE
echo -e "${GREEN}Tests Passed: $PASSED_TESTS${NC}" | tee -a $RESULTS_FILE
echo -e "${RED}Tests Failed: $FAILED_TESTS${NC}" | tee -a $RESULTS_FILE
echo "" | tee -a $RESULTS_FILE

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓✓✓ ALL TESTS PASSED! ✓✓✓${NC}" | tee -a $RESULTS_FILE
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}Success Rate: $SUCCESS_RATE%${NC}" | tee -a $RESULTS_FILE
fi

echo "" | tee -a $RESULTS_FILE
echo "Completed at: $(date)" | tee -a $RESULTS_FILE
echo "Results saved to: $RESULTS_FILE" | tee -a $RESULTS_FILE
echo "======================================================================" | tee -a $RESULTS_FILE

exit $FAILED_TESTS
