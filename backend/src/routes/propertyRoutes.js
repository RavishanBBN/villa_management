// src/routes/propertyRoutes.js
// Working property routes for Halcyon Rest

const express = require('express');
const router = express.Router();
const pricingService = require('../services/pricingService');
const currencyService = require('../services/currencyService');
const { successResponse } = require('../utils/responseHelper');

// Mock property data for Halcyon Rest
const halcyonRestUnits = [
  {
    id: 'ground-floor',
    name: 'Halcyon Rest',
    unit: 'Ground Floor',
    type: 'villa_unit',
    status: 'active',
    maxAdults: 4,
    maxChildren: 3,
    maxOccupancy: 4,
    basePriceLkr: 20000,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      '2 Bedrooms with attached bathrooms',
      'Kitchen',
      'Living area',
      'Garden access',
      'Washing machine',
      'Air conditioning',
      'Free WiFi',
      'Private entrance'
    ],
    description: 'Beautiful ground floor unit with direct garden access and modern amenities.',
    featured: true,
    sortOrder: 1
  },
  {
    id: 'first-floor',
    name: 'Halcyon Rest',
    unit: 'First Floor',
    type: 'villa_unit',
    status: 'active',
    maxAdults: 4,
    maxChildren: 3,
    maxOccupancy: 4,
    basePriceLkr: 21000,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    bedrooms: 2,
    bathrooms: 2,
    amenities: [
      '2 Bedrooms with attached bathrooms',
      'Kitchen',
      'Living area',
      'Balcony with city views',
      'Washing machine',
      'Air conditioning',
      'Free WiFi',
      'Elevated position'
    ],
    description: 'Elegant first floor unit with balcony and panoramic views.',
    featured: true,
    sortOrder: 2
  }
];

// GET /api/properties - Get all properties
router.get('/', (req, res) => {
  const { currency = 'LKR', checkIn, checkOut, adults = 2, children = 0 } = req.query;
  
  const units = pricingService.getUnits();
  const unitsWithPricing = units.map(unit => {
    let pricing;
    
    if (checkIn && checkOut) {
      pricing = pricingService.getDynamicPrice(unit.id, checkIn, checkOut, adults, children);
    } else {
      const avgPrice = (unit.priceRangeUSD.min + unit.priceRangeUSD.max) / 2;
      pricing = {
        basePriceLKR: Math.round(avgPrice * currencyService.getRate()),
        basePriceUSD: avgPrice,
        seasonalFactor: 'standard'
      };
    }
    
    return {
      ...unit,
      basePriceLkr: pricing.basePriceLKR,
      pricing: {
        basePriceLKR: pricing.basePriceLKR,
        basePriceUSD: pricing.basePriceUSD,
        priceRangeUSD: unit.priceRangeUSD,
        currency: currency,
        displayPrice: currency === 'USD' ? pricing.basePriceUSD : pricing.basePriceLKR,
        seasonalFactor: pricing.seasonalFactor || 'standard'
      }
    };
  });
  
  return successResponse(res, {
    property: 'Halcyon Rest',
    totalUnits: units.length,
    units: unitsWithPricing,
    exchangeRate: `1 USD = ${currencyService.getRate()} LKR`,
    childrenPolicy: 'Children ≤11 years: Free | Children >11 years: Counted as adult'
  });
});

// POST /api/properties - Create property (mock implementation)
router.post('/', (req, res) => {
  const { name, type, maxGuests, amenities, basePrice, status } = req.body;

  // Mock property creation - just return success with the data
  const newProperty = {
    id: `property_${Date.now()}`,
    name: name || 'New Property',
    type: type || 'villa_unit',
    maxAdults: Math.floor((maxGuests || 4) * 0.7),
    maxChildren: Math.ceil((maxGuests || 4) * 0.3),
    maxOccupancy: maxGuests || 4,
    basePriceLkr: basePrice || 25000,
    amenities: amenities || [],
    status: status || 'active',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.status(201).json({
    success: true,
    message: 'Property created successfully (mock)',
    data: newProperty,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;