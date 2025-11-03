/**
 * Pricing Service
 * Handles dynamic pricing calculations
 */

const currencyService = require('./currencyService');

class PricingService {
  constructor() {
    this.halcyonRestUnits = [
      {
        id: 'ground-floor',
        name: 'Halcyon Rest - Ground Floor',
        type: 'unit',
        maxAdults: 4,
        maxChildren: 3,
        maxOccupancy: 4,
        priceRangeUSD: { min: 104, max: 122 },
        checkInTime: '14:00',
        checkOutTime: '11:00',
        amenities: [
          '2 Bedrooms with attached bathrooms',
          'Kitchen',
          'Living area', 
          'Garden access',
          'Washing machine',
          'Air conditioning',
          'Free WiFi',
          'Ground floor access'
        ]
      },
      {
        id: 'first-floor',
        name: 'Halcyon Rest - First Floor',
        type: 'unit',
        maxAdults: 4,
        maxChildren: 3,
        maxOccupancy: 4,
        priceRangeUSD: { min: 102, max: 120 },
        checkInTime: '14:00',
        checkOutTime: '11:00',
        amenities: [
          '2 Bedrooms with attached bathrooms',
          'Kitchen',
          'Living area',
          'Balcony with view',
          'Washing machine', 
          'Air conditioning',
          'Free WiFi',
          'First floor with stairs'
        ]
      }
    ];
  }

  getUnits() {
    return this.halcyonRestUnits;
  }

  getUnit(unitId) {
    return this.halcyonRestUnits.find(u => u.id === unitId);
  }

  calculateGuestCapacity(adults, children, childrenAges = []) {
    let effectiveAdults = parseInt(adults);
    let effectiveChildren = 0;
    
    if (Array.isArray(childrenAges)) {
      childrenAges.forEach(age => {
        if (parseInt(age) > 11) {
          effectiveAdults++;
        } else {
          effectiveChildren++;
        }
      });
    } else {
      effectiveChildren = parseInt(children) || 0;
    }
    
    return {
      effectiveAdults,
      effectiveChildren,
      totalGuests: effectiveAdults + effectiveChildren
    };
  }

  getDynamicPrice(unitId, checkIn, checkOut, adults, children) {
    const unit = this.getUnit(unitId);
    if (!unit) return { basePriceLKR: 20000, basePriceUSD: 66 };
    
    const checkInDate = new Date(checkIn);
    const month = checkInDate.getMonth() + 1;
    const totalGuests = parseInt(adults) + parseInt(children || 0);
    
    let basePriceUSD;
    
    if (unit.id === 'ground-floor') {
      if (totalGuests === 1) basePriceUSD = 104;
      else if (totalGuests === 2) basePriceUSD = 112;
      else if (totalGuests === 3) basePriceUSD = 122;
      else basePriceUSD = 122;
    } else {
      if (totalGuests === 1) basePriceUSD = 102;
      else if (totalGuests === 2) basePriceUSD = 110;
      else if (totalGuests === 3) basePriceUSD = 120;
      else basePriceUSD = 120;
    }
    
    let priceLKR = basePriceUSD * currencyService.getRate();
    
    // Seasonal adjustments
    if (month >= 12 || month <= 3) {
      priceLKR *= 1.2; // Peak season
    } else if (month >= 7 && month <= 9) {
      priceLKR *= 1.1; // High season
    }
    
    return {
      basePriceLKR: Math.round(priceLKR),
      basePriceUSD: Math.round(basePriceUSD * 100) / 100,
      seasonalFactor: month >= 12 || month <= 3 ? 'peak' : month >= 7 && month <= 9 ? 'high' : 'standard'
    };
  }
}

module.exports = new PricingService();
