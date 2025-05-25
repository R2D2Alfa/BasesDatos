// Routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Asegúrate de que la ruta a tu conexión de la BD sea la correcta

// GET /api/profile: Consulta la información completa del perfil usando el RFC almacenado en la sesión
router.get('/api/profile', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'No hay sesión iniciada' });
  }

  try {
    const userRfc = req.session.user.rfc.trim();
    let query, values;

    if (req.session.user.role === "cliente") {
      // Consulta para clientes: se retorna nombre completo, teléfono y se añade 'cliente' como role.
      query = `
        SELECT 
          cliente_id,
          rfc,
          (nombre || ' ' || ap_paterno || ' ' || ap_materno) AS nombre_completo,
          calle,
          numero,
          cp,
          colonia,
          estado,
          email,
          telefono,
          'cliente' AS role
        FROM cliente
        WHERE LOWER(rfc) = LOWER($1)
      `;
      values = [userRfc];
    } else {
      // Consulta para empleados: se retorna nombre completo, no el teléfono, y se
      // incluyen tipo_empleado, sucursal y supervisor. Se añade 'empleado' como role.
      query = `
        SELECT 
          e.empleado_id,
          e.rfc,
          e.curp,
          (e.nombre || ' ' || e.ap_paterno || ' ' || e.ap_materno) AS nombre_completo,
          e.calle,
          e.numero,
          e.cp,
          e.colonia,
          e.estado,
          e.email,
          e.tipo_empleado,
          s.ubicacion AS sucursal,
          COALESCE(sup.nombre || ' ' || sup.ap_paterno, 'No asignado') AS supervisor,
          'empleado' AS role
        FROM empleado e
        LEFT JOIN sucursal s ON e.sucursal_id = s.sucursal_id
        LEFT JOIN empleado sup ON e.supervisor_id = sup.empleado_id
        WHERE LOWER(e.rfc) = LOWER($1)
      `;
      values = [userRfc];
    }

    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

module.exports = router;
