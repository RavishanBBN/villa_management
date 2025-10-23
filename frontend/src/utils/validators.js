// Email validation
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Phone validation
export const validatePhone = (phone) => {
  const re = /^[\d\s\-\(\)\+]+$/;
  return phone && re.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

// Required field validation
export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

// Number validation
export const validateNumber = (value, min = null, max = null) => {
  const num = parseFloat(value);
  if (isNaN(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

// Date validation
export const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// Date range validation
export const validateDateRange = (startDate, endDate) => {
  if (!validateDate(startDate) || !validateDate(endDate)) return false;
  return new Date(startDate) < new Date(endDate);
};

// Future date validation
export const validateFutureDate = (dateString) => {
  if (!validateDate(dateString)) return false;
  return new Date(dateString) >= new Date();
};

// Booking form validation
export const validateBookingForm = (form) => {
  const errors = {};

  if (!form.propertyId) {
    errors.propertyId = 'Please select a property';
  }

  if (!form.checkIn) {
    errors.checkIn = 'Check-in date is required';
  } else if (!validateDate(form.checkIn)) {
    errors.checkIn = 'Invalid check-in date';
  }

  if (!form.checkOut) {
    errors.checkOut = 'Check-out date is required';
  } else if (!validateDate(form.checkOut)) {
    errors.checkOut = 'Invalid check-out date';
  }

  if (form.checkIn && form.checkOut && !validateDateRange(form.checkIn, form.checkOut)) {
    errors.checkOut = 'Check-out must be after check-in';
  }

  if (!validateNumber(form.adults, 1)) {
    errors.adults = 'At least 1 adult required';
  }

  if (!validateNumber(form.children, 0)) {
    errors.children = 'Invalid number of children';
  }

  if (!validateRequired(form.guestInfo.bookerName)) {
    errors.bookerName = 'Guest name is required';
  }

  if (!validateEmail(form.guestInfo.email)) {
    errors.email = 'Valid email is required';
  }

  if (!validatePhone(form.guestInfo.phone)) {
    errors.phone = 'Valid phone number is required';
  }

  if (!validateRequired(form.guestInfo.country)) {
    errors.country = 'Country is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Expense form validation
export const validateExpenseForm = (form) => {
  const errors = {};

  if (!validateRequired(form.category)) {
    errors.category = 'Category is required';
  }

  if (!validateRequired(form.description)) {
    errors.description = 'Description is required';
  }

  if (!validateNumber(form.amount, 0.01)) {
    errors.amount = 'Valid amount is required';
  }

  if (!validateDate(form.date)) {
    errors.date = 'Valid date is required';
  }

  if (!validateRequired(form.paymentMethod)) {
    errors.paymentMethod = 'Payment method is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Revenue form validation
export const validateRevenueForm = (form) => {
  const errors = {};

  if (!validateRequired(form.type)) {
    errors.type = 'Revenue type is required';
  }

  if (!validateRequired(form.description)) {
    errors.description = 'Description is required';
  }

  if (!validateNumber(form.amount, 0.01)) {
    errors.amount = 'Valid amount is required';
  }

  if (!validateDate(form.date)) {
    errors.date = 'Valid date is required';
  }

  if (!validateRequired(form.currency)) {
    errors.currency = 'Currency is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Message form validation
export const validateMessageForm = (form) => {
  const errors = {};

  if (!validateRequired(form.receiverId)) {
    errors.receiverId = 'Recipient is required';
  }

  if (!validateRequired(form.subject)) {
    errors.subject = 'Subject is required';
  }

  if (!validateRequired(form.message)) {
    errors.message = 'Message is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Pricing form validation
export const validatePricingForm = (form) => {
  const errors = {};

  if (!validateRequired(form.unitId)) {
    errors.unitId = 'Unit is required';
  }

  if (!form.basePricing) {
    errors.basePricing = 'Base pricing is required';
  } else {
    const guests = ['guest1', 'guest2', 'guest3', 'guest4'];
    for (const guest of guests) {
      if (!validateNumber(form.basePricing[guest]?.USD, 0.01)) {
        errors[`basePricing_${guest}`] = `${guest} USD rate is required`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Calendar override validation
export const validateCalendarOverride = (form) => {
  const errors = {};

  if (!validateRequired(form.unitId)) {
    errors.unitId = 'Unit is required';
  }

  if (!validateDate(form.startDate)) {
    errors.startDate = 'Valid start date is required';
  }

  if (!validateDate(form.endDate)) {
    errors.endDate = 'Valid end date is required';
  }

  if (form.startDate && form.endDate && !validateDateRange(form.startDate, form.endDate)) {
    errors.endDate = 'End date must be after start date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// File validation
export const validateFile = (file, allowedTypes = [], maxSizeMB = 5) => {
  if (!file) return { isValid: false, error: 'No file selected' };

  // Check file type
  if (allowedTypes.length > 0) {
    const fileType = file.type;
    const isAllowed = allowedTypes.some(type => fileType.includes(type));
    if (!isAllowed) {
      return { 
        isValid: false, 
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size exceeds ${maxSizeMB}MB limit` 
    };
  }

  return { isValid: true, error: null };
};
