const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    console.log('✅ Request recibida');
    res.json({ 
        message: 'FUNCIONA!', 
        timestamp: new Date().toISOString() 
    });
    console.log('✅ Respuesta enviada');
});

app.post('/test-login', (req, res) => {
    console.log('✅ Login test recibido:', req.body);
    res.json({ 
        success: true, 
        message: 'Login test funciona',
        data: req.body
    });
    console.log('✅ Login test respondido');
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor de prueba en http://localhost:${PORT}`);
    console.log('Prueba:');
    console.log('GET  http://localhost:3000/');
    console.log('POST http://localhost:3000/test-login');
});