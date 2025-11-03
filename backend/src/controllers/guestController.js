const db = require('../database/db');

// Create a new guest
exports.createGuest = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      country,
      nationality,
      passportNumber,
      dateOfBirth,
      address,
      isVip,
      preferences,
      notes
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email'
      });
    }

    // Check if guest already exists
    const existingGuest = await db.get(
      'SELECT * FROM guests WHERE email = ?',
      [email]
    );

    if (existingGuest) {
      return res.status(409).json({
        success: false,
        message: 'Guest with this email already exists',
        data: existingGuest
      });
    }

    const result = await db.run(
      `INSERT INTO guests (
        firstName, lastName, email, phone, country, nationality,
        passportNumber, dateOfBirth, address, isVip, preferences, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        lastName,
        email,
        phone || null,
        country || null,
        nationality || null,
        passportNumber || null,
        dateOfBirth || null,
        JSON.stringify(address || {}),
        isVip ? 1 : 0,
        JSON.stringify(preferences || {}),
        notes || null
      ]
    );

    const guest = await db.get('SELECT * FROM guests WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Guest created successfully',
      data: {
        ...guest,
        address: JSON.parse(guest.address || '{}'),
        preferences: JSON.parse(guest.preferences || '{}')
      }
    });
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create guest',
      error: error.message
    });
  }
};

// Get all guests with pagination and search
exports.getAllGuests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      sortBy = 'createdAt',
      order = 'DESC',
      isVip
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ` AND (firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (isVip !== undefined) {
      whereClause += ' AND isVip = ?';
      params.push(isVip === 'true' ? 1 : 0);
    }

    const countQuery = `SELECT COUNT(*) as total FROM guests ${whereClause}`;
    const { total } = await db.get(countQuery, params);

    const query = `
      SELECT * FROM guests
      ${whereClause}
      ORDER BY ${sortBy} ${order}
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const guests = await db.all(query, params);

    const guestsWithParsedData = guests.map(guest => ({
      ...guest,
      address: JSON.parse(guest.address || '{}'),
      preferences: JSON.parse(guest.preferences || '{}'),
      isVip: Boolean(guest.isVip)
    }));

    res.json({
      success: true,
      data: guestsWithParsedData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting guests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve guests',
      error: error.message
    });
  }
};

// Get guest by ID
exports.getGuestById = async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await db.get('SELECT * FROM guests WHERE id = ?', [id]);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...guest,
        address: JSON.parse(guest.address || '{}'),
        preferences: JSON.parse(guest.preferences || '{}'),
        isVip: Boolean(guest.isVip)
      }
    });
  } catch (error) {
    console.error('Error getting guest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve guest',
      error: error.message
    });
  }
};

// Update guest
exports.updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const guest = await db.get('SELECT * FROM guests WHERE id = ?', [id]);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'country', 'nationality',
      'passportNumber', 'dateOfBirth', 'address', 'isVip', 'preferences', 'notes'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        if (key === 'address' || key === 'preferences') {
          values.push(JSON.stringify(updates[key]));
        } else if (key === 'isVip') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    values.push(id);

    await db.run(
      `UPDATE guests SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const updatedGuest = await db.get('SELECT * FROM guests WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Guest updated successfully',
      data: {
        ...updatedGuest,
        address: JSON.parse(updatedGuest.address || '{}'),
        preferences: JSON.parse(updatedGuest.preferences || '{}'),
        isVip: Boolean(updatedGuest.isVip)
      }
    });
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update guest',
      error: error.message
    });
  }
};

// Delete guest (soft delete)
exports.deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await db.get('SELECT * FROM guests WHERE id = ?', [id]);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    // Check if guest has active reservations
    const activeReservations = await db.all(
      `SELECT * FROM reservations 
       WHERE guestId = ? 
       AND status IN ('confirmed', 'checked_in')
       AND checkOut >= date('now')`,
      [id]
    );

    if (activeReservations.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete guest with active reservations',
        activeReservations: activeReservations.length
      });
    }

    // Soft delete by adding deleted timestamp
    await db.run(
      'UPDATE guests SET deletedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Guest deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete guest',
      error: error.message
    });
  }
};

// Get guest reservations
exports.getGuestReservations = async (req, res) => {
  try {
    const { id } = req.params;

    const guest = await db.get('SELECT * FROM guests WHERE id = ?', [id]);

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Guest not found'
      });
    }

    const reservations = await db.all(
      `SELECT r.*, p.name as propertyName 
       FROM reservations r
       LEFT JOIN properties p ON r.propertyId = p.id
       WHERE r.guestId = ?
       ORDER BY r.checkIn DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        guest: {
          ...guest,
          address: JSON.parse(guest.address || '{}'),
          preferences: JSON.parse(guest.preferences || '{}'),
          isVip: Boolean(guest.isVip)
        },
        reservations: reservations.map(r => ({
          ...r,
          guestInfo: JSON.parse(r.guestInfo || '{}')
        }))
      }
    });
  } catch (error) {
    console.error('Error getting guest reservations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve guest reservations',
      error: error.message
    });
  }
};
