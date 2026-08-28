import { resolverUrlImagen } from '../utils/helpers.js';

function obtenerClaseEstado(stockNum, minNum) {
    const stock = Number(stockNum) || 0;
    const min = Number(minNum) || 5;

    if (stock <= min) return 'stock-rojo';
    if (stock <= min * 1.5) return 'stock-amarillo';
    return 'stock-verde';
}

// ¡CORREGIDO! El nombre ahora coincide exactamente con lo que pide inventario.js
export function renderizarTablaInventario(lista, tbody, acciones) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay productos registrados.</td></tr>`;
        return;
    }

    lista.forEach(prod => {
        const idProd = prod.idProducto || prod.IdProducto;
        const nombre = prod.nombre || prod.nombreProducto || prod.ProductoN;
        const estatus = prod.estatus || prod.Estatus || 'Activo';
        const esActivo = estatus === 'Activo';

        const stockNum = prod.stock ?? prod.Stock ?? 0;
        const minNum = prod.stockMinimo ?? prod.StockMinimo ?? 5;
        const claseStock = obtenerClaseEstado(stockNum, minNum);

        const urlImagen = resolverUrlImagen(prod.imagen || prod.Imagen);

        const tr = document.createElement('tr');
        if (!esActivo) tr.classList.add('fila-inactiva');

        tr.innerHTML = `
            <td>
                <img src="${urlImagen}" alt="${nombre}" class="img-tabla" referrerpolicy="no-referrer">
            </td>
            <td>${prod.codigoBarras || prod.CodigoBarras || 'N/A'}</td>
            <td><strong>${nombre}</strong></td>
            <td>${prod.nombreCategoria || prod.NombreCategoria || 'Sin categoría'}</td>
            <td style="color: #4facfe;">$${Number(prod.precio || prod.Precio || 0).toFixed(2)}</td>
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

        tr.querySelector('.btn-editar')?.addEventListener('click', () => acciones.onEditar(idProd));
        tr.querySelector('.btn-borrar-definitivo')?.addEventListener('click', () => acciones.onBorrarDefinitivo(idProd));

        tbody.appendChild(tr);
    });
}