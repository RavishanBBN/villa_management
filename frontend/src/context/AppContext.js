import React, { createContext, useContext, useState, useCallback } from 'react';
import { currencyAPI } from '../services/api';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  // Global state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currencyRate, setCurrencyRate] = useState(301);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Current user
  const [currentUser] = useState({
    id: 'staff_1',
    name: 'Manager Admin',
    role: 'manager'
  });

  // Load currency rate
  const loadCurrencyRate = useCallback(async () => {
    try {
      const response = await currencyAPI.getRate();
      if (response.data.success && response.data.data.rate) {
        setCurrencyRate(response.data.data.rate);
        console.log('Currency rate loaded:', response.data.data.rate);
      }
    } catch (error) {
      console.error('Failed to load currency rate:', error);
      // Use default rate if API fails
      setCurrencyRate(301);
    }
  }, []);

  // Show success message
  const showSuccess = useCallback((message, duration = 3000) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), duration);
  }, []);

  // Show error message
  const showError = useCallback((message, duration = 5000) => {
    setError(message);
    setTimeout(() => setError(''), duration);
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const value = {
    // State
    activeTab,
    setActiveTab,
    currencyRate,
    setCurrencyRate,
    loading,
    setLoading,
    error,
    success,
    initialLoading,
    setInitialLoading,
    currentUser,

    // Functions
    loadCurrencyRate,
    showSuccess,
    showError,
    clearMessages,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
