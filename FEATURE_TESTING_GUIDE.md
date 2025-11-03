# 🚀 Quick Start Guide - New Features Testing

## ✅ Features Implemented This Session

1. **API Documentation (Swagger UI)** 📚
2. **Error Logging System** 📝
3. **Email Service with Templates** 📧
4. **Password Reset Functionality** 🔐
5. **PDF Generation Service** 📄

---

## 🔧 Setup Steps

### 1. Configure Email Service (Required for Password Reset)

Edit `backend/.env` and update:

```bash
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
```

**How to get Gmail App Password:**
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "Halcyon Rest" as the name
4. Copy the 16-character password
5. Paste it in `.env` file

### 2. Start the Backend Server

```bash
cd backend
npm start
```

The server will log:
- ✅ Swagger UI available at: `http://localhost:3001/api-docs`
- ✅ Request logging enabled
- ✅ Error logging to `backend/logs/`

---

## 📚 Testing API Documentation (Swagger)

### Access Swagger UI:
```
http://localhost:3001/api-docs
```

**Features:**
- Interactive API explorer
- Try out endpoints directly
- View request/response schemas
- Authentication support
- All endpoints documented

**Test it:**
1. Open browser to `http://localhost:3001/api-docs`
2. Expand "Authentication" section
3. Try the `POST /api/auth/forgot-password` endpoint
4. Click "Try it out"
5. Enter test email and execute

---

## 📧 Testing Password Reset Flow

### Step 1: Request Password Reset

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@halcyonrest.com"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset email sent successfully"
}
```

### Step 2: Check Your Email

You should receive an email with:
- Professional HTML template
- Reset password button
- Reset link (valid for 1 hour)
- Security instructions

### Step 3: Reset Password

```bash
curl -X POST http://localhost:3001/api/auth/reset-password/YOUR_TOKEN_HERE \
  -H "Content-Type: application/json" \
  -d '{"password": "NewPassword123!"}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Password reset successful. You can now log in with your new password."
}
```

---

## 📝 Testing Error Logging System

### Check Logs Directory:

```bash
ls -la backend/logs/
```

You should see:
- `error.log` - All errors
- `combined.log` - All requests and info

### View Recent Logs:

```bash
# View error log
tail -f backend/logs/error.log

# View combined log
tail -f backend/logs/combined.log
```

### Trigger a Test Error:

```bash
# Try invalid endpoint
curl http://localhost:3001/api/invalid-endpoint
```

Check `error.log` - you'll see the 404 logged.

### View Request Logs:

Every API request is logged with:
- Method (GET, POST, etc.)
- URL
- IP address
- User agent
- Timestamp

---

## 📄 Testing PDF Generation

### Generate Invoice PDF:

Create a test endpoint in Postman or use curl:

```bash
curl -X POST http://localhost:3001/api/test/generate-invoice \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "YOUR_RESERVATION_ID"
  }'
```

**PDF Features:**
- Professional invoice layout
- Guest details
- Booking information
- Itemized charges
- Payment status
- Branding

### Test Receipt Generation:

```bash
curl -X POST http://localhost:3001/api/test/generate-receipt \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "YOUR_RESERVATION_ID",
    "payment": {
      "amount": 50000,
      "method": "cash"
    }
  }'
```

**Receipt Features:**
- Payment confirmation
- "PAID" stamp
- Professional layout
- Computer-generated notice

---

## 🧪 Testing Email Templates

### Test Booking Confirmation Email:

```javascript
// In Node.js console or create test endpoint
const emailService = require('./src/services/emailService');

const testReservation = {
  confirmationNumber: 'HR12345678',
  unitName: 'Halcyon Rest - Ground Floor',
  guestInfo: {
    bookerName: 'Test Guest',
    email: 'test@example.com',
    adults: 2,
    children: 1
  },
  dates: {
    checkIn: '2024-12-25',
    checkOut: '2024-12-27',
    nights: 2
  },
  pricing: {
    totalLKR: 67200
  }
};

await emailService.sendBookingConfirmation(testReservation);
```

### Test Payment Receipt Email:

```javascript
const payment = {
  amount: 67200,
  method: 'cash'
};

await emailService.sendPaymentReceipt(testReservation, payment);
```

---

## 🔍 Verify All Systems

### 1. Check Server Logs:

```bash
# Server should show:
📚 Swagger UI: http://localhost:3001/api-docs
📝 Request logging: ENABLED
📧 Email service: CONFIGURED
📄 PDF service: READY
```

### 2. Test Health Check:

```bash
curl http://localhost:3001/api/health
```

Should return system status including logging status.

### 3. Check File Structure:

```bash
backend/
  logs/              ✅ Created
    error.log        ✅ Logging errors
    combined.log     ✅ Logging all requests
  uploads/
    invoices/        ✅ Ready for PDFs
    receipts/        ✅ Ready for PDFs
```

---

## 📊 Monitoring in Production

### View Real-Time Logs:

```bash
# Watch error log
tail -f backend/logs/error.log | grep ERROR

# Watch all requests
tail -f backend/logs/combined.log

# Search for specific user
grep "user@email.com" backend/logs/combined.log
```

### Log Rotation:

- Max file size: 5MB
- Max files kept: 5
- Automatic rotation when full

---

## 🎯 Next Steps

### 1. Test Password Reset Flow
- [ ] Configure Gmail app password
- [ ] Test forgot password endpoint
- [ ] Receive email
- [ ] Test reset password endpoint
- [ ] Verify login with new password

### 2. Explore Swagger UI
- [ ] Open http://localhost:3001/api-docs
- [ ] Try different endpoints
- [ ] Test authentication flow
- [ ] View response schemas

### 3. Generate Test PDFs
- [ ] Create a reservation
- [ ] Generate invoice PDF
- [ ] Generate receipt PDF
- [ ] Verify PDF formatting

### 4. Monitor Logs
- [ ] Make several API requests
- [ ] Check combined.log
- [ ] Trigger an error
- [ ] Check error.log

---

## 🐛 Troubleshooting

### Email Not Sending?

**Check:**
1. Gmail app password is correct (16 characters, no spaces)
2. EMAIL_USER in .env is your full Gmail address
3. Less secure app access is NOT needed (we use app password)
4. Check logs for error details

**Test email configuration:**
```javascript
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email config error:', error);
  } else {
    console.log('✅ Email server ready');
  }
});
```

### Swagger UI Not Loading?

**Check:**
1. Server is running
2. Visit exact URL: http://localhost:3001/api-docs
3. Check browser console for errors
4. Verify swagger packages installed: `npm list swagger-ui-express`

### PDFs Not Generating?

**Check:**
1. uploads/invoices directory exists
2. Write permissions on uploads folder
3. pdfkit package installed: `npm list pdfkit`

### Logs Not Creating?

**Check:**
1. `backend/logs/` directory exists
2. Write permissions on logs folder
3. winston package installed: `npm list winston`

---

## 📞 Support

If you encounter issues:

1. **Check server logs:** `backend/logs/error.log`
2. **Check console output:** Where you ran `npm start`
3. **Verify .env file:** All required variables set
4. **Test database connection:** Should be working from previous setup

---

## ✅ Success Checklist

- [ ] Swagger UI accessible at `/api-docs`
- [ ] Logs being written to `backend/logs/`
- [ ] Email configuration tested and working
- [ ] Password reset flow completed successfully
- [ ] PDF generation working
- [ ] All endpoints returning proper responses

**When all checked:** 🎉 All new features are working correctly!

---

*Last Updated: $(date)*
*Version: 2.0 - High Priority Features Complete*
