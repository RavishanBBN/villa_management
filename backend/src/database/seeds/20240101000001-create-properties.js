// Database Seed: Create Initial Properties
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const properties = [
      {
        id: uuidv4(),
        name: 'Halcyon Rest - Ground Floor',
        unit: 'Ground Floor Unit',
        description: '2 Bedrooms with attached bathrooms, kitchen, living area, garden access',
        maxAdults: 4,
        maxChildren: 3,
        basePrice: 33600.00,
        currency: 'LKR',
        amenities: JSON.stringify([
          '2 Bedrooms with attached bathrooms',
          'Kitchen',
          'Living area',
          'Garden access',
          'Washing machine',
          'Air conditioning',
          'Free WiFi',
          'Ground floor access'
        ]),
        isActive: true,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Halcyon Rest - First Floor',
        unit: 'First Floor Unit',
        description: '2 Bedrooms with attached bathrooms, kitchen, living area, balcony with view',
        maxAdults: 4,
        maxChildren: 3,
        basePrice: 33000.00,
        currency: 'LKR',
        amenities: JSON.stringify([
          '2 Bedrooms with attached bathrooms',
          'Kitchen',
          'Living area',
          'Balcony with view',
          'Washing machine',
          'Air conditioning',
          'Free WiFi',
          'First floor with stairs'
        ]),
        isActive: true,
        checkInTime: '14:00',
        checkOutTime: '11:00',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    await queryInterface.bulkInsert('properties', properties, {});
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('properties', null, {});
  }
};
