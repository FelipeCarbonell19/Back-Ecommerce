const express = require('express');
const UserController = require('../controllers/userController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * @route GET /api/admin/users
 * @description Obtiene todos los usuarios del sistema. Solo accesible para administradores.
 * @access Private (Solo Admin)
 */
router.get(
  '/',
  authenticateToken,
  requireRole(['admin']),
  UserController.getAllUsers
);

/**
 * @route PUT /api/admin/users/:id/role
 * @description Actualiza el rol de un usuario específico. Solo accesible para administradores.
 * @access Private (Solo Admin)
 */
router.put(
  '/:id/role',
  authenticateToken,
  requireRole(['admin']),
  UserController.updateUserRole
);

/**
 * @route GET /api/admin/users/stats
 * @description Obtiene estadísticas básicas de usuarios. Solo accesible para administradores.
 * @access Private (Solo Admin)
 */
router.get(
  '/stats',
  authenticateToken,
  requireRole(['admin']),
  UserController.getUserStats
);

module.exports = router;