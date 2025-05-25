// models/productoModel.js
const pool = require('../config/db');

// Función ya existente
const getProductos = async () => {
  try {
    const result = await pool.query('SELECT articulo_id, nombre, precio_venta, stock FROM articulo');
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// Función para búsqueda (ya existente)
const searchProductos = async (query) => {
  const text = `
    SELECT articulo_id, nombre, precio_venta, stock
    FROM articulo
    WHERE nombre ILIKE '%' || $1 || '%'
  `;
  const values = [query];
  try {
    const result = await pool.query(text, values);
    return result.rows;
  } catch (err) {
    throw err;
  }
};

// NUEVA: Obtener los 3 artículos con más stock
const getTopArticles = async () => {
  const query = `
    SELECT articulo_id, nombre, stock,
           encode(fotografia, 'base64') as fotografia_base64
    FROM articulo
    ORDER BY stock DESC
    LIMIT 3;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

// NUEVA: Para cada categoría, obtener la imagen del artículo con mayor stock en ella
const getCategoriesWithTopArticleImage = async () => {
  const query = `
    SELECT c.categoria_id, c.nombre,
    (
      SELECT encode(a.fotografia, 'base64')
      FROM articulo a
      WHERE a.categoria_id = c.categoria_id
      ORDER BY a.stock DESC
      LIMIT 1
    ) as fotografia_base64
    FROM categoria c;
  `;
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getProductos,
  searchProductos,
  getTopArticles,
  getCategoriesWithTopArticleImage
};
