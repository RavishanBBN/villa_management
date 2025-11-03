/**
 * Reservation Routes
 * All reservation-related endpoints
 */

const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { validateReservationData } = require('../middleware/validation');

// Check availability
router.get('/availability/check', reservationController.checkAvailability);

// Get all reservations
router.get('/', reservationController.getAllReservations);

// Get single reservation
router.get('/:reservationId', reservationController.getReservationById);

// Create new reservation
router.post('/', validateReservationData, reservationController.createReservation);

// Update reservation
router.put('/:reservationId', reservationController.updateReservation);

// Cancel reservation
router.post('/:reservationId/cancel', reservationController.cancelReservation);

// Modify reservation (dates/guests)
router.post('/:reservationId/modify', reservationController.modifyReservation);

// Check-in
router.post('/:reservationId/check-in', reservationController.checkIn);

// Check-out
router.post('/:reservationId/check-out', reservationController.checkOut);

module.exports = router;