const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");

const getBaseUrl = (req) => `${req.protocol}://${req.get("host")}`;

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
      const { name, description, price, category_id, stock } = req.body;
      if (!name || !price) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ message: "Nombre y precio son requeridos" });
      }

      const image_url = req.file ? req.file.filename : null;

      const productData = {
        name,
        description,
        price: parseFloat(price),
        category_id: category_id ? parseInt(category_id) : null,
        stock: stock ? parseInt(stock) : 0,
        image_url,
        created_by: req.user.id,
      };

      const newProduct = await Product.create(productData);

      if (newProduct.image_url) {
        newProduct.image_url = `${getBaseUrl(req)}/uploads/products/${
          newProduct.image_url
        }`;
      }

      res
        .status(201)
        .json({
          success: true,
          message: "Producto creado exitosamente",
          product: newProduct,
        });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error("Error creando producto:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
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

  static async getAll(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;
      const products = await Product.findAll(limit, offset);
      const baseUrl = getBaseUrl(req);

      const productsWithImages = products.map((product) => ({
        ...product,
        image_url: product.image_url
          ? `${baseUrl}/uploads/products/${product.image_url}`
          : null,
        image_thumbnail: product.image_url
          ? `${baseUrl}/uploads/products/${product.image_url}`
          : "https://placehold.co/250x192/e5e7eb/6b7280/png?text=Sin+Imagen",
      }));

      res.json({
        success: true,
        products: productsWithImages,
        total: products.length,
      });
    } catch (error) {
      console.error("Error obteniendo productos:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
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
        return res
          .status(404)
          .json({ success: false, message: "Producto no encontrado" });
      }

      const baseUrl = getBaseUrl(req);
      if (product.image_url) {
        product.image_url = `${baseUrl}/uploads/products/${product.image_url}`;
        product.image_thumbnail = `${baseUrl}/uploads/products/${product.image_url}`;
      } else {
        product.image_thumbnail =
          "https://placehold.co/250x192/e5e7eb/6b7280/png?text=Sin+Imagen";
      }

      res.json({ success: true, product });
    } catch (error) {
      console.error("Error obteniendo producto:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
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
      const existingProduct = await Product.findById(id);

      if (!existingProduct) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res
          .status(404)
          .json({ success: false, message: "Producto no encontrado" });
      }

      let image_url = existingProduct.image_url;
      if (req.file) {
        if (image_url) {
          const oldImagePath = path.join(
            __dirname,
            "../uploads/products/",
            image_url
          );
          if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
        }
        image_url = req.file.filename;
      }

      const productData = {
        name,
        description,
        price,
        category_id,
        stock,
        image_url,
      };
      const updatedProduct = await Product.update(id, productData);

      const baseUrl = getBaseUrl(req);
      if (updatedProduct.image_url) {
        updatedProduct.image_url = `${baseUrl}/uploads/products/${updatedProduct.image_url}`;
      }

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        product: updatedProduct,
      });
    } catch (error) {
      if (req.file) fs.unlinkSync(req.file.path);
      console.error("Error actualizando producto:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
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
        return res
          .status(404)
          .json({ success: false, message: "Producto no encontrado" });
      }

      const deleteResult = await Product.delete(id);
      if (!deleteResult.success) {
        return res
          .status(400)
          .json({ success: false, message: deleteResult.message });
      }

      if (product.image_url) {
        const imagePath = path.join(
          __dirname,
          "../uploads/products/",
          product.image_url
        );
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      }

      res.json({ success: true, message: "Producto eliminado exitosamente" });
    } catch (error) {
      console.error("Error eliminando producto:", error);
      res
        .status(500)
        .json({ success: false, message: "Error interno del servidor" });
    }
  }
}

module.exports = ProductController;
