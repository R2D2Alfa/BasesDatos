// routes/index.js
const express = require('express');
const path = require('path');
const router = express.Router();
const pool = require('../config/db'); // Importa el pool de conexión

// Importar funciones del modelo (asegúrate de respetar mayúsculas/minúsculas en la ruta real)
const { getProductos, searchProductos, getTopArticles, getCategoriesWithTopArticleImage } = require('../Models/productoModel');

// Rutas para vistas
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});
router.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/about.html'));
});
router.get('/cart', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/cart.html'));
});
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
});
router.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/profile.html'));
});
router.get('/search', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/search.html'));
});
router.get('/checkout', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/checkout.html'));
});
// Cambiar la ruta de la factura para que coincida con la redirección
router.get('/factura.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/factura.html'));
});

// Endpoint POST para procesar el checkout
router.post('/api/checkout', async (req, res) => {
  // Verificar que exista la sesión
  if (!req.session.user) {
    return res.status(401).json({ error: 'No hay sesión iniciada' });
  }

  // El body debe incluir un objeto 'items' y 'paymentInfo'
  const { items, paymentInfo } = req.body;
  // paymentInfo debe contener al menos: employeeNumber (ej. "E015") y branchNumber
  const { employeeNumber, branchNumber } = paymentInfo;

  // Validar que el empleado exista y obtener su empleado_id y sucursal_id a partir de num_empleado
  try {
    const empResult = await pool.query(
      `SELECT empleado_id, sucursal_id FROM empleado WHERE num_empleado = $1`,
      [ employeeNumber ]
    );
    if (empResult.rowCount === 0) {
      return res.status(400).json({ error: 'Empleado no encontrado' });
    }
    // Obtener el empleado_id (numérico) y el sucursal_id
    const empleadoId = empResult.rows[0].empleado_id;
    const empSucursal = Number(empResult.rows[0].sucursal_id);
    const inputBranchNumber = Number(branchNumber.toString().trim());
    if (empSucursal !== inputBranchNumber) {
      return res.status(400).json({ error: 'El empleado no pertenece a la sucursal indicada' });
    }
    req.empleadoId = empleadoId;
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error validando empleado y sucursal' });
  }

  try {
    // Iniciar transacción
    await pool.query('BEGIN');

    // Determinar si el usuario es cliente
    let cliente_id = null;
    if (req.session.user.role === 'cliente') {
      cliente_id = req.session.user.id;
    }

    // Insertar en la tabla venta utilizando una secuencia para generar venta_id
    const ventaInsertQuery = `
      INSERT INTO venta (venta_id, empleado_vendedor_id, empleado_cobrador_id, cliente_id, fecha_venta)
      VALUES (nextval('venta_seq'), $1, $2, $3, CURRENT_DATE)
      RETURNING venta_id
    `;
    const ventaResult = await pool.query(ventaInsertQuery, [ req.empleadoId, req.empleadoId, cliente_id ]);
    const venta_id = ventaResult.rows[0].venta_id;

    // Insertar cada artículo en la tabla articulo_venta (se asume que se usa la secuencia 'articulo_venta_seq')
    for (const item of items) {
      const articuloVentaInsertQuery = `
        INSERT INTO articulo_venta (articulo_venta_id, venta_id, articulo_id, cantidad, monto_por_articulo)
        VALUES (nextval('articulo_venta_seq'), $1, $2, $3, 0.00)
      `;
      await pool.query(articuloVentaInsertQuery, [ venta_id, item.articulo_id, item.cantidad ]);
    }

    await pool.query('COMMIT');
    res.json({ success: true, ticket: [{ venta_id }] });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error en checkout:', err);
    res.status(500).json({ error: 'Error al procesar el checkout' });
  }
});

// Endpoint para obtener productos
router.get('/api/productos', async (req, res) => {
  try {
    const productos = await getProductos();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Endpoint para búsqueda
router.get('/api/search', async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Falta el parámetro de búsqueda' });
  }
  try {
    const resultados = await searchProductos(q);
    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: 'Error durante la búsqueda' });
  }
});

// Endpoint para obtener los 3 artículos con más stock (para el carrusel)
router.get('/api/top-articles', async (req, res) => {
  try {
    const topArticles = await getTopArticles();
    res.json(topArticles);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener artículos destacados' });
  }
});

// Endpoint para obtener las categorías con imagen del artículo con mayor stock
router.get('/api/categories', async (req, res) => {
  try {
    const categories = await getCategoriesWithTopArticleImage();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

module.exports = router;
