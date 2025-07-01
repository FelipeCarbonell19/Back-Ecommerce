const { pool } = require('../config/database');

/**
 * Clase para manejar las operaciones relacionadas con los productos en la base de datos.
 */
class Product {
  /**
   * Crea un nuevo producto en la base de datos.
   * @async
   * @static
   * @function create
   * @param {Object} productData - Datos del producto.
   * @param {string} productData.name - Nombre del producto.
   * @param {string} productData.description - Descripción del producto.
   * @param {number} productData.price - Precio del producto.
   * @param {number} [productData.category_id] - ID de la categoría del producto.
   * @param {number} [productData.stock] - Stock del producto.
   * @param {string} [productData.image_url] - URL de la imagen del producto.
   * @param {number} productData.created_by - ID del usuario que creó el producto.
   * @returns {Promise<Object>} - Promesa que resuelve con los datos del producto creado.
   */
  static async create(productData) {
    const { name, description, price, category_id, stock, image_url, created_by } = productData;
    try {
      const [result] = await pool.execute(
        'INSERT INTO products (name, description, price, category_id, stock, image_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, description, price, category_id, stock, image_url, created_by]
      );
      return { id: result.insertId, ...productData };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca todos los productos en la base de datos.
   * @async
   * @static
   * @function findAll
   * @param {number} [limit=50] - Número máximo de productos a devolver.
   * @param {number} [offset=0] - Número de productos a saltar.
   * @returns {Promise<Array>} - Promesa que resuelve con una lista de productos.
   */
  static async findAll(limit = 50, offset = 0) {
    try {
      const sql = 'SELECT * FROM products ORDER BY created_at DESC LIMIT 50';
      const [rows] = await pool.execute(sql);
      return rows;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Busca un producto por su ID.
   * @async
   * @static
   * @function findById
   * @param {number} id - ID del producto.
   * @returns {Promise<Object|null>} - Promesa que resuelve con el producto encontrado o null si no se encuentra.
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name, u.name as created_by_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.id = ?`,
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actualiza un producto existente en la base de datos.
   * @async
   * @static
   * @function update
   * @param {number} id - ID del producto a actualizar.
   * @param {Object} productData - Datos del producto a actualizar.
   * @param {string} productData.name - Nombre del producto.
   * @param {string} productData.description - Descripción del producto.
   * @param {number} productData.price - Precio del producto.
   * @param {number} [productData.category_id] - ID de la categoría del producto.
   * @param {number} [productData.stock] - Stock del producto.
   * @param {string} [productData.image_url] - URL de la imagen del producto.
   * @returns {Promise<Object|null>} - Promesa que resuelve con el producto actualizado o null si no se encuentra.
   */
  static async update(id, productData) {
    const { name, description, price, category_id, stock, image_url } = productData;
    try {
      const [result] = await pool.execute(
        'UPDATE products SET name = ?, description = ?, price = ?, category_id = ?, stock = ?, image_url = ? WHERE id = ?',
        [name, description, price, category_id, stock, image_url, id]
      );
      if (result.affectedRows === 0) {
        return null;
      }
      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Elimina un producto de la base de datos.
   * @async
   * @static
   * @function delete
   * @param {number} id - ID del producto a eliminar.
   * @returns {Promise<Object>} - Promesa que resuelve con el resultado de la operación.
   */
  static async delete(id) {
    try {
      // Verificar si el producto está en pedidos antes de eliminar
      const [orderItems] = await pool.execute(
        'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?',
        [id]
      );

      if (orderItems[0].count > 0) {
        return {
          success: false,
          hasOrders: true,
          ordersCount: orderItems[0].count,
          message: 'No se puede eliminar este producto porque está incluido en pedidos'
        };
      }

      // Si no está en pedidos, proceder con la eliminación
      const [result] = await pool.execute(
        'DELETE FROM products WHERE id = ?',
        [id]
      );

      return {
        success: result.affectedRows > 0,
        hasOrders: false,
        message: result.affectedRows > 0 ? 'Producto eliminado' : 'Producto no encontrado'
      };

    } catch (error) {
      // Manejar error específico de foreign key constraint
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return {
          success: false,
          hasOrders: true,
          error: 'FOREIGN_KEY_CONSTRAINT',
          message: 'No se puede eliminar este producto porque está referenciado en pedidos'
        };
      }

      throw error;
    }
  }

  /**
   * Busca productos por categoría.
   * @async
   * @static
   * @function findByCategory
   * @param {number} categoryId - ID de la categoría.
   * @returns {Promise<Array>} - Promesa que resuelve con una lista de productos de la categoría especificada.
   */
  static async findByCategory(categoryId) {
    try {
      const [rows] = await pool.execute(
        `SELECT p.*, c.name as category_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         WHERE p.category_id = ?
         ORDER BY p.created_at DESC`,
        [categoryId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Product;
