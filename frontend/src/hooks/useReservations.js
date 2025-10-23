import { useState, useCallback } from 'react';
import { reservationAPI } from '../services/api';
import { useAppContext } from '../context/AppContext';

export const useReservations = () => {
  const { currencyRate, showSuccess, showError } = useAppContext();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all reservations
  const loadReservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.getAll();
      if (response.data.success) {
        setReservations(response.data.data || []);
        console.log('Reservations loaded:', response.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load reservations:', err);
      setError('Failed to load reservations');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get reservation by ID
  const getReservationById = useCallback((id) => {
    return reservations.find(r => r.id === id);
  }, [reservations]);

  // Check availability
  const checkAvailability = useCallback(async (checkIn, checkOut, unitId = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.checkAvailability({
        checkIn,
        checkOut,
        unitId
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return {
        success: false,
        error: response.data.message
      };
    } catch (err) {
      console.error('Failed to check availability:', err);
      setError('Failed to check availability');
      return {
        success: false,
        error: err.message
      };
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate pricing
  const calculatePricing = useCallback(async (reservationData) => {
    try {
      const response = await reservationAPI.calculatePricing({
        ...reservationData,
        currencyRate
      });
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data
        };
      }
      return {
        success: false,
        error: response.data.message
      };
    } catch (err) {
      console.error('Failed to calculate pricing:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }, [currencyRate]);

  // Create reservation
  const createReservation = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.create(data);
      if (response.data.success) {
        await loadReservations();
        showSuccess('Reservation created successfully');
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to create reservation');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to create reservation:', err);
      showError('Failed to create reservation');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadReservations, showSuccess, showError]);

  // Update reservation
  const updateReservation = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.update(id, data);
      if (response.data.success) {
        await loadReservations();
        showSuccess('Reservation updated successfully');
        return { success: true, data: response.data.data };
      }
      showError(response.data.message || 'Failed to update reservation');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to update reservation:', err);
      showError('Failed to update reservation');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadReservations, showSuccess, showError]);

  // Update reservation status
  const updateReservationStatus = useCallback(async (id, status, reason = '') => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.updateStatus(id, status, reason);
      if (response.data.success) {
        await loadReservations();
        showSuccess(`Reservation ${status} successfully`);
        return { success: true };
      }
      showError(response.data.message || `Failed to ${status} reservation`);
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error(`Failed to ${status} reservation:`, err);
      showError(`Failed to ${status} reservation`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadReservations, showSuccess, showError]);

  // Delete reservation
  const deleteReservation = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reservationAPI.delete(id);
      if (response.data.success) {
        await loadReservations();
        showSuccess('Reservation deleted successfully');
        return { success: true };
      }
      showError(response.data.message || 'Failed to delete reservation');
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      showError('Failed to delete reservation');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadReservations, showSuccess, showError]);

  // Get statistics
  const getReservationStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const checkedIn = reservations.filter(r => r.status === 'checked_in').length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    
    return {
      total: reservations.length,
      confirmed,
      checkedIn,
      pending,
      cancelled,
      occupiedUnits: checkedIn,
    };
  }, [reservations]);

  return {
    reservations,
    loading,
    error,
    loadReservations,
    getReservationById,
    checkAvailability,
    calculatePricing,
    createReservation,
    updateReservation,
    updateReservationStatus,
    deleteReservation,
    getReservationStats,
  };
};
