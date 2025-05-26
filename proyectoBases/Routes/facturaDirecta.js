// Routes/facturaDirecta.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Asegúrate de que la ruta a tu conexión es la correcta

// Endpoint para obtener la factura (ticket) de una venta
// URL final: GET /api/factura?venta_id=123
router.get('/factura', async (req, res) => {
  // Se extrae el parámetro venta_id de la URL
  const ventaId = req.query.venta_id;

  // Verificar que se envíe un venta_id válido
  if (!ventaId || isNaN(Number(ventaId))) {
    return res.status(400).json({ error: 'Falta indicar un venta_id válido' });
  }

  try {
    const query = `
      SELECT
        v.venta_id,
        v.folio,
        v.fecha_venta,
        COALESCE(c.nombre || ' ' || c.ap_paterno || ' ' || COALESCE(c.ap_materno, ''), 'Público general') AS cliente_nombre,
        e.nombre || ' ' || e.ap_paterno || ' ' || COALESCE(e.ap_materno, '') AS empleado_nombre,
        s.ubicacion AS sucursal,
        a.articulo_id,
        a.nombre AS articulo_nombre,
        a.precio_venta AS precio_unitario,
        av.cantidad,
        av.monto_por_articulo AS subtotal,
        SUM(av.monto_por_articulo) OVER (PARTITION BY v.venta_id) AS total_venta
      FROM venta v
      LEFT JOIN cliente c ON v.cliente_id = c.cliente_id
      JOIN empleado e ON v.empleado_vendedor_id = e.empleado_id
      JOIN sucursal s ON e.sucursal_id = s.sucursal_id
      JOIN articulo_venta av ON v.venta_id = av.venta_id
      JOIN articulo a ON a.articulo_id = av.articulo_id
      WHERE v.venta_id = $1
    `;
    
    const result = await pool.query(query, [ventaId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }
    
    // Procesar los datos para separar la cabecera y los detalles de la factura
    const header = {
      venta_id: result.rows[0].venta_id,
      folio: result.rows[0].folio,
      fecha: result.rows[0].fecha_venta,
      cliente: result.rows[0].cliente_nombre,
      empleado: result.rows[0].empleado_nombre,
      sucursal: result.rows[0].sucursal,
      total: result.rows[0].total_venta,
    };

    // Cada fila del resultado corresponde a un artículo vendido
    const items = result.rows.map((row) => ({
      articulo_id: row.articulo_id,
      nombre: row.articulo_nombre,
      precio_unitario: row.precio_unitario,
      cantidad: row.cantidad,
      subtotal: row.subtotal,
    }));

    // Devolver la factura completa en formato JSON
    res.json({ factura: { header, items } });
  } catch (err) {
    console.error('Error al obtener la factura:', err);
    res.status(500).json({ error: 'Error al consultar la factura' });
  }
});

module.exports = router;
