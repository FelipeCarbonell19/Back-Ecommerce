const express = require('express');
const ProductController = require('../controllers/productController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload'); 

const router = express.Router();

/**
 * @route GET /
 * @description Ruta para obtener todos los productos.
 * @access Public
 */
router.get('/', ProductController.getAll);

/**
 * @route GET /:id
 * @description Ruta para obtener un producto específico por su ID.
 * @access Public
 */
router.get('/:id', ProductController.getById);

/**
 * @route POST /
 * @description Ruta para crear un nuevo producto. Solo accesible para administradores y vendedores.
 * @access Private (Admin o Vendedor)
 */
router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'seller']),
  upload.single('image'),
  ProductController.create
);

/**
 * @route PUT /:id
 * @description Ruta para actualizar un producto existente. Solo accesible para administradores y vendedores.
 * @access Private (Admin o Vendedor)
 */
router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'seller']),
  upload.single('image'),
  ProductController.update
);

/**
 * @route DELETE /:id
 * @description Ruta para eliminar un producto. Solo accesible para administradores y vendedores.
 * @access Private (Admin o Vendedor)
 */
router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'seller']),
  ProductController.delete
);

module.exports = router;