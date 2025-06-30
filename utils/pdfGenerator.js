const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Función para formatear precios
function formatPrice(price) {
  return new Intl.NumberFormat('es-CO').format(parseFloat(price));
}

function generateOrderReceipt(orderData) {
  return new Promise((resolve, reject) => {
    try {
      // Crear carpeta si no existe
      const receiptsDir = path.join(__dirname, '../uploads/receipts');
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      // Nombre del archivo
      const fileName = `comprobante_${orderData.id}.pdf`;
      const filePath = path.join(receiptsDir, fileName);

      // Crear PDF
      const doc = new PDFDocument();
      doc.pipe(fs.createWriteStream(filePath));

      // ENCABEZADO
      doc.fontSize(20)
         .fillColor('#1e40af')
         .text('🛒 COMPROBANTE DE PAGO', 50, 50);

      // INFORMACIÓN BÁSICA
      doc.fontSize(14)
         .fillColor('#333')
         .text(`Pedido #: ${orderData.id}`, 50, 100)
         .text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, 50, 120)
         .text(`Total: ${formatPrice(orderData.total_amount)}`, 50, 140);

      // PRODUCTOS (si existen)
      let yPos = 180;
      if (orderData.items && orderData.items.length > 0) {
        doc.fontSize(12).text('PRODUCTOS COMPRADOS:', 50, yPos);
        yPos += 25;
        
        orderData.items.forEach(item => {
          doc.fontSize(10)
             .text(`• ${item.product_name} x${item.quantity} = ${formatPrice(item.subtotal)}`, 50, yPos);
          yPos += 20;
        });
      }

      // CLIENTE (si existe)
      if (orderData.shipping_info) {
        yPos += 30;
        doc.fontSize(12).text('INFORMACIÓN DEL CLIENTE:', 50, yPos);
        yPos += 25;
        doc.fontSize(10)
           .text(`Nombre: ${orderData.shipping_info.name}`, 50, yPos)
           .text(`Email: ${orderData.shipping_info.email}`, 50, yPos + 15)
           .text(`Dirección: ${orderData.shipping_info.address}`, 50, yPos + 30);
      }

      // PIE DE PÁGINA
      doc.fontSize(10)
         .fillColor('#666')
         .text('Gracias por tu compra! 🛒', 50, 700, { align: 'center' })
         .text(`Generado: ${new Date().toLocaleString('es-CO')}`, 50, 720, { align: 'center' });

      doc.end();

      doc.on('end', () => {
        resolve({
          success: true,
          fileName: fileName,
          url: `/uploads/receipts/${fileName}`
        });
      });

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateOrderReceipt };