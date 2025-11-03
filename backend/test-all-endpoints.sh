#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001/api"
TOKEN=""

echo -e "${BLUE}=== Villa Management System - Complete API Test ===${NC}\n"

# Test 1: Health Check
echo -e "${BLUE}1. Testing Health Check...${NC}"
curl -s "$BASE_URL/../" | head -n 5
echo -e "\n"

# Test 2: Authentication - Login
echo -e "${BLUE}2. Testing Authentication - Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123"
  }')
echo "$LOGIN_RESPONSE" | head -n 10

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✓ Login successful, token obtained${NC}\n"
else
  echo -e "${RED}✗ Login failed${NC}\n"
  exit 1
fi

# Test 3: Properties
echo -e "${BLUE}3. Testing Properties Endpoint...${NC}"
curl -s -X GET "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 4: Create Property
echo -e "${BLUE}4. Testing Create Property...${NC}"
PROPERTY_RESPONSE=$(curl -s -X POST "$BASE_URL/properties" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ground Floor Unit",
    "type": "villa_unit",
    "maxGuests": 6,
    "amenities": ["WiFi", "Air Conditioning", "Kitchen"],
    "basePrice": 15000,
    "status": "available"
  }')
echo "$PROPERTY_RESPONSE" | head -n 15
echo -e "\n"

PROPERTY_ID=$(echo "$PROPERTY_RESPONSE" | grep -o '"_id":"[^"]*' | head -n 1 | cut -d'"' -f4)

# Test 5: Reservations - Get All
echo -e "${BLUE}5. Testing Get All Reservations...${NC}"
curl -s -X GET "$BASE_URL/reservations" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 6: Create Reservation
echo -e "${BLUE}6. Testing Create Reservation...${NC}"
TOMORROW=$(date -d "+1 day" +%Y-%m-%d)
NEXT_WEEK=$(date -d "+7 days" +%Y-%m-%d)

RESERVATION_RESPONSE=$(curl -s -X POST "$BASE_URL/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"propertyId\": \"ground-floor\",
    \"guestInfo\": {
      \"bookerName\": \"John Doe\",
      \"email\": \"john.doe@example.com\",
      \"phone\": \"+94771234567\",
      \"nationality\": \"USA\"
    },
    \"checkIn\": \"$TOMORROW\",
    \"checkOut\": \"$NEXT_WEEK\",
    \"adults\": 2,
    \"children\": 1,
    \"totalAmount\": 90000,
    \"currency\": \"LKR\"
  }")
echo "$RESERVATION_RESPONSE" | head -n 20
echo -e "\n"

RESERVATION_ID=$(echo "$RESERVATION_RESPONSE" | grep -o '"_id":"[^"]*' | head -n 1 | cut -d'"' -f4)

# Test 7: Financial - Revenue
echo -e "${BLUE}7. Testing Financial - Get Revenue...${NC}"
curl -s -X GET "$BASE_URL/financial/revenue" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Test 8: Create Revenue Entry
echo -e "${BLUE}8. Testing Create Revenue Entry...${NC}"
curl -s -X POST "$BASE_URL/revenues" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "services",
    "source": "manual",
    "date": "'$(date +%Y-%m-%d)'",
    "amount": 50000,
    "description": "Tour booking commission",
    "currency": "LKR"
  }' | head -n 15
echo -e "\n"

# Test 9: Financial - Expenses
echo -e "${BLUE}9. Testing Financial - Get Expenses...${NC}"
curl -s -X GET "$BASE_URL/financial/expenses" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Test 10: Create Expense Entry
echo -e "${BLUE}10. Testing Create Expense Entry...${NC}"
curl -s -X POST "$BASE_URL/expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "expenseDate": "'$(date +%Y-%m-%d)'",
    "amount": 25000,
    "currency": "LKR",
    "category": "maintenance",
    "description": "Pool cleaning supplies",
    "vendor": "Cleaning Supplies Ltd",
    "invoiceNumber": "INV-'$(date +%Y%m%d)'",
    "invoiceFile": "/uploads/invoices/test_invoice.pdf"
  }' | head -n 15
echo -e "\n"

# Test 11: Financial Summary
echo -e "${BLUE}11. Testing Financial Summary...${NC}"
START_DATE=$(date -d "-30 days" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)
curl -s -X GET "$BASE_URL/financial/summary?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 12: Inventory - Get All Items
echo -e "${BLUE}12. Testing Inventory - Get All Items...${NC}"
curl -s -X GET "$BASE_URL/inventory" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 13: Create Inventory Item
echo -e "${BLUE}13. Testing Create Inventory Item...${NC}"
ITEM_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory/items" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bath Towels",
    "category": "housekeeping",
    "unit": "pieces",
    "currentStock": 50,
    "minStock": 20,
    "sku": "TOW-001",
    "costPerUnit": 500,
    "supplierName": "Linen Supplies Ltd"
  }')
echo "$ITEM_RESPONSE" | head -n 15
echo -e "\n"

ITEM_ID=$(echo "$ITEM_RESPONSE" | grep -o '"_id":"[^"]*' | head -n 1 | cut -d'"' -f4)

# Test 14: Inventory - Low Stock Check
echo -e "${BLUE}14. Testing Inventory - Low Stock Check...${NC}"
curl -s -X GET "$BASE_URL/inventory/low-stock" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Test 15: Analytics - Dashboard
echo -e "${BLUE}15. Testing Analytics - Dashboard...${NC}"
curl -s -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" | head -n 25
echo -e "\n"

# Test 16: Analytics - Occupancy Rate
echo -e "${BLUE}16. Testing Analytics - Occupancy Rate...${NC}"
curl -s -X GET "$BASE_URL/analytics/occupancy?startDate=$START_DATE&endDate=$END_DATE" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Test 17: Users - Get All
echo -e "${BLUE}17. Testing Users - Get All...${NC}"
curl -s -X GET "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 18: Create User
echo -e "${BLUE}18. Testing Create User...${NC}"
curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "teststaff",
    "email": "staff@halcyonrest.com",
    "password": "Staff@123",
    "role": "front_desk",
    "firstName": "Test",
    "lastName": "Staff"
  }' | head -n 15
echo -e "\n"

# Test 19: Notifications - Get All
echo -e "${BLUE}19. Testing Notifications - Get All...${NC}"
curl -s -X GET "$BASE_URL/notifications" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Test 20: Audit Logs
echo -e "${BLUE}20. Testing Audit Logs...${NC}"
curl -s -X GET "$BASE_URL/audit" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 21: Export - Reservations CSV
echo -e "${BLUE}21. Testing Export - Reservations CSV...${NC}"
curl -s -X GET "$BASE_URL/export/reservations/csv" \
  -H "Authorization: Bearer $TOKEN" \
  --output /tmp/reservations-test.csv
if [ -f /tmp/reservations-test.csv ]; then
  echo -e "${GREEN}✓ CSV file created successfully${NC}"
  head -n 5 /tmp/reservations-test.csv
  rm /tmp/reservations-test.csv
else
  echo -e "${RED}✗ CSV export failed${NC}"
fi
echo -e "\n"

# Test 22: Export - Inventory CSV
echo -e "${BLUE}22. Testing Export - Inventory CSV...${NC}"
curl -s -X GET "$BASE_URL/export/inventory/csv" \
  -H "Authorization: Bearer $TOKEN" \
  --output /tmp/inventory-test.csv
if [ -f /tmp/inventory-test.csv ]; then
  echo -e "${GREEN}✓ CSV file created successfully${NC}"
  head -n 5 /tmp/inventory-test.csv
  rm /tmp/inventory-test.csv
else
  echo -e "${RED}✗ CSV export failed${NC}"
fi
echo -e "\n"

# Test 23: Calendar Availability
echo -e "${BLUE}23. Testing Calendar Availability...${NC}"
curl -s -X GET "$BASE_URL/calendar/availability?startDate=$TOMORROW&endDate=$NEXT_WEEK" \
  -H "Authorization: Bearer $TOKEN" | head -n 20
echo -e "\n"

# Test 24: Reports - Monthly Report
echo -e "${BLUE}24. Testing Reports - Monthly Report...${NC}"
CURRENT_MONTH=$(date +%Y-%m)
curl -s -X GET "$BASE_URL/reports/monthly?month=$CURRENT_MONTH" \
  -H "Authorization: Bearer $TOKEN" | head -n 25
echo -e "\n"

# Test 25: Update Reservation Status
if [ -n "$RESERVATION_ID" ]; then
  echo -e "${BLUE}25. Testing Update Reservation Status...${NC}"
  curl -s -X PATCH "$BASE_URL/reservations/$RESERVATION_ID/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "status": "confirmed"
    }' | head -n 15
  echo -e "\n"
fi

# Test 26: Inventory Transaction
if [ -n "$ITEM_ID" ]; then
  echo -e "${BLUE}26. Testing Inventory Transaction...${NC}"
  curl -s -X POST "$BASE_URL/inventory/$ITEM_ID/transaction" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "type": "usage",
      "quantity": 5,
      "reason": "Room cleaning"
    }' | head -n 15
  echo -e "\n"
fi

# Test 27: Profile - Get Current User
echo -e "${BLUE}27. Testing Profile - Get Current User...${NC}"
curl -s -X GET "$BASE_URL/auth/profile" \
  -H "Authorization: Bearer $TOKEN" | head -n 15
echo -e "\n"

# Summary
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}✓ All endpoint tests completed${NC}"
echo -e "${BLUE}Token used: ${TOKEN:0:20}...${NC}"
echo -e "\n"

