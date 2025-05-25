const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',            // Si PostgreSQL está en tu máquina
  port: 5432,                   // Puerto por defecto
  database: 'Tienda_mueble',   // Nombre de la base creada en pgAdmin
  user: 'postgres',           // Tu usuario de PostgreSQL
  password: '1q2w3e4r'     // La contraseña asignada a ese usuario
});

// (Opcional) Probar la conexión
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log('Conexión exitosa. Fecha y hora en DB:', res.rows[0]);
  }
});

module.exports = pool;
