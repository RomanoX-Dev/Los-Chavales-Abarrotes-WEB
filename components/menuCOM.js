/* ==========================================================================
   MENUCOM.JS - COMPONENTES DINÁMICOS: TARJETAS, KPIS Y CATÁLOGO DE INVENTARIO
   ========================================================================== */

import { obtenerProductos } from '../api/inventarioAPI.js';
import { resolverUrlImagen, IMAGEN_DEFAULT } from '../utils/helpers.js';
import { mostrarCargador, ocultarCargador } from '../utils/cargador.js';

/**
 * Escapa caracteres especiales de HTML para prevenir ataques XSS.
 * @param {string} str - Cadena a sanitizar
 * @returns {string} Cadena segura
 */
export function escaparHTML(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Normaliza las propiedades del producto para soportar diferentes formatos de la API.
 * @param {Object} prod - Objeto original retornado por la API
 * @returns {Object} Objeto producto estandarizado
 */
export function normalizarProducto(prod) {
    const stock = Number(prod.stock ?? prod.Stock ?? 0);
    const minStock = Number(prod.stockMinimo ?? prod.StockMinimo ?? 5);

    return {
        id: prod.id || prod._id,
        nombre: prod.nombre || prod.nombreProducto || prod.ProductoN || 'Producto Sin Nombre',
        descripcion: prod.descripcion || prod.Descripcion || prod.descripcionProducto || 'Sin descripción disponible',
        categoria: prod.nombreCategoria || prod.NombreCategoria || prod.categoria || 'General',
        codigo: prod.codigoBarras || prod.CodigoBarras || 'S/N',
        precio: Number(prod.precioVenta || prod.precio || prod.Precio || 0),
        stock,
        minStock,
        esStockBajo: stock <= minStock,
        imagen: prod.imagen || prod.Imagen || prod.imagenUrl,
        enOferta: Boolean(prod.enOferta),
        esNuevo: Boolean(prod.esNuevo)
    };
}

/**
 * Actualiza el indicador de alerta en el sidebar en cualquier pantalla.
 */
export async function actualizarBadgeSidebar() {
    const badgeSidebar = document.getElementById('badgeStockBajo');
    if (!badgeSidebar) return;

    try {
        const productosRaw = await obtenerProductos();
        if (!Array.isArray(productosRaw)) return;

        const productos = productosRaw.map(normalizarProducto);
        const totalAlertas = productos.filter(p => p.esStockBajo).length;

        badgeSidebar.textContent = totalAlertas;
        badgeSidebar.style.display = totalAlertas === 0 ? 'none' : 'inline-block';
    } catch (error) {
        console.error('Error al actualizar badge de stock bajo:', error);
    }
}

/**
 * Obtiene los productos y renderiza las tarjetas destacadas e indicadores de alerta.
 */
export async function cargarCatalogoInventario() {
    const contenedor = document.getElementById('contenedorCatalogo');
    const kpiStockBajo = document.getElementById('kpiStockBajo');

    if (!contenedor) return;

    try {
        mostrarCargador('Cargando catálogo...', 100);

        const productosRaw = await obtenerProductos();
        
        if (!Array.isArray(productosRaw)) {
            throw new Error('El formato de datos retornado no es un listado válido.');
        }

        // Normalizamos todos los productos
        const productos = productosRaw.map(normalizarProducto);

        // Conteo de alertas de stock bajo
        const productosStockBajo = productos.filter(p => p.esStockBajo);
        const totalAlertas = productosStockBajo.length;
        
        if (kpiStockBajo) kpiStockBajo.textContent = `${totalAlertas} producto${totalAlertas === 1 ? '' : 's'}`;
        
        // Sincroniza el badge del sidebar
        actualizarBadgeSidebar();

        // Mostramos los primeros 12 productos destacados
        const productosMostrar = productos.slice(0, 12); 

        if (productosMostrar.length === 0) {
            contenedor.innerHTML = `<p class="mensaje-vacio">No hay productos registrados en el inventario.</p>`;
            return;
        }

        contenedor.innerHTML = productosMostrar.map(prod => `
            <article class="tarjeta-producto glass-panel ${prod.esStockBajo ? 'alerta-stock' : ''}">
                ${prod.enOferta ? `<div class="badge-promocion oferta">Oferta</div>` : ''}
                ${prod.esNuevo ? `<div class="badge-promocion">Nuevo</div>` : ''}
                
                <div class="imagen-contenedor">
                    <img src="${resolverUrlImagen(prod.imagen)}" 
                         alt="${escaparHTML(prod.nombre)}" 
                         class="img-producto"
                         loading="lazy" 
                         onerror="this.onerror=null; this.src='${IMAGEN_DEFAULT}';">
                </div>
                
                <div class="info-producto">
                    <h3>${escaparHTML(prod.nombre)}</h3>
                    <p class="descripcion-corta" title="${escaparHTML(prod.descripcion)}">${escaparHTML(prod.descripcion)}</p>
                    <div class="meta-producto">
                        <span class="precio">$${prod.precio.toFixed(2)}</span>
                        <span class="stock-tag ${prod.esStockBajo ? 'texto-rojo' : ''}">Stock: ${prod.stock}</span>
                    </div>
                </div>
            </article>
        `).join('');

    } catch (error) {
        console.error('Error al cargar inventario en el menú:', error);
        contenedor.innerHTML = `<p class="mensaje-error">Error al cargar los datos. Revisa la conexión con el servidor.</p>`;
    } finally {
        ocultarCargador();
    }
}