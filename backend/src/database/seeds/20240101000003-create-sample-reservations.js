// Database Seed: Create Sample Guests and Reservations for Testing
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, create sample guests
    const guest1Id = uuidv4();
    const guest2Id = uuidv4();
    const guest3Id = uuidv4();

    const guests = [
      {
        id: guest1Id,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+94771234567',
        country: 'Sri Lanka',
        nationality: 'Sri Lankan',
        address: JSON.stringify({
          street: '123 Main St',
          city: 'Colombo',
          postalCode: '00100',
          country: 'Sri Lanka'
        }),
        preferences: JSON.stringify({
          roomType: 'ground_floor',
          bedType: 'queen'
        }),
        isVip: false,
        blacklisted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: guest2Id,
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.j@email.com',
        phone: '+94777654321',
        country: 'Sri Lanka',
        nationality: 'British',
        address: JSON.stringify({
          street: '456 Beach Road',
          city: 'Galle',
          postalCode: '80000',
          country: 'Sri Lanka'
        }),
        preferences: JSON.stringify({
          roomType: 'any',
          specialNeeds: 'baby_cot'
        }),
        isVip: true,
        blacklisted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: guest3Id,
        firstName: 'David',
        lastName: 'Lee',
        email: 'david.lee@email.com',
        phone: '+94772345678',
        country: 'Sri Lanka',
        nationality: 'American',
        address: JSON.stringify({
          street: '789 Lake View',
          city: 'Kandy',
          postalCode: '20000',
          country: 'Sri Lanka'
        }),
        preferences: JSON.stringify({}),
        isVip: false,
        blacklisted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('guests', guests, {});

    // Get property IDs
    const properties = await queryInterface.sequelize.query(
      'SELECT id, name FROM properties ORDER BY name LIMIT 2;',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (properties.length < 2) {
      console.log('Not enough properties found. Skipping reservation creation.');
      return;
    }

    const [firstFloor, groundFloor] = properties; // Alphabetically ordered
    
    // Create reservations
    const reservations = [
      {
        id: uuidv4(),
        confirmationNumber: 'HRC-2024-001',
        propertyId: groundFloor.id,
        guestId: guest1Id,
        checkInDate: '2024-02-15',
        checkOutDate: '2024-02-20',
        nights: 5,
        adults: 2,
        children: 1,
        childrenAges: JSON.stringify([8]),
        totalAmount: 168000,
        currency: 'LKR',
        status: 'confirmed',
        paymentStatus: 'advance_payment',
        source: 'direct',
        specialRequests: 'Early check-in if possible',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        confirmationNumber: 'HRC-2024-002',
        propertyId: firstFloor.id,
        guestId: guest2Id,
        checkInDate: '2024-03-01',
        checkOutDate: '2024-03-07',
        nights: 6,
        adults: 4,
        children: 2,
        childrenAges: JSON.stringify([3, 6]),
        totalAmount: 198000,
        currency: 'LKR',
        status: 'confirmed',
        paymentStatus: 'full_payment',
        source: 'airbnb',
        specialRequests: 'Need baby cot',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        confirmationNumber: 'HRC-2024-003',
        propertyId: groundFloor.id,
        guestId: guest3Id,
        checkInDate: '2024-04-10',
        checkOutDate: '2024-04-13',
        nights: 3,
        adults: 2,
        children: 0,
        childrenAges: JSON.stringify([]),
        totalAmount: 100800,
        currency: 'LKR',
        status: 'pending',
        paymentStatus: 'not_paid',
        source: 'phone',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('reservations', reservations, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('reservations', null, {});
    await queryInterface.bulkDelete('guests', null, {});
  }
};
