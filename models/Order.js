const { pool } = require('../config/database');
const PDFDocument = require('pdfkit'); // ⭐ AGREGAR IMPORT
const fs = require('fs'); // ⭐ AGREGAR IMPORT
const path = require('path'); // ⭐ AGREGAR IMPORT

/**
 * Clase para manejar las operaciones relacionadas con los pedidos en la base de datos.
 */
class Order {
  /**
   * Crea un nuevo pedido en la base de datos.
   */
  static async create(orderData) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const {
        user_id,
        items,
        total_amount,
        shipping_data,
        payment_data,
        receipt_url
      } = orderData;

      console.log('🎯 CREANDO PEDIDO CON PDF INTEGRADO');
      console.log('📊 DATOS RECIBIDOS EN Order.create:');
      console.log('user_id:', user_id);
      console.log('total_amount:', total_amount);
      console.log('shipping_data:', shipping_data);
      console.log('payment_data:', payment_data);

      // 1. INSERTAR EL PEDIDO BÁSICO (SIN receipt_url por ahora)
      const [orderResult] = await connection.execute(`
        INSERT INTO orders (user_id, total_amount, receipt_url)
        VALUES (?, ?, ?)
      `, [
        user_id,
        total_amount,
        null // ⭐ Por ahora null, lo actualizamos después
      ]);

      const orderId = orderResult.insertId;
      console.log('✅ Pedido creado con ID:', orderId);

      // 2. INSERTAR INFORMACIÓN DE ENVÍO
      if (shipping_data) {
        console.log('📦 Insertando en shipping_info...');
        const shippingResult = await connection.execute(`
          INSERT INTO shipping_info (
            order_id, full_name, email, phone, address, city, zip_code, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          orderId,
          shipping_data.full_name || '',
          shipping_data.email || '',
          shipping_data.phone || '',
          shipping_data.address || '',
          shipping_data.city || '',
          shipping_data.zip_code || '',
          shipping_data.notes || null
        ]);
        console.log('✅ shipping_info insertado, affectedRows:', shippingResult[0].affectedRows);
      }

      // 3. INSERTAR INFORMACIÓN DE PAGO
      if (payment_data) {
        console.log('💳 Insertando en payment_info...');
        const paymentResult = await connection.execute(`
          INSERT INTO payment_info (
            order_id, transaction_id, card_type, card_last_four
          ) VALUES (?, ?, ?, ?)
        `, [
          orderId,
          payment_data.transaction_id || null,
          payment_data.card_type || null,
          payment_data.card_masked || null
        ]);
        console.log('✅ payment_info insertado, affectedRows:', paymentResult[0].affectedRows);
      }

      // 4. INSERTAR ITEMS DEL PEDIDO
      console.log('📦 Insertando items del pedido...');
      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.unit_price, item.subtotal]
        );

        await connection.execute(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }
      console.log('✅ Items del pedido insertados');

      // ⭐ 5. GENERAR PDF Y ACTUALIZAR receipt_url
      console.log('📄 Generando PDF del comprobante...');
      try {
        const pdfResult = await this.generateOrderPDF(orderId, {
          user_id,
          total_amount,
          shipping_data,
          payment_data,
          items
        });

        if (pdfResult.success) {
          // Actualizar el pedido con la URL del PDF
          await connection.execute(
            'UPDATE orders SET receipt_url = ? WHERE id = ?',
            [pdfResult.receipt_url, orderId]
          );
          console.log('✅ PDF generado y receipt_url actualizado:', pdfResult.receipt_url);
        } else {
          console.error('❌ Error generando PDF:', pdfResult.error);
        }
      } catch (pdfError) {
        console.error('💥 Error en generación de PDF:', pdfError);
        // No fallar la transacción por el PDF
      }

      await connection.commit();
      console.log('🎉 TRANSACCIÓN COMPLETADA EXITOSAMENTE');

      // 6. Obtener la orden completa con receipt_url
      const [orderWithReceipt] = await connection.execute(`
        SELECT o.*, 
               s.full_name, s.email, s.phone, 
               CONCAT(s.address, ', ', s.city) as shipping_address,
               p.card_type, p.card_last_four as card_masked,
               CONCAT(p.card_type, ' ', p.card_last_four) as payment_method,
               (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items
        FROM orders o
        LEFT JOIN shipping_info s ON o.id = s.order_id
        LEFT JOIN payment_info p ON o.id = p.order_id
        WHERE o.id = ?
      `, [orderId]);

      return orderWithReceipt[0];

    } catch (error) {
      await connection.rollback();
      console.error('💥 ERROR EN Order.create:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * ⭐ NUEVA FUNCIÓN: Generar PDF del comprobante
   */
  static async generateOrderPDF(orderId, orderData) {
    try {
      console.log('📄 Iniciando generación de PDF para pedido:', orderId);

      // Crear carpeta si no existe
      const uploadsDir = path.join(__dirname, '../uploads/receipts');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('📁 Carpeta receipts creada:', uploadsDir);
      }

      const pdfFileName = `comprobante_${orderId}.pdf`;
      const pdfPath = path.join(uploadsDir, pdfFileName);

      console.log('📝 Creando PDF en:', pdfPath);

      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(pdfPath));

      // ⭐ CONTENIDO DEL PDF
      doc.fontSize(20).text('🧾 COMPROBANTE DE PAGO', 100, 80);
      doc.fontSize(14).text(`Pedido #${orderId}`, 100, 120);
      doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 100, 140);

      doc.text('', 100, 160); // Espacio

      doc.fontSize(14).text('INFORMACIÓN DEL CLIENTE:', 100, 180);
      doc.fontSize(12)
        .text(`Nombre: ${orderData.shipping_data?.full_name || 'N/A'}`, 100, 200)
        .text(`Email: ${orderData.shipping_data?.email || 'N/A'}`, 100, 220)
        .text(`Teléfono: ${orderData.shipping_data?.phone || 'N/A'}`, 100, 240);

      doc.text('', 100, 260); // Espacio

      doc.fontSize(14).text('DIRECCIÓN DE ENVÍO:', 100, 280);
      doc.fontSize(12)
        .text(`${orderData.shipping_data?.address || 'N/A'}`, 100, 300)
        .text(`${orderData.shipping_data?.city || 'N/A'}, ${orderData.shipping_data?.zip_code || ''}`, 100, 320);

      doc.text('', 100, 340); // Espacio

      doc.fontSize(14).text('INFORMACIÓN DE PAGO:', 100, 360);
      doc.fontSize(12)
        .text(`Método: ${orderData.payment_data?.card_type || 'N/A'} ${orderData.payment_data?.card_masked || ''}`, 100, 380)
        .text(`ID Transacción: ${orderData.payment_data?.transaction_id || 'N/A'}`, 100, 400);

      doc.text('', 100, 420);

      doc.fontSize(16).text(`TOTAL: $${Number(orderData.total_amount).toLocaleString('es-CO')}`, 100, 440);

      doc.fontSize(10).text('Gracias por tu compra!', 100, 480);

      doc.end();

      const receipt_url = `/uploads/receipts/${pdfFileName}`;

      console.log('✅ PDF generado exitosamente:', receipt_url);

      return {
        success: true,
        receipt_url: receipt_url,
        file_path: pdfPath
      };

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ⭐ RESTO DE MÉTODOS SIN CAMBIOS (findByUserId, findAll, findById, updateStatus, updateReceiptUrl)

  static async findByUserId(userId) {
    try {
      const [rows] = await pool.execute(
        `SELECT o.*, u.name as user_name
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.user_id = ?
         ORDER BY o.created_at DESC`,
        [userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findAll() {
    try {
      const [rows] = await pool.execute(
        `SELECT o.*, u.name as user_name, u.email as user_email
         FROM orders o
         JOIN users u ON o.user_id = u.id
         ORDER BY o.created_at DESC`
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [orderRows] = await pool.execute(
        `SELECT o.*, u.name as user_name, u.email as user_email
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.id = ?`,
        [id]
      );

      if (orderRows.length === 0) return null;

      const order = orderRows[0];
      const [itemRows] = await pool.execute(
        `SELECT oi.*, p.name as product_name, p.image_url
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [id]
      );

      order.items = itemRows;
      return order;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      const [result] = await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, id]
      );

      if (result.affectedRows === 0) return null;

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  static async updateReceiptUrl(orderId, receiptUrl) {
    try {
      console.log(`🔄 Intentando actualizar receipt_url para pedido ${orderId}:`, receiptUrl);

      const [result] = await pool.execute(
        'UPDATE orders SET receipt_url = ? WHERE id = ?',
        [receiptUrl, orderId]
      );

      console.log('📊 Resultado de la actualización:', {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows,
        orderId: orderId,
        receiptUrl: receiptUrl
      });

      if (result.affectedRows > 0) {
        console.log(`✅ Receipt URL actualizada exitosamente para pedido ${orderId}`);
        return { success: true };
      } else {
        console.log(`⚠️ No se encontró el pedido ${orderId} para actualizar`);
        return { success: false, message: 'Pedido no encontrado' };
      }
    } catch (error) {
      console.error('❌ Error actualizando receipt_url:', error);
      throw error;
    }
  }
}

module.exports = Order;