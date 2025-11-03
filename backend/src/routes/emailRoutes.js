const express = require('express');
const router = express.Router();
const { 
  testEmailConnection, 
  sendTestEmail 
} = require('../services/emailService');
const { authenticateToken } = require('../middleware/auth');

// Test email configuration - PUBLIC ACCESS (no auth required for testing)
router.get('/test-connection', async (req, res) => {
  try {
    const result = await testEmailConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send test email - PUBLIC ACCESS for initial setup
router.post('/send-test', async (req, res) => {
  try {
    const { email } = req.body;
    const toEmail = email || 'test@example.com';
    
    const result = await sendTestEmail(toEmail);
    res.json(result);
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
