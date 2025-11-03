import { useState, useCallback, useEffect } from 'react';
import { guestAPI } from '../services/api';

/**
 * Custom hook for Guest Management
 * Handles guest data, profiles, and reservation history
 */
export const useGuests = () => {
  // State management
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestReservations, setGuestReservations] = useState([]);
  const [guestStatistics, setGuestStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    email: '',
    country: '',
    sortBy: 'createdAt',
    order: 'DESC',
    page: 1,
    limit: 50,
    include: 'reservations'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    pages: 0
  });

  /**
   * Load all guests with filters
   */
  const loadGuests = useCallback(async (customFilters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const appliedFilters = { ...filters, ...customFilters };
      const response = await guestAPI.getAll(appliedFilters);

      if (response.data.success) {
        setGuests(response.data.data.guests);
        setPagination(response.data.data.pagination);
      } else {
        setError(response.data.message || 'Failed to load guests');
      }
    } catch (err) {
      console.error('Error loading guests:', err);
      setError(err.response?.data?.message || 'Failed to load guests');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Load single guest by ID
   */
  const loadGuestById = useCallback(async (guestId, includeReservations = true) => {
    setLoading(true);
    setError(null);

    try {
      const params = includeReservations ? { include: 'reservations' } : {};
      const response = await guestAPI.getById(guestId, params);

      if (response.data.success) {
        setSelectedGuest(response.data.data);
        return response.data.data;
      } else {
        setError(response.data.message || 'Failed to load guest');
        return null;
      }
    } catch (err) {
      console.error('Error loading guest:', err);
      setError(err.response?.data?.message || 'Failed to load guest');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load guest reservations with statistics
   */
  const loadGuestReservations = useCallback(async (guestId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await guestAPI.getReservations(guestId);

      if (response.data.success) {
        setGuestReservations(response.data.data.reservations);
        setGuestStatistics(response.data.data.statistics);
        return {
          reservations: response.data.data.reservations,
          statistics: response.data.data.statistics
        };
      } else {
        setError(response.data.message || 'Failed to load guest reservations');
        return null;
      }
    } catch (err) {
      console.error('Error loading guest reservations:', err);
      setError(err.response?.data?.message || 'Failed to load guest reservations');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create new guest
   */
  const createGuest = useCallback(async (guestData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await guestAPI.create(guestData);

      if (response.data.success) {
        await loadGuests();
        return { success: true, guest: response.data.data };
      } else {
        setError(response.data.message || 'Failed to create guest');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error creating guest:', err);
      const errorMsg = err.response?.data?.message || 'Failed to create guest';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadGuests]);

  /**
   * Update existing guest
   */
  const updateGuest = useCallback(async (guestId, guestData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await guestAPI.update(guestId, guestData);

      if (response.data.success) {
        await loadGuests();
        if (selectedGuest?.id === guestId) {
          setSelectedGuest(response.data.data);
        }
        return { success: true, guest: response.data.data };
      } else {
        setError(response.data.message || 'Failed to update guest');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error updating guest:', err);
      const errorMsg = err.response?.data?.message || 'Failed to update guest';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadGuests, selectedGuest]);

  /**
   * Delete guest
   */
  const deleteGuest = useCallback(async (guestId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await guestAPI.delete(guestId);

      if (response.data.success) {
        await loadGuests();
        if (selectedGuest?.id === guestId) {
          setSelectedGuest(null);
        }
        return { success: true };
      } else {
        setError(response.data.message || 'Failed to delete guest');
        return { success: false, error: response.data.message };
      }
    } catch (err) {
      console.error('Error deleting guest:', err);
      const errorMsg = err.response?.data?.message || 'Failed to delete guest';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [loadGuests, selectedGuest]);

  /**
   * Search guests by query
   */
  const searchGuests = useCallback(async (searchQuery) => {
    await loadGuests({ search: searchQuery, page: 1 });
  }, [loadGuests]);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      email: '',
      country: '',
      sortBy: 'createdAt',
      order: 'DESC',
      page: 1,
      limit: 50,
      include: 'reservations'
    });
  }, []);

  /**
   * Get guest statistics from all guests
   */
  const calculateOverallStatistics = useCallback(() => {
    if (!guests.length) {
      return {
        totalGuests: 0,
        totalReservations: 0,
        averageReservationsPerGuest: 0,
        countries: {},
        topCountries: []
      };
    }

    const stats = {
      totalGuests: guests.length,
      totalReservations: 0,
      countries: {}
    };

    guests.forEach(guest => {
      // Count reservations if included
      if (guest.reservations) {
        stats.totalReservations += guest.reservations.length;
      }

      // Track countries
      if (guest.country) {
        stats.countries[guest.country] = (stats.countries[guest.country] || 0) + 1;
      }
    });

    stats.averageReservationsPerGuest = stats.totalGuests > 0
      ? (stats.totalReservations / stats.totalGuests).toFixed(1)
      : 0;

    // Get top 5 countries
    stats.topCountries = Object.entries(stats.countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    return stats;
  }, [guests]);

  /**
   * Get recent guests (last 30 days)
   */
  const getRecentGuests = useCallback(() => {
    if (!guests.length) return [];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return guests
      .filter(guest => new Date(guest.createdAt) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [guests]);

  /**
   * Get guests with most reservations
   */
  const getTopGuests = useCallback((limit = 10) => {
    if (!guests.length) return [];

    return guests
      .filter(guest => guest.reservations && guest.reservations.length > 0)
      .sort((a, b) => (b.reservations?.length || 0) - (a.reservations?.length || 0))
      .slice(0, limit);
  }, [guests]);

  // Auto-load guests on mount
  useEffect(() => {
    loadGuests();
  }, [loadGuests]);

  return {
    // State
    guests,
    selectedGuest,
    guestReservations,
    guestStatistics,
    loading,
    error,
    filters,
    pagination,

    // Actions
    loadGuests,
    loadGuestById,
    loadGuestReservations,
    createGuest,
    updateGuest,
    deleteGuest,
    searchGuests,

    // Filters
    updateFilters,
    clearFilters,

    // Utilities
    setSelectedGuest,
    calculateOverallStatistics,
    getRecentGuests,
    getTopGuests
  };
};
