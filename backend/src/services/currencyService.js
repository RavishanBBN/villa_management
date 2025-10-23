// src/services/currencyService.js
// Simple currency service for Halcyon Rest

const axios = require('axios');

class CurrencyService {
  constructor() {
    this.exchangeRate = 300; // Fallback USD to LKR rate
    this.lastUpdated = null;
  }

  async initialize() {
    try {
      await this.updateRates();
      console.log('✅ Currency service initialized');
      return true;
    } catch (error) {
      console.log('⚠️ Using fallback exchange rate:', this.exchangeRate);
      return false;
    }
  }

  async updateRates() {
    try {
      const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD', {
        timeout: 5000
      });
      
      if (response.data && response.data.rates && response.data.rates.LKR) {
        this.exchangeRate = response.data.rates.LKR;
        this.lastUpdated = new Date();
        console.log(`💱 Exchange rate updated: 1 USD = ${this.exchangeRate} LKR`);
      }
    } catch (error) {
      console.log('⚠️ Using fallback exchange rate');
    }
  }

  async convertCurrency(amount, from, to) {
    if (from === to) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        fromCurrency: from,
        toCurrency: to,
        exchangeRate: 1
      };
    }

    let convertedAmount;
    let rate;

    if (from === 'USD' && to === 'LKR') {
      rate = this.exchangeRate;
      convertedAmount = amount * rate;
    } else if (from === 'LKR' && to === 'USD') {
      rate = 1 / this.exchangeRate;
      convertedAmount = amount * rate;
    } else {
      throw new Error(`Conversion between ${from} and ${to} not supported`);
    }

    return {
      originalAmount: amount,
      convertedAmount: Math.round(convertedAmount * 100) / 100,
      fromCurrency: from,
      toCurrency: to,
      exchangeRate: rate
    };
  }

  getCurrentUsdLkrRate() {
    return this.exchangeRate;
  }

  formatCurrency(amount, currency) {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else if (currency === 'LKR') {
      return `Rs. ${Math.round(amount).toLocaleString()}`;
    }
    return `${currency} ${amount}`;
  }
}

module.exports = new CurrencyService();