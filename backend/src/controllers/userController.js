const { User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../models');

/**
 * Get all users (Admin only)
 * GET /api/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 50 } = req.query;

    // Build where clause
    const where = {};
    
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { rows: users, count } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parseInt(page),
          pages: Math.ceil(count / limit),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
};

/**
 * Get user by ID (Admin only)
 * GET /api/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
};

/**
 * Create new user (Admin only)
 * POST /api/users
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, role, phone, permissions, status } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password, // Will be hashed by hook
      firstName,
      lastName,
      role: role || 'front_desk',
      phone,
      permissions: permissions || [],
      status: status || 'active'
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

/**
 * Update user (Admin only)
 * PUT /api/users/:id
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, firstName, lastName, role, phone, permissions, status, password } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if username/email is being changed and already exists
    if (username && username !== user.username) {
      const existingUsername = await User.findOne({ where: { username } });
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    // Prevent self-demotion from super_admin
    if (req.userId === id && req.userRole === 'super_admin' && role && role !== 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own super_admin role'
      });
    }

    // Update user fields
    if (username) user.username = username;
    if (email) user.email = email;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (permissions) user.permissions = permissions;
    if (status) user.status = status;
    if (password) user.password = password; // Will be hashed by hook

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

/**
 * Delete user (Admin only)
 * DELETE /api/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting super_admin
    if (user.role === 'super_admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete super admin account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Toggle user status (Admin only)
 * PATCH /api/users/:id/status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: active, inactive, or suspended'
      });
    }

    // Prevent self-suspension
    if (req.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.status = status;
    await user.save();

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user }
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Get user statistics (Admin only)
 * GET /api/users/stats
 */
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { status: 'active' } });
    const inactiveUsers = await User.count({ where: { status: 'inactive' } });
    const suspendedUsers = await User.count({ where: { status: 'suspended' } });

    const usersByRole = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('role')), 'count']
      ],
      group: ['role']
    });

    const recentLogins = await User.findAll({
      where: {
        lastLoginAt: {
          [Op.not]: null
        }
      },
      attributes: ['id', 'username', 'firstName', 'lastName', 'lastLoginAt'],
      order: [['lastLoginAt', 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        stats: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          suspended: suspendedUsers
        },
        byRole: usersByRole,
        recentLogins
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
};
