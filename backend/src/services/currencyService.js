// src/services/currencyService.js
/**
 * Currency Service
 * Handles exchange rate updates and currency conversions
 */

const axios = require('axios');

class CurrencyService {
  constructor() {
    this.exchangeRate = 300; // Fallback rate
    this.lastUpdated = null;
  }

  async updateExchangeRate() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
      if (response.data && response.data.rates && response.data.rates.LKR) {
        this.exchangeRate = response.data.rates.LKR;
        this.lastUpdated = new Date().toISOString();
        console.log(`✅ Exchange rate updated: 1 USD = ${this.exchangeRate} LKR`);
      }
    } catch (error) {
      console.log('⚠️ Using fallback exchange rate:', this.exchangeRate);
    }
  }

  getRate() {
    return this.exchangeRate;
  }

  getLastUpdated() {
    return this.lastUpdated;
  }

  convert(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    
    if (fromCurrency === 'USD' && toCurrency === 'LKR') {
      return amount * this.exchangeRate;
    }
    
    if (fromCurrency === 'LKR' && toCurrency === 'USD') {
      return amount / this.exchangeRate;
    }
    
    return amount;
  }

  startAutoUpdate(intervalMs = 3600000) {
    // Update immediately
    this.updateExchangeRate();
    
    // Then update every interval (default: 1 hour)
    setInterval(() => {
      this.updateExchangeRate();
    }, intervalMs);
  }
}

module.exports = new CurrencyService();