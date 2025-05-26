// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Middlewares para parsear JSON y formularios URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración del middleware de sesión
app.use(
  session({
    secret: 'tu_clave_secreta', // Cambia esta clave por una segura
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 }, // 1 hora de duración, por ejemplo
  })
);

// Servir archivos estáticos (CSS, imágenes, JS, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Montaje de rutas:
// 1. Rutas principales (HTML estáticos)
const indexRouter = require('./Routes/index');
app.use('/', indexRouter);

// 2. Rutas del carrito
const cartRoutes = require('./Routes/cart');
app.use('/api/cart', cartRoutes);

// 3. Rutas de autenticación (login, logout, etc.)
const authRoutes = require('./Routes/auth');
app.use('/', authRoutes);

// 4. Rutas de perfil
const profileRouter = require('./Routes/profile');
app.use('/', profileRouter);

// 5. Ruta para la factura (se recomienda agrupar todas las API bajo el prefijo '/api')
// Esto hará que el endpoint completo sea: /api/factura?venta_id=xxx
const facturaDirectaRoutes = require('./Routes/facturaDirecta');
app.use('/api', facturaDirectaRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
