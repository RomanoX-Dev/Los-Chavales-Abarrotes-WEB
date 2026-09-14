import { resolverUrlImagen } from '../utils/helpers.js';

function obtenerClaseEstado(stockNum, minNum) {
    const stock = Number(stockNum) || 0;
    const min = Number(minNum) || 5;

    if (stock <= min) return 'stock-rojo';
    if (stock <= min * 1.5) return 'stock-amarillo';
    return 'stock-verde';
}

export function renderizarTablaInventario(lista, tbody, acciones) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="texto-vacio">No hay productos registrados.</td></tr>`;
        return;
    }

    const fragmento = document.createDocumentFragment();

    lista.forEach(prod => {
        const idProd = prod.idProducto || prod.IdProducto;
        const nombre = prod.nombre || prod.nombreProducto || prod.ProductoN || 'Sin nombre';
        const estatus = prod.estatus || prod.Estatus || 'Activo';
        const esActivo = estatus === 'Activo';

        const stockNum = prod.stock ?? prod.Stock ?? 0;
        const minNum = prod.stockMinimo ?? prod.StockMinimo ?? 5;
        const claseStock = obtenerClaseEstado(stockNum, minNum);

        const urlImagen = resolverUrlImagen(prod.imagen || prod.Imagen);

        const tr = document.createElement('tr');
        if (!esActivo) tr.classList.add('fila-inactiva');

        tr.innerHTML = `
            <td class="col-img">
                <img src="${urlImagen}" alt="${nombre}" class="img-tabla" loading="lazy" referrerpolicy="no-referrer">
            </td>
            <td class="col-codigo">${prod.codigoBarras || prod.CodigoBarras || 'N/A'}</td>
            <td class="col-nombre"><strong>${nombre}</strong></td>
            <td class="col-categoria">${prod.nombreCategoria || prod.NombreCategoria || 'Sin categoría'}</td>
            <td class="col-precio">$${Number(prod.precio || prod.Precio || 0).toFixed(2)}</td>
            <td class="col-stock"><span class="badge-stock ${claseStock}">${stockNum}</span></td>
            <td class="col-estatus">
                <span class="badge-estatus ${esActivo ? 'activo' : 'inactivo'}">
                    ${esActivo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="col-acciones">
                <button class="btn-icon btn-editar" data-id="${idProd}" title="Editar producto">✏️</button>
                <button class="btn-icon btn-borrar-definitivo" data-id="${idProd}" title="Eliminar definitivamente">🗑️</button>
            </td>
        `;

        tr.querySelector('.btn-editar')?.addEventListener('click', () => acciones.onEditar(idProd));
        tr.querySelector('.btn-borrar-definitivo')?.addEventListener('click', () => acciones.onBorrarDefinitivo(idProd));

        fragmento.appendChild(tr);
    });

    tbody.appendChild(fragmento);
}