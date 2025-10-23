import { useState, useCallback } from 'react';
import { propertyAPI } from '../services/api';

export const useProperties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all properties
  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.getAll();
      if (response.data.success) {
        setProperties(response.data.data || []);
        console.log('Properties loaded:', response.data.data?.length || 0);
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      setError('Failed to load properties');
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get property by ID
  const getPropertyById = useCallback((id) => {
    return properties.find(p => p.id === id);
  }, [properties]);

  // Get property by unit ID
  const getPropertyByUnitId = useCallback((unitId) => {
    return properties.find(p => p.id === unitId);
  }, [properties]);

  // Create property
  const createProperty = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.create(data);
      if (response.data.success) {
        await loadProperties();
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to create property:', err);
      setError('Failed to create property');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProperties]);

  // Update property
  const updateProperty = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.update(id, data);
      if (response.data.success) {
        await loadProperties();
        return { success: true, data: response.data.data };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to update property:', err);
      setError('Failed to update property');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProperties]);

  // Delete property
  const deleteProperty = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await propertyAPI.delete(id);
      if (response.data.success) {
        await loadProperties();
        return { success: true };
      }
      return { success: false, error: response.data.message };
    } catch (err) {
      console.error('Failed to delete property:', err);
      setError('Failed to delete property');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadProperties]);

  return {
    properties,
    loading,
    error,
    loadProperties,
    getPropertyById,
    getPropertyByUnitId,
    createProperty,
    updateProperty,
    deleteProperty,
  };
};
