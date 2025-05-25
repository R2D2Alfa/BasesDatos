// app.js
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Middleware para parsear JSON y formularios URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración del middleware de sesión
app.use(session({
  secret: 'tu_clave_secreta', // Cambia esta clave por una segura
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hora de duración, por ejemplo
}));

// Servir archivos estáticos: CSS, imágenes, JS, etc.
app.use(express.static(path.join(__dirname, 'public')));

// Montar el router principal (ya definido, por ejemplo, en Routes/index.js)
const indexRouter = require('./Routes/index');
app.use('/', indexRouter);

// Montar las rutas para el carrito
const cartRoutes = require('./Routes/cart');
app.use('/api/cart', cartRoutes);

// Montar las rutas de autenticación (login, logout, etc.)
const authRoutes = require('./Routes/auth');
app.use('/', authRoutes);  // Nota: las rutas de login y logout se usan en la raíz

// Montar el router de perfil, que atenderá el endpoint /api/profile (y otros, si es necesario)
const profileRouter = require('./Routes/profile');
app.use('/', profileRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
