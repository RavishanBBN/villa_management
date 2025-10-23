// src/routes/propertyRoutes.js
// Working property routes for Halcyon Rest

const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');
const db = require('../models');

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
router.get('/', async (req, res) => {
  try {
    const { currency = 'LKR', status = 'active' } = req.query;
    
    let properties = [];
    
    // Try to get from database first
    try {
      if (db.Property) {
        const dbProperties = await db.Property.findAll({
          where: { isActive: true },
          order: [['createdAt', 'ASC']]
        });
        
        if (dbProperties.length > 0) {
          properties = dbProperties.map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            type: 'villa_unit',
            status: p.isActive ? 'active' : 'inactive',
            maxAdults: p.maxAdults,
            maxChildren: p.maxChildren,
            maxOccupancy: p.maxAdults,
            basePriceLkr: parseFloat(p.basePrice),
            checkInTime: p.checkInTime,
            checkOutTime: p.checkOutTime,
            amenities: p.amenities || [],
            description: p.description,
            featured: true
          }));
        }
      }
    } catch (error) {
      console.log('Database error, using mock data:', error.message);
    }
    
    // Use mock data if database is empty or fails
    if (properties.length === 0) {
      properties = halcyonRestUnits;
      console.log('Using mock property data');
    }
    
    // Filter by status
    let filteredUnits = properties;
    if (status) {
      filteredUnits = properties.filter(unit => unit.status === status);
    }
    
    // Add pricing in requested currency
    const unitsWithPricing = await Promise.all(
      filteredUnits.map(async (unit) => {
        let displayPrice = unit.basePriceLkr;
        let priceUsd = unit.basePriceLkr;
        
        try {
          if (currency === 'USD') {
            const conversion = await currencyService.convertCurrency(unit.basePriceLkr, 'LKR', 'USD');
            displayPrice = conversion.convertedAmount;
            priceUsd = conversion.convertedAmount;
          } else {
            const conversion = await currencyService.convertCurrency(unit.basePriceLkr, 'LKR', 'USD');
            priceUsd = conversion.convertedAmount;
          }
        } catch (error) {
          // Fallback calculation
          const fallbackRate = 300;
          priceUsd = unit.basePriceLkr / fallbackRate;
          if (currency === 'USD') {
            displayPrice = priceUsd;
          }
        }
        
        return {
          ...unit,
          pricing: {
            basePriceLkr: unit.basePriceLkr,
            basePriceUsd: Math.round(priceUsd * 100) / 100,
            displayPrice: Math.round(displayPrice * 100) / 100,
            currency: currency,
            formatted: currency === 'USD' ? 
              `$${Math.round(displayPrice * 100) / 100}` : 
              `Rs. ${Math.round(displayPrice).toLocaleString()}`
          }
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        property: 'Halcyon Rest',
        location: 'Sri Lanka',
        totalUnits: unitsWithPricing.length,
        currency: currency,
        units: unitsWithPricing
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Properties fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/properties/:unitId - Get specific unit details
router.get('/:unitId', async (req, res) => {
  try {
    const { unitId } = req.params;
    const { currency = 'LKR' } = req.query;
    
    let unit = null;
    
    // Try database first
    try {
      if (db.Property) {
        const dbProperty = await db.Property.findOne({
          where: { id: unitId, isActive: true }
        });
        
        if (dbProperty) {
          unit = {
            id: dbProperty.id,
            name: dbProperty.name,
            unit: dbProperty.unit,
            type: 'villa_unit',
            status: 'active',
            maxAdults: dbProperty.maxAdults,
            maxChildren: dbProperty.maxChildren,
            maxOccupancy: dbProperty.maxAdults,
            basePriceLkr: parseFloat(dbProperty.basePrice),
            checkInTime: dbProperty.checkInTime,
            checkOutTime: dbProperty.checkOutTime,
            amenities: dbProperty.amenities || [],
            description: dbProperty.description
          };
        }
      }
    } catch (error) {
      console.log('Database error, checking mock data:', error.message);
    }
    
    // Fall back to mock data
    if (!unit) {
      unit = halcyonRestUnits.find(u => u.id === unitId);
    }
    
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found. Available units: ground-floor, first-floor',
        timestamp: new Date().toISOString()
      });
    }
    
    // Add pricing in requested currency
    let displayPrice = unit.basePriceLkr;
    let priceUsd = unit.basePriceLkr;
    
    try {
      if (currency === 'USD') {
        const conversion = await currencyService.convertCurrency(unit.basePriceLkr, 'LKR', 'USD');
        displayPrice = conversion.convertedAmount;
        priceUsd = conversion.convertedAmount;
      } else {
        const conversion = await currencyService.convertCurrency(unit.basePriceLkr, 'LKR', 'USD');
        priceUsd = conversion.convertedAmount;
      }
    } catch (error) {
      const fallbackRate = 300;
      priceUsd = unit.basePriceLkr / fallbackRate;
      if (currency === 'USD') {
        displayPrice = priceUsd;
      }
    }
    
    const unitWithPricing = {
      ...unit,
      pricing: {
        basePriceLkr: unit.basePriceLkr,
        basePriceUsd: Math.round(priceUsd * 100) / 100,
        displayPrice: Math.round(displayPrice * 100) / 100,
        currency: currency,
        formatted: currency === 'USD' ? 
          `$${Math.round(displayPrice * 100) / 100}` : 
          `Rs. ${Math.round(displayPrice).toLocaleString()}`
      }
    };
    
    res.json({
      success: true,
      data: unitWithPricing,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Unit fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unit details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;