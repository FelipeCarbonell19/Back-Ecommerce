const Order = require('../models/Order');
const Product = require('../models/Product');
const { maskCardNumber } = require('../utils/cardUtils');
const { pool } = require('../config/database');

/**
 * Controlador para manejar las operaciones relacionadas con los pedidos.
 */
class OrderController {
  /**
   * Crea un nuevo pedido.
   * @async
   * @function create
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  static async create(req, res) {
    try {
      const {
        items,
        shipping_data,
        payment_data
      } = req.body;

      const user_id = req.user.id;

      // Validaciones existentes
      if (!shipping_data || !payment_data) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren datos de envío y pago'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'El pedido debe contener al menos un producto'
        });
      }

      let total_amount = 0;
      const orderItems = [];

      // Procesar items
      for (const item of items) {
        const { product_id, quantity } = item;

        if (!product_id || !quantity || quantity <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Producto ID y cantidad son requeridos'
          });
        }

        const product = await Product.findById(product_id);
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto con ID ${product_id} no encontrado`
          });
        }

        if (product.stock < quantity) {
          return res.status(400).json({
            success: false,
            message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`
          });
        }

        const subtotal = parseFloat(product.price) * quantity;
        total_amount += subtotal;

        orderItems.push({
          product_id,
          product_name: product.name,
          quantity,
          unit_price: product.price,
          subtotal
        });
      }

      // Enmascarar tarjeta
      let maskedCardNumber = null;
      if (payment_data.card_number) {
        try {
          maskedCardNumber = maskCardNumber(payment_data.card_number);
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: 'Número de tarjeta inválido'
          });
        }
      }

      // Preparar datos del pedido
      const orderData = {
        user_id,
        items: orderItems,
        total_amount: total_amount.toFixed(2),
        shipping_data: {
          full_name: shipping_data.fullName,
          email: shipping_data.email,
          phone: shipping_data.phone,
          address: shipping_data.address,
          city: shipping_data.city,
          zip_code: shipping_data.zipCode,
          notes: shipping_data.notes || null
        },
        payment_data: {
          transaction_id: payment_data.transaction_id,
          card_type: payment_data.card_type,
          card_masked: maskedCardNumber
        }
      };

      console.log('🎯 CREANDO PEDIDO CON PDF INTEGRADO');

      // 🔥 EL MODELO SE ENCARGA DE TODO (PEDIDO + PDF)
      const newOrder = await Order.create(orderData);

      // Respuesta exitosa
      res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        order: {
          id: newOrder.id,
          total_amount: total_amount.toFixed(2),
          status: 'pending',
          items: orderItems.length,
          shipping_address: `${shipping_data.address}, ${shipping_data.city}`,
          payment_method: `${payment_data.card_type} ${maskedCardNumber}`
        },
        receipt_url: newOrder.receipt_url  // 🔥 VIENE DEL MODELO
      });

    } catch (error) {
      console.error('Error creando pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene los pedidos del usuario actual.
   * @async
   * @function getMyOrders
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con los pedidos del usuario.
   */
  static async getMyOrders(req, res) {
    try {
      const userId = req.user.id;

      const [orders] = await pool.execute(`
      SELECT id, total_amount, status, receipt_url, created_at
      FROM orders 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `, [userId]);


      res.json({
        success: true,
        orders: orders || []
      });

    } catch (error) {
      console.error('❌ Error en getMyOrders:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pedidos: ' + error.message
      });
    }
  }


  /**
   * Obtiene todos los pedidos.
   * @async
   * @function getAll
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con todos los pedidos.
   */
  static async getAll(req, res) {
    try {
      const orders = await Order.findAll();
      res.json({
        success: true,
        orders,
        total: orders.length
      });
    } catch (error) {
      console.error('Error obteniendo todos los pedidos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * Obtiene un pedido por su ID.
   * @async
   * @function getById
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el pedido solicitado.
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('🔍 Obteniendo pedido:', id, 'para usuario:', userId);

      // Consulta simple del pedido
      const [orderRows] = await pool.execute(`
      SELECT o.*, 
             o.receipt_url,
             u.name as user_name, 
             u.email as user_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [id]);

      if (orderRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      const order = orderRows[0];

      // Verificar permisos
      if (userRole === 'client' && order.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver este pedido'
        });
      }

      // Obtener items del pedido
      const [itemsRows] = await pool.execute(`
      SELECT oi.*, p.name as product_name, p.image_url
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

      order.items = itemsRows || [];

      // 🔥 OBTENER DATOS DE SHIPPING Y PAYMENT DE TABLAS SEPARADAS
      try {
        const [shippingRows] = await pool.execute(`
        SELECT * FROM shipping_info WHERE order_id = ?
      `, [id]);

        if (shippingRows.length > 0) {
          order.shipping_info = shippingRows[0];
        }
      } catch (shippingError) {
        console.log('⚠️ No hay shipping_info para pedido', id);
      }

      try {
        const [paymentRows] = await pool.execute(`
        SELECT * FROM payment_info WHERE order_id = ?
      `, [id]);

        if (paymentRows.length > 0) {
          order.payment_info = paymentRows[0];
        }
      } catch (paymentError) {
        console.log('⚠️ No hay payment_info para pedido', id);
      }

      console.log('✅ Pedido encontrado con receipt_url:', order.receipt_url);

      const response = {
        success: true,
        data: { order }
      };

      console.log('📤 ENVIANDO RESPUESTA AL FRONTEND:');
      console.log('- success:', response.success);
      console.log('- order.id:', response.data.order.id);
      console.log('- order.receipt_url:', response.data.order.receipt_url);
      console.log('- order.items.length:', response.data.order.items.length);

      res.json(response);

    } catch (error) {
      console.error('❌ Error en getById:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo pedido: ' + error.message
      });
    }
  }


  /**
   * Actualiza el estado de un pedido.
   * @async
   * @function updateStatus
   * @param {Object} req - Objeto de solicitud de Express.
   * @param {Object} res - Objeto de respuesta de Express.
   * @returns {Object} - Respuesta JSON con el estado de la operación.
   */
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Estados válidos: ' + validStatuses.join(', ')
        });
      }

      const updatedOrder = await Order.updateStatus(id, status);

      if (!updatedOrder) {
        return res.status(404).json({
          success: false,
          message: 'Pedido no encontrado'
        });
      }

      res.json({
        success: true,
        message: 'Estado del pedido actualizado exitosamente',
        order: updatedOrder
      });
    } catch (error) {
      console.error('Error actualizando estado del pedido:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

module.exports = OrderController;