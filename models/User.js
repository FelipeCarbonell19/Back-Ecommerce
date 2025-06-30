const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Clase para manejar las operaciones relacionadas con los usuarios en la base de datos.
 */
class User {
  /**
   * Crea un nuevo usuario en la base de datos.
   * @async
   * @static
   * @function create
   * @param {Object} userData - Datos del usuario.
   * @param {string} userData.email - Correo electrónico del usuario.
   * @param {string} userData.password - Contraseña del usuario.
   * @param {string} userData.name - Nombre del usuario.
   * @param {string} [userData.role='client'] - Rol del usuario.
   * @returns {Promise<Object>} - Promesa que resuelve con los datos del usuario creado.
   */
  static async create(userData) {
    const { email, password, name, role = 'client' } = userData;
    try {
      // Hashear la contraseña antes de guardarla en la base de datos
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar el nuevo usuario en la base de datos
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, role]
      );

      // Retornar los datos del usuario creado
      return { id: result.insertId, email, name, role };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca un usuario por su correo electrónico.
   * @async
   * @static
   * @function findByEmail
   * @param {string} email - Correo electrónico del usuario.
   * @returns {Promise<Object|null>} - Promesa que resuelve con el usuario encontrado o null si no se encuentra.
   */
  static async findByEmail(email) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca un usuario por su ID.
   * @async
   * @static
   * @function findById
   * @param {number} id - ID del usuario.
   * @returns {Promise<Object|null>} - Promesa que resuelve con el usuario encontrado o null si no se encuentra.
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica si una contraseña en texto plano coincide con un hash de contraseña.
   * @async
   * @static
   * @function verifyPassword
   * @param {string} plainPassword - Contraseña en texto plano.
   * @param {string} hashedPassword - Hash de la contraseña almacenada.
   * @returns {Promise<boolean>} - Promesa que resuelve con un booleano indicando si la contraseña es válida.
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
