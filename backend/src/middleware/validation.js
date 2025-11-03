/**
 * Validation Middleware
 * Request validation for revenue, expenses, and other entities
 */

const validateRevenueData = (req, res, next) => {
  const { type, description, amount, currency = 'LKR' } = req.body;
  
  if (!type || !description || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['type', 'description', 'amount'],
      provided: { type: !!type, description: !!description, amount: !!amount },
      timestamp: new Date().toISOString()
    });
  }
  
  const validTypes = ['accommodation', 'services', 'other'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid revenue type',
      validTypes: validTypes,
      provided: type,
      timestamp: new Date().toISOString()
    });
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
      provided: amount,
      timestamp: new Date().toISOString()
    });
  }
  
  const validCurrencies = ['LKR', 'USD'];
  if (!validCurrencies.includes(currency)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid currency',
      validCurrencies: validCurrencies,
      provided: currency,
      timestamp: new Date().toISOString()
    });
  }
  
  if (description.length < 3 || description.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Description must be between 3 and 200 characters',
      provided: description.length,
      timestamp: new Date().toISOString()
    });
  }
  
  if (req.body.paymentMethod) {
    const validPaymentMethods = ['cash', 'card', 'bank_transfer', 'online'];
    if (!validPaymentMethods.includes(req.body.paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method',
        validMethods: validPaymentMethods,
        provided: req.body.paymentMethod,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  next();
};

const validateExpenseData = (req, res, next) => {
  const { category, description, amount, vendor, invoiceNumber, invoiceFile } = req.body;
  
  if (!category || !description || !amount || !vendor || !invoiceNumber || !invoiceFile) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['category', 'description', 'amount', 'vendor', 'invoiceNumber', 'invoiceFile'],
      timestamp: new Date().toISOString()
    });
  }
  
  const validCategories = ['utilities', 'maintenance', 'supplies', 'staff', 'marketing', 'services'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid expense category',
      validCategories: validCategories,
      provided: category,
      timestamp: new Date().toISOString()
    });
  }
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number',
      provided: amount,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

const validateReservationData = (req, res, next) => {
  const { propertyId, unitId, guestInfo, checkIn, checkOut, adults } = req.body;
  
  const actualUnitId = propertyId || unitId;
  
  if (!actualUnitId || !guestInfo || !checkIn || !checkOut || !adults) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields',
      required: ['propertyId/unitId', 'guestInfo', 'checkIn', 'checkOut', 'adults'],
      timestamp: new Date().toISOString()
    });
  }
  
  if (!guestInfo.bookerName || !guestInfo.email) {
    return res.status(400).json({
      success: false,
      message: 'Guest information incomplete',
      required: ['bookerName', 'email'],
      timestamp: new Date().toISOString()
    });
  }
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkInDate >= checkOutDate) {
    return res.status(400).json({
      success: false,
      message: 'Check-out date must be after check-in date',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

module.exports = {
  validateRevenueData,
  validateExpenseData,
  validateReservationData
};
