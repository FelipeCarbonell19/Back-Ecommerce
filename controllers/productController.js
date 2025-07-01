const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

/**
 * Controlador para manejar las operaciones relacionadas con los productos.
 */
class ProductController {
  /**
   * Crea un nuevo producto.
   * @async
   * @function create
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  static async create(req, res) {
    try {
      // Debug: Ver qué llega en req.body
      console.log('req.body:', req.body);
      console.log('req.file:', req.file);

      const { name, description, price, category_id, stock } = req.body;

      // Validación mejorada para FormData
      if (!name || name.trim() === '' || !price || price === '' || price === '0') {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(400).json({
          success: false,
          message: 'Nombre y precio son requeridos'
        });
      }

      const image_url = req.file ? req.file.filename : null;

      const productData = {
        name: name.trim(),
        description: description ? description.trim() : '',
        price: parseFloat(price),
        category_id: category_id ? parseInt(category_id) : null,
        stock: stock ? parseInt(stock) : 0,
        image_url,
        created_by: req.user.id
      };

      // Debug: Ver datos que se van a crear
      console.log('productData:', productData);

      const newProduct = await Product.create(productData);

      if (newProduct.image_url) {
        newProduct.image_url = `http://localhost:5000/uploads/products/${newProduct.image_url}`;
      }

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        product: newProduct
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error creando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene todos los productos.
   * @async
   * @function getAll
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con todos los productos.
   */
  // static async getAll(req, res) {
  //   try {
  //     const { limit = 50, offset = 0 } = req.query;

  //     const products = await Product.findAll(
  //       parseInt(limit),
  //       parseInt(offset)
  //     );

  //     const productsWithImages = products.map(product => ({
  //       ...product,
  //       image_url: product.image_url ?
  //         `http://localhost:5000/uploads/products/${product.image_url}` :
  //         null,
  //       // Agregar thumbnail para lista
  //       image_thumbnail: product.image_url ?
  //         `http://localhost:5000/uploads/products/${product.image_url}` :
  //         'https://placehold.co/250x192/e5e7eb/6b7280/png?text=Sin+Imagen'
  //     }));

  //     res.json({
  //       success: true,
  //       products: productsWithImages,
  //       total: products.length
  //     });
  //   } catch (error) {
  //     console.error('Error obteniendo productos:', error);
  //     res.status(500).json({
  //       success: false,
  //       message: 'Error interno del servidor'
  //     });
  //   }
  // }
  // controllers/productController.js

  static async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const products = await Product.findAll(limit, offset);
      const baseUrl = `${req.protocol}://${req.get('host')}`;

      const productsWithImages = products.map(product => ({
        ...product,
        image_url: product.image_url ?
          `${baseUrl}/uploads/products/${product.image_url}` :
          null,
        image_thumbnail: product.image_url ?
          `${baseUrl}/uploads/products/${product.image_url}` :
          'https://placehold.co/250x192/e5e7eb/6b7280/png?text=Sin+Imagen'
      }));

      res.json({
        success: true,
        products: productsWithImages,
        total: products.length 
      });
    } catch (error) {
      console.error('Error obteniendo productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un producto por su ID.
   * @async
   * @function getById
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el producto solicitado.
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (product.image_url) {
        product.image_url = `http://localhost:5000/uploads/products/${product.image_url}`;
        product.image_thumbnail = `http://localhost:5000/uploads/products/${product.image_url}`;
      } else {
        product.image_thumbnail = 'https://placehold.co/250x192/e5e7eb/6b7280/png?text=Sin+Imagen';
      }

      res.json({
        success: true,
        product
      });
    } catch (error) {
      console.error('Error obteniendo producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Actualiza un producto existente.
   * @async
   * @function update
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  /**
   * Actualiza un producto existente.
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description, price, category_id, stock } = req.body;

      // Debug: Ver qué llega
      console.log('UPDATE - req.body:', req.body);
      console.log('UPDATE - req.file:', req.file);

      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      let image_url = existingProduct.image_url;

      if (req.file) {
        if (image_url) {
          const oldImagePath = path.join(__dirname, '../uploads/products/', image_url);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        image_url = req.file.filename;
      }

      const productData = {
        name: name ? name.trim() : existingProduct.name,
        description: description ? description.trim() : existingProduct.description,
        price: price ? parseFloat(price) : existingProduct.price,
        category_id: category_id ? parseInt(category_id) : existingProduct.category_id,
        stock: stock ? parseInt(stock) : existingProduct.stock,
        image_url
      };

      const updatedProduct = await Product.update(id, productData);

      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      if (updatedProduct.image_url) {
        updatedProduct.image_url = `http://localhost:5000/uploads/products/${updatedProduct.image_url}`;
      }

      res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        product: updatedProduct
      });
    } catch (error) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Error actualizando producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

/**
 * Elimina un producto.
 * @async
 * @function delete
 * @param {Object} req - Objeto de solicitud de Express.
 * @param {Object} res - Objeto de respuesta de Express.
 * @returns {Object} - Respuesta JSON con el estado de la operación.
 */
static async delete(req, res) {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Usar el nuevo método delete que maneja foreign keys
    const deleteResult = await Product.delete(id);

    if (!deleteResult.success) {
      if (deleteResult.hasOrders) {
        return res.status(400).json({
          success: false,
          message: deleteResult.message,
          hasOrders: true,
          ordersCount: deleteResult.ordersCount || 'N/A'
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }
    }

    // Si la eliminación fue exitosa, eliminar imagen física
    if (product.image_url) {
      const imagePath = path.join(__dirname, '../uploads/products/', product.image_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('✅ Imagen eliminada:', product.image_url);
        } catch (imageError) {
          console.warn('⚠️ Error eliminando imagen:', imageError.message);
        }
      }
    }

    console.log('✅ Producto eliminado exitosamente:', id);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

}

module.exports = ProductController;