/**
 * Reservation Controller
 * Handles all reservation-related business logic
 */

const dataStore = require('../services/dataStore');
const pricingService = require('../services/pricingService');
const currencyService = require('../services/currencyService');
const { calculateNights } = require('../utils/dateHelper');
const { successResponse, errorResponse, notFoundResponse } = require('../utils/responseHelper');

const isUnitAvailable = (unitId, checkIn, checkOut) => {
  const conflictingReservations = dataStore.reservations.filter(r => 
    r.unitId === unitId && 
    r.status !== 'cancelled' &&
    (
      (new Date(checkIn) >= new Date(r.dates.checkIn) && new Date(checkIn) < new Date(r.dates.checkOut)) ||
      (new Date(checkOut) > new Date(r.dates.checkIn) && new Date(checkOut) <= new Date(r.dates.checkOut)) ||
      (new Date(checkIn) <= new Date(r.dates.checkIn) && new Date(checkOut) >= new Date(r.dates.checkOut))
    )
  );
  return conflictingReservations.length === 0;
};

const checkAvailability = (req, res) => {
  const { checkIn, checkOut, unitId, adults = 2, children = 0, childrenAges } = req.query;
  
  if (!checkIn || !checkOut) {
    return errorResponse(res, 'checkIn and checkOut dates are required');
  }

  const units = pricingService.getUnits();
  let unitsToCheck = unitId ? units.filter(u => u.id === unitId) : units;
  
  if (unitsToCheck.length === 0) {
    return notFoundResponse(res, 'Unit');
  }
  
  const availability = unitsToCheck.map(unit => {
    const available = isUnitAvailable(unit.id, checkIn, checkOut);
    const nights = calculateNights(checkIn, checkOut);
    
    const parsedChildrenAges = childrenAges ? JSON.parse(childrenAges) : [];
    const guestCapacity = pricingService.calculateGuestCapacity(adults, children, parsedChildrenAges);
    
    const canAccommodate = guestCapacity.effectiveAdults <= unit.maxAdults && 
                           guestCapacity.totalGuests <= unit.maxOccupancy;
    
    const dynamicPricing = pricingService.getDynamicPrice(unit.id, checkIn, checkOut, adults, children);
    const totalLKR = dynamicPricing.basePriceLKR * nights;
    const totalUSD = currencyService.convert(totalLKR, 'LKR', 'USD');
    
    return {
      property: {
        id: unit.id,
        name: unit.name,
        unit: unit.name.includes('Ground') ? 'Ground Floor' : 'First Floor',
        maxAdults: unit.maxAdults,
        maxChildren: unit.maxChildren,
        amenities: unit.amenities,
        priceRange: unit.priceRangeUSD
      },
      available: available && canAccommodate,
      capacityIssue: !canAccommodate,
      guestBreakdown: guestCapacity,
      pricing: {
        nights,
        basePriceLKR: dynamicPricing.basePriceLKR,
        totalLKR,
        totalUSD: parseFloat(totalUSD.toFixed(2)),
        exchangeRate: currencyService.getRate(),
        seasonalFactor: dynamicPricing.seasonalFactor
      },
      conflictingReservations: !available ? dataStore.reservations.filter(r => 
        r.unitId === unit.id && 
        r.status !== 'cancelled' &&
        (
          (new Date(checkIn) >= new Date(r.dates.checkIn) && new Date(checkIn) < new Date(r.dates.checkOut)) ||
          (new Date(checkOut) > new Date(r.dates.checkIn) && new Date(checkOut) <= new Date(r.dates.checkOut)) ||
          (new Date(checkIn) <= new Date(r.dates.checkIn) && new Date(checkOut) >= new Date(r.dates.checkOut))
        )
      ).map(r => ({
        id: r.id,
        checkIn: r.dates.checkIn,
        checkOut: r.dates.checkOut,
        status: r.status
      })) : []
    };
  });
  
  return successResponse(res, {
    checkIn,
    checkOut,
    availability,
    childrenPolicy: 'Children ≤11 years: Free | Children >11 years: Counted as adult'
  });
};

const createReservation = (req, res) => {
  const {
    propertyId,
    unitId,
    guestInfo,
    checkIn,
    checkOut,
    adults,
    children,
    childrenAges = [],
    paymentCurrency = 'USD',
    specialRequests,
    source = 'direct',
    notes
  } = req.body;
  
  const actualUnitId = propertyId || unitId;
  const unit = pricingService.getUnit(actualUnitId);
  
  if (!unit) {
    return notFoundResponse(res, 'Unit');
  }
  
  if (!isUnitAvailable(actualUnitId, checkIn, checkOut)) {
    return errorResponse(res, 'Unit not available for selected dates', 409);
  }
  
  const guestCapacity = pricingService.calculateGuestCapacity(adults, children, childrenAges);
  if (guestCapacity.effectiveAdults > unit.maxAdults || guestCapacity.totalGuests > unit.maxOccupancy) {
    return errorResponse(res, 
      `Exceeds unit capacity. Max: ${unit.maxAdults} adults OR ${unit.maxOccupancy} total guests. Children >11 count as adults.`, 
      400
    );
  }
  
  const nights = calculateNights(checkIn, checkOut);
  const dynamicPricing = pricingService.getDynamicPrice(actualUnitId, checkIn, checkOut, adults, children);
  const totalLKR = dynamicPricing.basePriceLKR * nights;
  const totalUSD = currencyService.convert(totalLKR, 'LKR', 'USD');
  const confirmationNumber = 'HR' + Date.now().toString().slice(-8);
  
  const reservation = {
    id: Date.now().toString(),
    confirmationNumber,
    unitId: actualUnitId,
    propertyId: actualUnitId,
    unitName: unit.name,
    guestInfo: {
      bookerName: guestInfo.bookerName,
      country: guestInfo.country,
      email: guestInfo.email,
      phone: guestInfo.phone,
      adults: parseInt(adults),
      children: parseInt(children || 0),
      childrenAges: childrenAges || [],
      effectiveAdults: guestCapacity.effectiveAdults,
      effectiveChildren: guestCapacity.effectiveChildren,
      passportPhotos: guestInfo.passportPhotos || []
    },
    dates: {
      checkIn,
      checkOut,
      nights
    },
    pricing: {
      basePriceLKR: dynamicPricing.basePriceLKR,
      totalLKR,
      totalUSD: totalUSD.toFixed(2),
      currency: paymentCurrency,
      exchangeRateUsed: currencyService.getRate(),
      seasonalFactor: dynamicPricing.seasonalFactor
    },
    status: 'pending',
    paymentStatus: 'not-paid',
    source,
    specialRequests: specialRequests || notes || '',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    property: {
      id: actualUnitId,
      name: unit.name,
      unit: unit.name.includes('Ground') ? 'Ground Floor' : 'First Floor',
      basePrice: dynamicPricing.basePriceLKR,
      checkInTime: unit.checkInTime,
      checkOutTime: unit.checkOutTime
    },
    guest: {
      id: 'guest-' + Date.now(),
      bookerName: guestInfo.bookerName,
      country: guestInfo.country,
      email: guestInfo.email,
      phone: guestInfo.phone
    }
  };
  
  dataStore.reservations.push(reservation);
  
  console.log(`✅ Created reservation ${confirmationNumber} for ${guestInfo.bookerName}`);
  
  return successResponse(res, reservation, 'Reservation created successfully', 201);
};

const getAllReservations = (req, res) => {
  const { status, unitId, from, to, paymentStatus } = req.query;
  
  let filteredReservations = dataStore.reservations;
  
  if (status) filteredReservations = filteredReservations.filter(r => r.status === status);
  if (paymentStatus) filteredReservations = filteredReservations.filter(r => r.paymentStatus === paymentStatus);
  if (unitId) filteredReservations = filteredReservations.filter(r => r.unitId === unitId);
  if (from) filteredReservations = filteredReservations.filter(r => new Date(r.dates.checkIn) >= new Date(from));
  if (to) filteredReservations = filteredReservations.filter(r => new Date(r.dates.checkOut) <= new Date(to));
  
  return successResponse(res, filteredReservations);
};

const getReservationById = (req, res) => {
  const { reservationId } = req.params;
  const reservation = dataStore.reservations.find(r => r.id === reservationId);
  
  if (!reservation) {
    return notFoundResponse(res, 'Reservation');
  }
  
  return successResponse(res, reservation);
};

const updateReservation = (req, res) => {
  const { reservationId } = req.params;
  const { status, paymentStatus, specialRequests, notes, paymentMethod = 'cash' } = req.body;
  
  const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);
  
  if (reservationIndex === -1) {
    return notFoundResponse(res, 'Reservation');
  }
  
  const reservation = dataStore.reservations[reservationIndex];
  const previousPaymentStatus = reservation.paymentStatus;
  
  if (status) reservation.status = status;
  if (paymentStatus) reservation.paymentStatus = paymentStatus;
  if (specialRequests) reservation.specialRequests = specialRequests;
  if (notes) reservation.notes = notes;
  
  reservation.lastUpdated = new Date().toISOString();
  
  let revenueEntry = null;
  let revenueAction = null;
  
  if (paymentStatus && paymentStatus !== previousPaymentStatus) {
    if ((paymentStatus === 'full-payment' || paymentStatus === 'advance-payment') && 
        previousPaymentStatus === 'not-paid') {
      
      const paymentAmount = paymentStatus === 'full-payment' ? 
        reservation.pricing.totalLKR : 
        (reservation.pricing.totalLKR * 0.5);
      
      revenueEntry = {
        id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        type: 'accommodation',
        source: 'reservation',
        sourceId: reservationId,
        description: `${reservation.unitName || reservation.propertyId} - ${paymentStatus === 'full-payment' ? 'Full' : 'Advance'} Payment`,
        amount: parseFloat(paymentAmount),
        amountUSD: parseFloat(paymentAmount) / currencyService.getRate(),
        currency: 'LKR',
        exchangeRate: currencyService.getRate(),
        date: new Date().toISOString().split('T')[0],
        paymentMethod: paymentMethod,
        paymentStatus: 'completed',
        guestName: reservation.guestInfo?.bookerName || 'Unknown Guest',
        confirmationNumber: reservation.confirmationNumber,
        tags: ['accommodation', paymentStatus, reservation.unitId || reservation.propertyId],
        notes: `${paymentStatus === 'full-payment' ? 'Full' : 'Advance'} payment received for reservation`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      dataStore.revenueEntries.push(revenueEntry);
      revenueAction = 'created';
    }
  }
  
  const responseData = {
    reservation: reservation,
    revenueEntry: revenueEntry,
    revenueAction: revenueAction
  };
  
  const message = revenueAction ? 
    `Reservation updated successfully and revenue ${revenueAction}` : 
    'Reservation updated successfully';
  
  return successResponse(res, responseData, message);
};

/**
 * Cancel a reservation
 * Updates status to 'cancelled' and records cancellation details
 */
const cancelReservation = (req, res) => {
  const { reservationId } = req.params;
  const { cancellationReason, refundAmount, notes } = req.body;

  const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);

  if (reservationIndex === -1) {
    return notFoundResponse(res, 'Reservation');
  }

  const reservation = dataStore.reservations[reservationIndex];

  // Check if already cancelled
  if (reservation.status === 'cancelled') {
    return errorResponse(res, 'Reservation is already cancelled', 400);
  }

  // Check if already checked in
  if (reservation.status === 'checked_in') {
    return errorResponse(res, 'Cannot cancel a reservation that is already checked in', 400);
  }

  // Update reservation
  reservation.status = 'cancelled';
  reservation.cancellationReason = cancellationReason || 'Not specified';
  reservation.cancelledAt = new Date().toISOString();
  reservation.refundAmount = refundAmount || 0;
  if (notes) reservation.notes = (reservation.notes || '') + '\n[Cancellation] ' + notes;
  reservation.lastUpdated = new Date().toISOString();

  return successResponse(res, {
    reservation,
    message: 'Reservation cancelled successfully'
  });
};

/**
 * Modify a reservation (change dates or guest count)
 * Validates new dates for availability before modifying
 */
const modifyReservation = (req, res) => {
  const { reservationId } = req.params;
  const { checkIn, checkOut, adults, children, childrenAges, notes } = req.body;

  const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);

  if (reservationIndex === -1) {
    return notFoundResponse(res, 'Reservation');
  }

  const reservation = dataStore.reservations[reservationIndex];

  // Check if reservation can be modified
  if (reservation.status === 'cancelled') {
    return errorResponse(res, 'Cannot modify a cancelled reservation', 400);
  }

  if (reservation.status === 'checked_out') {
    return errorResponse(res, 'Cannot modify a completed reservation', 400);
  }

  const modifications = {};
  let recalculatePrice = false;

  // Check dates modification
  if (checkIn || checkOut) {
    const newCheckIn = checkIn || reservation.dates.checkIn;
    const newCheckOut = checkOut || reservation.dates.checkOut;

    // Validate availability for new dates (excluding this reservation)
    const conflictingReservations = dataStore.reservations.filter(r =>
      r.id !== reservationId &&
      r.unitId === reservation.unitId &&
      r.status !== 'cancelled' &&
      (
        (new Date(newCheckIn) >= new Date(r.dates.checkIn) && new Date(newCheckIn) < new Date(r.dates.checkOut)) ||
        (new Date(newCheckOut) > new Date(r.dates.checkIn) && new Date(newCheckOut) <= new Date(r.dates.checkOut)) ||
        (new Date(newCheckIn) <= new Date(r.dates.checkIn) && new Date(newCheckOut) >= new Date(r.dates.checkOut))
      )
    );

    if (conflictingReservations.length > 0) {
      return errorResponse(res, 'Unit not available for the new dates', 409);
    }

    modifications.checkIn = newCheckIn;
    modifications.checkOut = newCheckOut;
    reservation.dates.checkIn = newCheckIn;
    reservation.dates.checkOut = newCheckOut;
    recalculatePrice = true;
  }

  // Check guest count modification
  if (adults !== undefined || children !== undefined) {
    const newAdults = adults !== undefined ? adults : reservation.guests.adults;
    const newChildren = children !== undefined ? children : reservation.guests.children;
    const newChildrenAges = childrenAges || reservation.guests.childrenAges || [];

    const unit = pricingService.getUnit(reservation.unitId);
    const guestCapacity = pricingService.calculateGuestCapacity(newAdults, newChildren, newChildrenAges);

    if (guestCapacity.effectiveAdults > unit.maxAdults || guestCapacity.totalGuests > unit.maxOccupancy) {
      return errorResponse(res,
        `Exceeds unit capacity. Max: ${unit.maxAdults} adults OR ${unit.maxOccupancy} total guests.`,
        400
      );
    }

    modifications.adults = newAdults;
    modifications.children = newChildren;
    modifications.childrenAges = newChildrenAges;
    reservation.guests.adults = newAdults;
    reservation.guests.children = newChildren;
    reservation.guests.childrenAges = newChildrenAges;
    recalculatePrice = true;
  }

  // Recalculate pricing if needed
  if (recalculatePrice) {
    const nights = calculateNights(reservation.dates.checkIn, reservation.dates.checkOut);
    const dynamicPricing = pricingService.getDynamicPrice(
      reservation.unitId,
      reservation.dates.checkIn,
      reservation.dates.checkOut,
      reservation.guests.adults,
      reservation.guests.children
    );
    const totalLKR = dynamicPricing.basePriceLKR * nights;
    const totalUSD = currencyService.convert(totalLKR, 'LKR', 'USD');

    reservation.pricing = {
      nights,
      basePriceLKR: dynamicPricing.basePriceLKR,
      totalLKR,
      totalUSD: parseFloat(totalUSD.toFixed(2)),
      exchangeRate: currencyService.getRate()
    };

    modifications.pricing = reservation.pricing;
  }

  // Add modification note
  if (notes) {
    reservation.notes = (reservation.notes || '') + '\n[Modification] ' + notes;
  }

  reservation.lastUpdated = new Date().toISOString();

  return successResponse(res, {
    reservation,
    modifications,
    message: 'Reservation modified successfully'
  });
};

/**
 * Check-in a guest
 * Updates status to 'checked_in' and records check-in time
 */
const checkIn = (req, res) => {
  const { reservationId } = req.params;
  const { checkedInBy, actualCheckInTime, notes } = req.body;

  const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);

  if (reservationIndex === -1) {
    return notFoundResponse(res, 'Reservation');
  }

  const reservation = dataStore.reservations[reservationIndex];

  // Validate reservation status
  if (reservation.status === 'cancelled') {
    return errorResponse(res, 'Cannot check in a cancelled reservation', 400);
  }

  if (reservation.status === 'checked_in') {
    return errorResponse(res, 'Guest is already checked in', 400);
  }

  if (reservation.status === 'checked_out') {
    return errorResponse(res, 'Cannot check in a completed reservation', 400);
  }

  // Update reservation
  reservation.status = 'checked_in';
  reservation.checkedInAt = actualCheckInTime || new Date().toISOString();
  reservation.checkedInBy = checkedInBy || 'System';
  if (notes) reservation.notes = (reservation.notes || '') + '\n[Check-in] ' + notes;
  reservation.lastUpdated = new Date().toISOString();

  return successResponse(res, {
    reservation,
    message: 'Guest checked in successfully'
  });
};

/**
 * Check-out a guest
 * Updates status to 'checked_out' and records check-out time
 */
const checkOut = (req, res) => {
  const { reservationId } = req.params;
  const { checkedOutBy, actualCheckOutTime, notes, damageCharges, extraCharges } = req.body;

  const reservationIndex = dataStore.reservations.findIndex(r => r.id === reservationId);

  if (reservationIndex === -1) {
    return notFoundResponse(res, 'Reservation');
  }

  const reservation = dataStore.reservations[reservationIndex];

  // Validate reservation status
  if (reservation.status === 'cancelled') {
    return errorResponse(res, 'Cannot check out a cancelled reservation', 400);
  }

  if (reservation.status === 'checked_out') {
    return errorResponse(res, 'Guest is already checked out', 400);
  }

  if (reservation.status !== 'checked_in') {
    return errorResponse(res, 'Can only check out guests who are checked in', 400);
  }

  // Calculate additional charges
  let additionalCharges = 0;
  if (damageCharges) additionalCharges += parseFloat(damageCharges);
  if (extraCharges) additionalCharges += parseFloat(extraCharges);

  // Update reservation
  reservation.status = 'checked_out';
  reservation.checkedOutAt = actualCheckOutTime || new Date().toISOString();
  reservation.checkedOutBy = checkedOutBy || 'System';

  if (additionalCharges > 0) {
    reservation.pricing.totalLKR += additionalCharges;
    reservation.pricing.totalUSD = parseFloat(
      currencyService.convert(reservation.pricing.totalLKR, 'LKR', 'USD').toFixed(2)
    );
    reservation.additionalCharges = {
      damageCharges: damageCharges || 0,
      extraCharges: extraCharges || 0,
      total: additionalCharges
    };
  }

  if (notes) reservation.notes = (reservation.notes || '') + '\n[Check-out] ' + notes;
  reservation.lastUpdated = new Date().toISOString();

  return successResponse(res, {
    reservation,
    additionalCharges: additionalCharges > 0 ? reservation.additionalCharges : null,
    message: 'Guest checked out successfully'
  });
};

module.exports = {
  checkAvailability,
  createReservation,
  getAllReservations,
  getReservationById,
  updateReservation,
  cancelReservation,
  modifyReservation,
  checkIn,
  checkOut
};
