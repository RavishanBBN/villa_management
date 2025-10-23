const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

/**
 * All user management routes require authentication and admin/super_admin role
 */

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', verifyToken, requireRole('super_admin', 'admin'), userController.getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users with filters
 * @access  Private (Admin only)
 */
router.get('/', verifyToken, requireRole('super_admin', 'admin'), userController.getAllUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', verifyToken, requireRole('super_admin', 'admin'), userController.getUserById);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', verifyToken, requireRole('super_admin', 'admin'), userController.createUser);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', verifyToken, requireRole('super_admin', 'admin'), userController.updateUser);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (Super Admin only)
 */
router.delete('/:id', verifyToken, requireRole('super_admin'), userController.deleteUser);

/**
 * @route   PATCH /api/users/:id/status
 * @desc    Toggle user status (active/inactive/suspended)
 * @access  Private (Admin only)
 */
router.patch('/:id/status', verifyToken, requireRole('super_admin', 'admin'), userController.toggleUserStatus);

module.exports = router;
