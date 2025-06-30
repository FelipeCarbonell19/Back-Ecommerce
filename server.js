const express = require('express');
const cors = require('cors');
const path = require('path'); 
const { testConnection } = require('./config/database');
require('dotenv').config();

console.log('🔍 Iniciando servidor...');

// Importar rutas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

console.log('✅ Rutas importadas correctamente');

const app = express();

console.log('✅ App de Express creada');

// Middlewares
app.use(cors());
console.log('✅ CORS configurado');

app.use(express.json());
console.log('✅ JSON parser configurado');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('✅ Archivos estáticos configurados');

// Rutas principales
app.get('/', (req, res) => {
    console.log('📥 Request recibida en /');
    res.json({ 
        message: '🚀 API Ecommerce funcionando correctamente!',
        status: 'success',
        timestamp: new Date().toISOString(),
        endpoints: {
            auth: '/api/auth/register, /api/auth/login, /api/auth/me',
            products: '/api/products (GET, POST, PUT, DELETE)',
            orders: '/api/orders (GET, POST, PUT)',
            users: '/api/admin/users (GET, PUT) - Solo Admin',
            files: '/uploads/* (PDF comprobantes e imágenes)' 
        }
    });
    console.log('📤 Respuesta enviada desde /');
});

console.log('✅ Ruta principal configurada');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin/users', userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📅 Iniciado el: ${new Date().toLocaleString()}`);
    
    console.log('🔍 Probando conexión a la base de datos...');
    await testConnection();
    
    console.log('\n📋 Endpoints disponibles:');
    console.log('   POST /api/auth/register - Registrar usuario');
    console.log('   POST /api/auth/login - Iniciar sesión');
    console.log('   GET  /api/auth/me - Obtener perfil (requiere token)');
    console.log('   GET  /api/products - Listar productos (público)');
    console.log('   GET  /api/products/:id - Ver producto (público)');
    console.log('   POST /api/products - Crear producto (admin/seller)');
    console.log('   PUT  /api/products/:id - Actualizar producto (admin/seller)');
    console.log('   DELETE /api/products/:id - Eliminar producto (admin/seller)');
    console.log('   POST /api/orders - Crear pedido (autenticado)');                
    console.log('   GET  /api/orders/my-orders - Mis pedidos (autenticado)');       
    console.log('   GET  /api/orders - Todos los pedidos (admin/seller)');          
    console.log('   GET  /api/orders/:id - Ver pedido (autenticado)');              
    console.log('   PUT  /api/orders/:id/status - Cambiar estado (admin/seller)');
    console.log('   GET  /api/admin/users - Listar usuarios (admin)');
    console.log('   PUT  /api/admin/users/:id/role - Cambiar rol usuario (admin)');
    console.log('   GET  /api/admin/users/stats - Estadísticas usuarios (admin)');
    console.log('   GET  /api/test-pdf - Probar generación PDF (temporal)'); 
    console.log('   GET  /uploads/* - Archivos estáticos (PDFs, imágenes)'); 
    console.log('   GET  / - Estado de la API\n');
    
    console.log('🎯 Servidor listo para recibir requests');
});