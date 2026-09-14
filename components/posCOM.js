/* ==========================================================================
   POSCOM.JS - COMPONENTE REUTILIZABLE PARA TARJETAS DE PRODUCTO EN POS
   ========================================================================== */

import { IMAGEN_DEFAULT, resolverUrlImagen } from '../utils/helpers.js';

/**
 * Renderiza la grilla de tarjetas de productos para el POS.
 * @param {Array} productos Lista de productos a renderizar.
 * @param {HTMLElement} contenedor Elemento DOM donde se inyectarán las tarjetas.
 * @param {Function} onSeleccionar Callback ejecutado al hacer clic en un producto.
 */
export function renderizarGridProductosPOS(productos, contenedor, onSeleccionar) {
    if (!contenedor) return;

    if (!productos || productos.length === 0) {
        renderizarEstadoVacioPOS(contenedor, 'No hay productos disponibles.');
        return;
    }

    contenedor.innerHTML = '';
    
    // Asigna directamente la clase grid al contenedor para evitar divs anidados que rompan la anchura
    contenedor.className = 'grid-productos-pos';

    productos.forEach(prod => {
        const id = prod.idProducto || prod.id;
        const nombre = prod.nombre || prod.nombreProducto || 'Producto Sin Nombre';
        const precio = parseFloat(prod.precio || prod.precioVenta || 0);
        const stock = parseFloat(prod.stock || prod.stockActual || 0);
        const stockMinimo = parseFloat(prod.stockMinimo || 0);
        const codigo = prod.codigoBarras || prod.codigo || '';
        const urlImagen = resolverUrlImagen(prod.imagen || prod.urlImagen);
        
        const esAgotado = stock <= 0;
        const esStockBajo = stock > 0 && stock <= stockMinimo;

        const card = document.createElement('article');
        card.className = `card-producto-pos ${esAgotado ? 'sin-stock' : ''}`;
        card.dataset.id = id;

        card.innerHTML = `
            ${codigo ? `<span class="badge-codigo" title="Código de barras">${codigo}</span>` : ''}
            <div class="card-img-contenedor">
                <img src="${urlImagen}" 
                     alt="${nombre}" 
                     class="img-producto-pos"
                     onerror="this.src='${IMAGEN_DEFAULT}'">
            </div>
            <div class="card-info-pos">
                <h4 title="${nombre}">${nombre}</h4>
                <div class="card-meta-pos">
                    <span class="precio-pos">$${precio.toFixed(2)}</span>
                    <span class="stock-badge-pos ${esStockBajo ? 'alerta' : ''}">
                        ${esAgotado ? 'Agotado' : `Stock: ${stock}`}
                    </span>
                </div>
            </div>
        `;

        if (!esAgotado && typeof onSeleccionar === 'function') {
            card.addEventListener('click', () => onSeleccionar(prod));
        }

        contenedor.appendChild(card);
    });
}

/**
 * Muestra el estado de carga en el POS.
 */
export function renderizarEstadoCargaPOS(contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = `
        <div class="mensaje-cargando">
            <div class="spinner"></div>
            <span>Cargando productos del inventario... 📦</span>
        </div>
    `;
}

/**
 * Muestra el estado vacío en el POS.
 */
export function renderizarEstadoVacioPOS(contenedor, mensaje = 'No se encontraron productos.') {
    if (!contenedor) return;
    contenedor.innerHTML = `
        <div class="mensaje-vacio">
            <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔍</span>
            <p>${mensaje}</p>
        </div>
    `;
}