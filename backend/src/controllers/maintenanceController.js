const db = require('../database/db');

// Create maintenance request
exports.createMaintenance = async (req, res) => {
  try {
    const {
      propertyId,
      title,
      description,
      priority,
      category,
      assignedTo,
      scheduledDate
    } = req.body;

    if (!propertyId || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: propertyId, title, description'
      });
    }

    const result = await db.run(
      `INSERT INTO maintenance (
        propertyId, title, description, priority, category,
        assignedTo, scheduledDate, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        propertyId,
        title,
        description,
        priority || 'medium',
        category || 'general',
        assignedTo || null,
        scheduledDate || null,
        'pending'
      ]
    );

    const maintenance = await db.get('SELECT * FROM maintenance WHERE id = ?', [result.lastID]);

    res.status(201).json({
      success: true,
      message: 'Maintenance request created successfully',
      data: maintenance
    });
  } catch (error) {
    console.error('Error creating maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create maintenance request',
      error: error.message
    });
  }
};

// Get all maintenance requests
exports.getAllMaintenance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      priority,
      propertyId,
      category
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      whereClause += ' AND priority = ?';
      params.push(priority);
    }

    if (propertyId) {
      whereClause += ' AND propertyId = ?';
      params.push(propertyId);
    }

    if (category) {
      whereClause += ' AND category = ?';
      params.push(category);
    }

    const countQuery = `SELECT COUNT(*) as total FROM maintenance ${whereClause}`;
    const { total } = await db.get(countQuery, params);

    const query = `
      SELECT * FROM maintenance
      ${whereClause}
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          WHEN 'low' THEN 4 
        END,
        createdAt DESC
      LIMIT ? OFFSET ?
    `;
    params.push(parseInt(limit), offset);

    const maintenance = await db.all(query, params);

    res.json({
      success: true,
      data: maintenance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance requests',
      error: error.message
    });
  }
};

// Get maintenance by ID
exports.getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const maintenance = await db.get('SELECT * FROM maintenance WHERE id = ?', [id]);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    res.json({
      success: true,
      data: maintenance
    });
  } catch (error) {
    console.error('Error getting maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve maintenance request',
      error: error.message
    });
  }
};

// Update maintenance
exports.updateMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const maintenance = await db.get('SELECT * FROM maintenance WHERE id = ?', [id]);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    const allowedFields = [
      'title', 'description', 'priority', 'category', 'status',
      'assignedTo', 'scheduledDate', 'completedDate', 'notes', 'cost'
    ];

    const updateFields = [];
    const values = [];

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
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
      `UPDATE maintenance SET ${updateFields.join(', ')}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    const updatedMaintenance = await db.get('SELECT * FROM maintenance WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Maintenance request updated successfully',
      data: updatedMaintenance
    });
  } catch (error) {
    console.error('Error updating maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update maintenance request',
      error: error.message
    });
  }
};

// Delete maintenance
exports.deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;

    const maintenance = await db.get('SELECT * FROM maintenance WHERE id = ?', [id]);

    if (!maintenance) {
      return res.status(404).json({
        success: false,
        message: 'Maintenance request not found'
      });
    }

    await db.run('DELETE FROM maintenance WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Maintenance request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete maintenance request',
      error: error.message
    });
  }
};
