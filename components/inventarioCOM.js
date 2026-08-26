// Ruta: components/productosT.js
import { IMAGEN_DEFAULT, resolverUrlImagen } from '../utils/helpers.js';

// Función helper fuera del bucle para no recrearla en cada renderizado
function obtenerClaseEstado(stockNum, minNum) {
    const stock = Number(stockNum) || 0;
    const min = Number(minNum) || 5; // Respaldo si no tiene mínimo asignado

    if (stock <= min) {
        return 'stock-rojo';     // ¡Alerta! Alcanzó o superó el mínimo
    } else if (stock <= min * 1.5) {
        return 'stock-amarillo'; // Próximo a llegar al mínimo
    }
    return 'stock-verde';        // Inventario suficiente
}

/**
 * Genera y renderiza las filas de la tabla de productos.
 * @param {Array} lista - Lista de productos a renderizar.
 * @param {HTMLElement} tbody - Elemento <tbody> de la tabla.
 * @param {Object} acciones - Callback (onEditar, onBorrarDefinitivo).
 */
export function renderizarTablaProductos(lista, tbody, acciones) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay productos registrados.</td></tr>`;
        return;
    }

    lista.forEach(prod => {
        const estatus = prod.Estatus || prod.estatus || (prod.Activo === false || prod.activo === 0 ? 'Inactivo' : 'Activo');
        const esActivo = estatus === 'Activo';

        // 1. Extraer los valores numéricos de la base de datos
        const stockNum = prod.Stock ?? prod.stock ?? 0;
        const minNum = prod.StockMinimo ?? prod.stockMinimo ?? 5;

        // 2. Obtener la clase CSS según las reglas
        const claseStock = obtenerClaseEstado(stockNum, minNum);

        const imagenBD = prod.Imagen || prod.imagen || prod.urlImagen;
        const urlImagen = resolverUrlImagen(imagenBD);
        const idProd = prod.IdProducto || prod.idProducto || prod.id;

        const tr = document.createElement('tr');
        if (!esActivo) tr.classList.add('fila-inactiva');

        tr.innerHTML = `
            <td>
                <img src="${urlImagen}" alt="Producto" class="img-tabla" referrerpolicy="no-referrer">
            </td>
            <td>${prod.CodigoBarras || prod.codigo || 'N/A'}</td>
            <td><strong>${prod.ProductoN || prod.Nombre || prod.nombre || ''}</strong></td>
            <td>${prod.NombreCategoria || prod.categoria || 'Sin categoría'}</td>
            <td style="color: #4facfe;">$${parseFloat(prod.Precio || prod.precio || 0).toFixed(2)}</td>
            <td><span class="${claseStock}">${stockNum}</span></td>
            <td>
                <span class="badge-estatus ${esActivo ? 'activo' : 'inactivo'}">
                    ${esActivo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <button class="btn-icon btn-editar" data-id="${idProd}" title="Editar producto">✏️</button>
                <button class="btn-icon btn-borrar-definitivo" data-id="${idProd}" title="Eliminar definitivamente">🗑️</button>
            </td>
        `;

        // Eventos delegados por botón
        tr.querySelector('.btn-editar')?.addEventListener('click', () => acciones.onEditar(idProd));
        tr.querySelector('.btn-borrar-definitivo')?.addEventListener('click', () => acciones.onBorrarDefinitivo(idProd));

        tbody.appendChild(tr);
    });
}