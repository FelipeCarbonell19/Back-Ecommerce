const express = require('express');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /register
 * @description Ruta pública para registrar un nuevo usuario.
 * @access Public
 */
router.post('/register', AuthController.register);

/**
 * @route POST /login
 * @description Ruta pública para iniciar sesión.
 * @access Public
 */
router.post('/login', AuthController.login);

/**
 * @route GET /me
 * @description Ruta protegida para obtener el perfil del usuario autenticado.
 * @access Private
 * @returns {Object} - Respuesta JSON con los datos del usuario autenticado.
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      created_at: req.user.created_at
    }
  });
});

module.exports = router;
