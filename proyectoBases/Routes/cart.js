const express = require('express');
const router = express.Router();

// Esta ruta devuelve el carrito actual almacenado en la sesión
router.get('/', (req, res) => {
  // Si el carrito no existe en la sesión, devolvemos un objeto vacío
  if (!req.session.cart) {
    return res.json({ items: [] });
  }
  // Devuelve los items del carrito (cada item contiene producto y cantidad)
  return res.json({ items: req.session.cart });
});

// Ruta para agregar un producto al carrito
// Se espera que el request incluya el producto (por ejemplo, id y cantidad a agregar)
router.post('/', async (req, res) => {
  const { producto, cantidad } = req.body;  // producto debe incluir al menos: articulo_id, nombre, precio_venta y stockOriginal (el stock original del producto)
  
  // Inicializar el carrito si no existe
  if (!req.session.cart) {
    req.session.cart = [];
  }
  
  // Buscar si el producto ya está en el carrito
  let item = req.session.cart.find(item => item.producto.articulo_id === producto.articulo_id);
  if (item) {
    // Si ya existe, incrementar la cantidad
    item.cantidad += cantidad;
  } else {
    // Sino, agregarlo como nuevo item
    req.session.cart.push({ producto, cantidad });
  }
  
  return res.json({ success: true, cart: req.session.cart });
});

// Ruta para eliminar un artículo individual del carrito
router.delete('/:productoId', (req, res) => {
  const { productoId } = req.params;
  if (!req.session.cart) {
    return res.json({ success: false, message: 'Carrito vacío' });
  }
  req.session.cart = req.session.cart.filter(item => item.producto.articulo_id != productoId);
  return res.json({ success: true, cart: req.session.cart });
});

// Ruta para vaciar el carrito (si el usuario decide cancelar la compra)
router.delete('/', (req, res) => {
  req.session.cart = [];  // Restablece el carrito a vacío (restaurando el stock, ya que no se reserva)
  res.json({ success: true, cart: [] });
});

module.exports = router;
