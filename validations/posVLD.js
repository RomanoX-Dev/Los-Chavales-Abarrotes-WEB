/* ==========================================================================
   POSVLD.JS - VALIDACIONES DE NEGOCIO PARA EL PUNTO DE VENTA
   ========================================================================== */

/**
 * Valida si hay stock suficiente para agregar o ajustar un producto
 * @param {number} cantidadSolicitada 
 * @param {number} stockDisponible 
 * @returns {boolean}
 */
export function validarStockDisponible(cantidadSolicitada, stockDisponible) {
    const stock = parseFloat(stockDisponible);
    const cantidad = parseFloat(cantidadSolicitada);

    if (isNaN(stock) || stock <= 0) return false;
    if (isNaN(cantidad) || cantidad <= 0) return false;

    return cantidad <= stock;
}

/**
 * Valida si el carrito contiene ítems válidos para procesar la venta
 * @param {Array} carrito 
 * @returns {boolean}
 */
export function validarVentaPermitida(carrito) {
    if (!Array.isArray(carrito) || carrito.length === 0) return false;

    return carrito.every(item => 
        item &&
        item.idProducto !== undefined &&
        typeof item.cantidad === 'number' &&
        item.cantidad > 0 &&
        typeof item.precio === 'number' &&
        !isNaN(item.precio) &&
        item.precio >= 0
    );
}

/**
 * Valida si un producto recibido de la API/Inventario tiene estructura válida
 * @param {Object} producto 
 * @returns {boolean}
 */
export function validarProductoValido(producto) {
    if (!producto || typeof producto !== 'object') return false;
    if (producto.idProducto === undefined || producto.idProducto === null) return false;
    
    const precio = parseFloat(producto.precio);
    return !isNaN(precio) && precio >= 0;
}

/**
 * Valida que el dinero recibido cubra el total de la venta
 * @param {number} montoRecibido 
 * @param {number} totalVenta 
 * @returns {boolean}
 */
export function validarMontoPago(montoRecibido, totalVenta) {
    const recibido = parseFloat(montoRecibido);
    const total = parseFloat(totalVenta);

    if (isNaN(recibido) || isNaN(total)) return false;
    return total > 0 && recibido >= total;
}