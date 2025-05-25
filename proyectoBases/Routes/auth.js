// Routes/auth.js
const express = require('express');
const router = express.Router();
// Asumimos que ya tienes configurada la conexión a tu base de datos con pg en pool
const pool = require('../config/db'); // Asegúrate de que la ruta al módulo de conexión sea la correcta

// POST /login: Valida RFC y contraseña en clientes y empleados
router.post('/login', async (req, res) => {
  const { rfc, password } = req.body;
  if (!rfc || !password) {
    return res.status(400).json({ error: 'Faltan datos' });
  }
  try {
    // Primero, revisamos en la tabla de clientes
    let result = await pool.query(
      'SELECT * FROM cliente WHERE rfc = $1 AND password = $2',
      [rfc, password]
    );
    if (result.rowCount > 0) {
      req.session.user = {
        id: result.rows[0].cliente_id,
        rfc: result.rows[0].rfc,
        role: 'cliente',
        profileImage: '/images/profile.png'  // La imagen que usarás como placeholder
      };
      return res.json({ success: true });
    }
    // Si no se encontró, revisamos en empleados
    result = await pool.query(
      'SELECT * FROM empleado WHERE rfc = $1 AND password = $2',
      [rfc, password]
    );
    if (result.rowCount > 0) {
      req.session.user = {
        id: result.rows[0].empleado_id,
        rfc: result.rows[0].rfc,
        role: 'empleado',
        profileImage: '/images/profile.png'
      };
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Credenciales incorrectas' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// GET /logout: Cierra la sesión
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// GET /api/session: Para consultar si hay usuario logueado
router.get('/api/session', (req, res) => {
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

module.exports = router;
