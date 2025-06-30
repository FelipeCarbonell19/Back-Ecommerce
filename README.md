🛠️ Ecommerce Backend - API REST
Backend del sistema de ecommerce desarrollado con Node.js, Express y MySQL.
📋 Requisitos Previos

Node.js v18.0.0 o superior
MySQL 8.0 o superior (XAMPP recomendado)
npm v8.0.0 o superior

🗄️ Configuración de Base de Datos
1. Iniciar XAMPP
bash# En Linux
sudo /opt/lampp/lampp start

# Verificar servicios
sudo /opt/lampp/lampp status

2. Crear Base de Datos

Abrir: http://localhost/phpmyadmin
Crear base de datos: ecommerce_db
Ejecutar el script SQL para crear las 7 tablas necesarias

⚙️ Instalación
1. Instalar Dependencias
bashcd Backend/
npm install

2. Configurar Variables de Entorno
bash# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus datos
nano .env
Archivo .env:
env# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=ecommerce_db

# JWT Configuration
JWT_SECRET=mi_super_secreto_jwt_para_ecommerce_2025
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development


🚀 Ejecución del proyecto del lado del Backend

Modo Desarrollo
bashnpm start
# o también puedes usar:
node server.js
Verificar Funcionamiento

API REST: http://localhost:5000
Endpoint de prueba: http://localhost:5000/

Salida esperada:
🚀 Servidor corriendo en http://localhost:5000
✅ Conexión a la base de datos exitosa
🎯 Servidor listo para recibir requests
📦 Dependencias Instaladas
Producción

express v5.1.0 - Framework web
mysql2 v3.14.1 - Cliente MySQL
jsonwebtoken v9.0.2 - Autenticación JWT
bcryptjs v3.0.2 - Encriptación de contraseñas
multer v2.0.1 - Subida de archivos
cors v2.8.5 - Cross-Origin Resource Sharing
dotenv v17.0.0 - Variables de entorno
pdfkit v0.17.1 - Generación de PDFs
jspdf v3.0.1 - PDFs adicionales
html2canvas v1.4.1 - Captura HTML
path v0.12.7 - Rutas de archivos
fs v0.0.1 - Sistema de archivos


⚠️ Solución de Problemas
Error de conexión a MySQL
bash # Verificar que XAMPP esté corriendo
sudo /opt/lampp/lampp status

# Reiniciar MySQL si es necesario
sudo /opt/lampp/lampp restart
Puerto en uso
bash # Cambiar puerto en .env
PORT=3001
Dependencias faltantes
bash# Reinstalar dependencias
rm -rf node_modules
npm install

Verifica que XAMPP esté corriendo
Confirma que la base de datos ecommerce_db existe
Revisa el archivo .env
Verifica que todas las dependencias estén instaladas