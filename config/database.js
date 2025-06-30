const mysql = require('mysql2/promise');
require('dotenv').config(); // Carga las variables de entorno desde el archivo .env

/**
 * Configuración de la conexión a la base de datos MySQL.
 * @type {Object}
 * @property {string} host - El host de la base de datos.
 * @property {number} port - El puerto de la base de datos.
 * @property {string} user - El usuario de la base de datos.
 * @property {string} password - La contraseña del usuario de la base de datos.
 * @property {string} database - El nombre de la base de datos.
 * @property {boolean} waitForConnections - Indica si esperar por conexiones disponibles.
 * @property {number} connectionLimit - El límite de conexiones en el pool.
 * @property {number} queueLimit - El límite de cola para solicitudes de conexión.
 */
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

/**
 * Pool de conexiones a la base de datos MySQL.
 * @type {Object}
 */
const pool = mysql.createPool(dbConfig);

/**
 * Prueba la conexión a la base de datos.
 * @async
 * @function testConnection
 * @returns {Promise<boolean>} - Promesa que resuelve a `true` si la conexión es exitosa, `false` en caso contrario.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos exitosa');
    connection.release(); // Libera la conexión de vuelta al pool
    return true;
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    return false;
  }
}

module.exports = { pool, testConnection };
