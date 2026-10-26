/* ==========================================================================
   POSCOM.JS - COMPONENTES VISUALES Y CARGA DE PRODUCTOS EN POS
   ========================================================================== */
import { IMAGEN_DEFAULT, resolverUrlImagen, escaparHTML, formatearMoneda } from '../utils/helpers.js';

export function renderizarGridProductosPOS(productos, contenedor, onSeleccionar) {
    if (!contenedor) return;
    if (!Array.isArray(productos) || productos.length === 0) {
        renderizarEstadoVacioPOS(contenedor, 'No hay productos disponibles.');
        return;
    }

    contenedor.innerHTML = '';
    contenedor.className = 'grid-productos-pos';

    productos.forEach(prod => {
        if (!prod || typeof prod !== 'object') return;

        const nombre = prod.nombreProducto || prod.nombre || 'Producto Sin Nombre';
        const precio = parseFloat(prod.precio || 0);
        const stock = parseFloat(prod.stock || 0);
        const stockMinimo = parseFloat(prod.stockMinimo || 0);
        const codigo = prod.codigoBarras || '';
        const urlImagen = resolverUrlImagen(prod.imagen);

        const esAgotado = stock <= 0;
        const esStockBajo = stock > 0 && stock <= stockMinimo;

        const card = document.createElement('article');
        card.className = `card-producto-pos ${esAgotado ? 'sin-stock' : ''}`;
        card.dataset.id = prod.idProducto;

        card.innerHTML = `
            ${codigo ? `<span class="badge-codigo" title="Código de barras">${escaparHTML(codigo)}</span>` : ''}
            <div class="card-img-contenedor">
                <img src="${escaparHTML(urlImagen)}" alt="${escaparHTML(nombre)}" class="img-producto-pos"
                     onerror="this.onerror=null; this.src='${IMAGEN_DEFAULT}';">
            </div>
            <div class="card-info-pos">
                <h4 title="${escaparHTML(nombre)}">${escaparHTML(nombre)}</h4>
                <div class="card-meta-pos">
                    <span class="precio-pos">${formatearMoneda(precio)}</span>
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

export function renderizarEstadoCargaPOS(contenedor) {
    if (!contenedor) return;
    contenedor.innerHTML = `
        <div class="mensaje-cargando" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
            <div class="spinner" style="margin-bottom: 12px;"></div>
            <span>Cargando inventario... 📦</span>
        </div>`;
}

export function renderizarEstadoVacioPOS(contenedor, mensaje = 'No se encontraron productos.') {
    if (!contenedor) return;
    contenedor.className = 'grid-productos-pos';
    contenedor.innerHTML = `
        <div class="mensaje-vacio">
            <span style="font-size: 2.5rem; display: block; margin-bottom: 8px; opacity: 0.5;">🔍</span>
            <p>${escaparHTML(mensaje)}</p>
        </div>`;
}