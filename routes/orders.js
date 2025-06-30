const express = require('express');
const OrderController = require('../controllers/orderController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// 🧪 RUTA DE PRUEBA PDF CON GENERACIÓN REAL
router.get('/test-pdf', async (req, res) => {
  try {
    const { generateOrderReceipt } = require('../utils/pdfGenerator');
    
    console.log('📄 Iniciando prueba de PDF...');
    
    // Datos de prueba realistas
    const orderData = {
      id: 123,
      total_amount: 299990,
      items: [
        {
          product_name: 'iPhone 15',
          quantity: 1,
          subtotal: 250000
        },
        {
          product_name: 'Funda Protectora',
          quantity: 1,
          subtotal: 49990
        }
      ],
      shipping_info: {
        name: 'Juan Pérez',
        email: 'juan@test.com',
        address: 'Calle 123 #45-67, Bogotá'
      }
    };

    console.log('🔄 Generando PDF...');
    const result = await generateOrderReceipt(orderData);
    console.log('✅ PDF generado:', result);
    
    res.json({
      success: true,
      message: 'PDF generado exitosamente! 🎉',
      result: result,
      view_pdf: `http://localhost:5000${result.url}`,
      download_pdf: `http://localhost:5000${result.url}`
    });

  } catch (error) {
    console.error('❌ Error en test-pdf:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando PDF',
      error: error.message
    });
  }
});

// Aplicar autenticación a las demás rutas
router.use(authenticateToken);

/**
 * @route POST /
 * @description Crear un nuevo pedido
 * @access Private
 */
router.post('/', OrderController.create);

/**
 * @route GET /my-orders
 * @description Obtener los pedidos del usuario autenticado
 * @access Private
 */
router.get('/my-orders', OrderController.getMyOrders);

/**
 * @route GET /
 * @description Obtener todos los pedidos (solo admin/seller)
 * @access Private (Admin/Seller)
 */
router.get('/', requireRole(['admin', 'seller']), OrderController.getAll);

/**
 * @route GET /:id
 * @description Obtener un pedido específico por ID
 * @access Private
 */
router.get('/:id', OrderController.getById);

/**
 * @route PUT /:id/status
 * @description Actualizar el estado de un pedido (solo admin/seller)
 * @access Private (Admin/Seller)
 */
router.put('/:id/status', requireRole(['admin', 'seller']), OrderController.updateStatus);

module.exports = router;