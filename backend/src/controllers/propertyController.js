const db = require('../database/db');

// Get all properties
exports.getAllProperties = async (req, res) => {
  try {
    const properties = require('../config/properties.json');
    res.json({
      success: true,
      data: properties,
      message: 'Success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve properties',
      error: error.message
    });
  }
};

// Get property by ID
exports.getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    const properties = require('../config/properties.json');
    
    if (id) {
      const unit = properties.units.find(u => u.id === id);
      if (unit) {
        return res.json({
          success: true,
          data: { ...properties, units: [unit] },
          message: 'Success',
          timestamp: new Date().toISOString()
        });
      }
    }
    
    res.json({
      success: true,
      data: properties,
      message: 'Success',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve property',
      error: error.message
    });
  }
};

// Check availability
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkIn, checkOut, adults = 1, children = 0 } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        message: 'checkIn and checkOut dates are required'
      });
    }

    const properties = require('../config/properties.json');
    let units = id ? properties.units.filter(u => u.id === id) : properties.units;

    // Check for overlapping reservations
    const overlappingReservations = await db.all(
      `SELECT propertyId FROM reservations 
       WHERE status IN ('confirmed', 'checked_in')
       AND NOT (checkOut <= ? OR checkIn >= ?)`,
      [checkIn, checkOut]
    );

    const bookedUnitIds = overlappingReservations.map(r => r.propertyId);
    
    const availableUnits = units.filter(unit => {
      const isAvailable = !bookedUnitIds.includes(unit.id);
      const canAccommodate = 
        parseInt(adults) <= unit.maxAdults && 
        (parseInt(adults) + parseInt(children)) <= unit.maxOccupancy;
      
      return isAvailable && canAccommodate;
    });

    res.json({
      success: true,
      data: {
        checkIn,
        checkOut,
        adults: parseInt(adults),
        children: parseInt(children),
        availableUnits,
        totalAvailable: availableUnits.length
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

// Update property
exports.updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.status(501).json({
      success: false,
      message: 'Property updates are managed through configuration files'
    });
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error.message
    });
  }
};
