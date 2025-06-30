const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para autenticar el token JWT proporcionado en la solicitud.
 * @async
 * @function authenticateToken
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @param {Function} next - Función para pasar al siguiente middleware.
 * @returns {Object} - Respuesta JSON con el estado de la autenticación.
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Verificar si se proporcionó un token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token y decodificarlo
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario por ID decodificado del token
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no válido'
      });
    }

    // Asignar el usuario a la solicitud y continuar con el siguiente middleware
    req.user = user;
    next();
  } catch (error) {
    // Manejar errores de verificación del token
    return res.status(403).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para verificar si el usuario tiene un rol específico.
 * @function requireRole
 * @param {Array<string>} roles - Roles permitidos para acceder al recurso.
 * @returns {Function} - Middleware que verifica el rol del usuario.
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    // Verificar si el usuario está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Verificar si el usuario tiene el rol requerido
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    // Continuar con el siguiente middleware si el usuario tiene el rol requerido
    next();
  };
};

module.exports = { authenticateToken, requireRole };
