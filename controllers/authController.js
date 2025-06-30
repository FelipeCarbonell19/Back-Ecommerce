const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * Controlador para manejar la autenticación de usuarios.
 */
class AuthController {
  /**
   * Registra un nuevo usuario.
   * @async
   * @function register
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  static async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validar que todos los campos requeridos están presentes
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, contraseña y nombre son requeridos'
        });
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El usuario ya existe'
        });
      }

      // Crear un nuevo usuario
      const newUser = await User.create({ email, password, name });

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Inicia sesión para un usuario existente.
   * @async
   * @function login
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar que todos los campos requeridos están presentes
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      // Buscar usuario por email
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar la contraseña
      const isValidPassword = await User.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Respuesta exitosa con token
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = AuthController;
