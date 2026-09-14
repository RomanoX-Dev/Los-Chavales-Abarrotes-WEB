/* ==========================================================================
   POS.JS - MOTOR PRINCIPAL DEL PUNTO DE VENTA (INTEGRACIÓN CON INVENTARIO API)
   ========================================================================== */

import { obtenerProductos } from '../api/inventarioAPI.js';
import { 
    renderizarGridProductosPOS, 
    renderizarEstadoCargaPOS, 
    renderizarEstadoVacioPOS 
} from '../components/posCOM.js';
import { mostrarAdvertencia, mostrarExito, mostrarError } from '../utils/alertas.js';

let productosGlobales = [];
let carrito = [];
const IVA_TASA = 0.16;

const getElem = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
    enlazarEventosUI();
    await cargarProductosInventario();
});

/**
 * Consume productos directo desde la API global de inventario.
 */
async function cargarProductosInventario() {
    const contenedorGrid = getElem('contenedorProductosPos');
    renderizarEstadoCargaPOS(contenedorGrid);

    try {
        const respuesta = await obtenerProductos();
        
        // Normalización si el backend responde envolviendo datos o arreglo directo
        productosGlobales = Array.isArray(respuesta) ? respuesta : (respuesta?.datos || []);
        
        // Solo productos activos para la venta
        productosGlobales = productosGlobales.filter(p => (p.estatus || 'Activo') === 'Activo');

        actualizarGridPOS(productosGlobales);
    } catch (error) {
        console.error('Error al sincronizar con inventario API:', error);
        mostrarError('No se pudo cargar el catálogo de inventario ❌');
        renderizarEstadoVacioPOS(contenedorGrid, 'Error al conectar con el servidor.');
    }
}

/**
 * Detección de búsqueda manual y lectura de scanner de código de barras.
 */
function enlazarEventosUI() {
    const buscador = getElem('buscadorPos');
    const btnLimpiar = getElem('btnLimpiarBuscador');

    buscador?.addEventListener('input', (e) => {
        const texto = e.target.value.trim().toLowerCase();
        
        btnLimpiar?.classList.toggle('oculto', texto.length === 0);

        // Coincidencia exacta por scanner de código de barras
        const productoScanner = productosGlobales.find(p => (p.codigoBarras || '').trim().toLowerCase() === texto);
        if (productoScanner) {
            agregarAlCarrito(productoScanner);
            buscador.value = '';
            btnLimpiar?.classList.add('oculto');
            actualizarGridPOS(productosGlobales);
            return;
        }

        // Búsqueda parcial por nombre o código
        const filtrados = productosGlobales.filter(p => {
            const nom = (p.nombre || p.nombreProducto || '').toLowerCase();
            const cod = (p.codigoBarras || '').toLowerCase();
            return nom.includes(texto) || cod.includes(texto);
        });

        actualizarGridPOS(filtrados);
    });

    btnLimpiar?.addEventListener('click', () => {
        if (buscador) buscador.value = '';
        btnLimpiar.classList.add('oculto');
        actualizarGridPOS(productosGlobales);
        buscador?.focus();
    });

    getElem('btnVaciarCarrito')?.addEventListener('click', () => {
        if (carrito.length === 0) return;
        carrito = [];
        actualizarTicketUI();
    });

    getElem('btnCobrar')?.addEventListener('click', abrirModalPago);
    getElem('btnCerrarModalPago')?.addEventListener('click', cerrarModalPago);

    document.querySelectorAll('.btn-metodo-pago').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const metodo = e.currentTarget.dataset.metodo;
            procesarPago(metodo);
        });
    });
}

function actualizarGridPOS(lista) {
    const contenedorGrid = getElem('contenedorProductosPos');
    renderizarGridProductosPOS(lista, contenedorGrid, (prod) => agregarAlCarrito(prod));
}

/**
 * Lógica del Carrito de Compras
 */
function agregarAlCarrito(producto) {
    const id = producto.idProducto || producto.id;
    const stockDisponible = parseFloat(producto.stock || 0);

    if (stockDisponible <= 0) {
        mostrarAdvertencia('Producto sin stock disponible ⚠️');
        return;
    }

    const itemEnCarrito = carrito.find(item => item.id === id);

    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad < stockDisponible) {
            itemEnCarrito.cantidad++;
        } else {
            mostrarAdvertencia(`Stock máximo alcanzado (${stockDisponible} unidades) 🛑`);
        }
    } else {
        carrito.push({
            id: id,
            nombre: producto.nombre || producto.nombreProducto,
            precio: parseFloat(producto.precio || 0),
            cantidad: 1,
            maxStock: stockDisponible
        });
    }

    actualizarTicketUI();
}

window.posAjustarCantidad = (id, cambio) => {
    const item = carrito.find(i => i.id === id);
    if (!item) return;

    item.cantidad += cambio;

    if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
    } else if (item.cantidad > item.maxStock) {
        item.cantidad = item.maxStock;
        mostrarAdvertencia(`Stock máximo disponible: ${item.maxStock}`);
    }

    actualizarTicketUI();
};

function actualizarTicketUI() {
    const listaCarritoDOM = getElem('listaCarrito');
    const btnCobrar = getElem('btnCobrar');

    if (!listaCarritoDOM) return;

    if (carrito.length === 0) {
        listaCarritoDOM.innerHTML = `
            <div class="mensaje-vacio">
                <span class="icono-vacio">🛒</span>
                <p>El carrito está vacío.<br>Escanea o selecciona productos para comenzar.</p>
            </div>`;
        if (btnCobrar) btnCobrar.disabled = true;
    } else {
        listaCarritoDOM.innerHTML = carrito.map(item => `
            <div class="item-carrito">
                <div class="item-carrito-header">
                    <span class="item-nombre">${item.nombre}</span>
                    <span class="item-precio-unitario">$${item.precio.toFixed(2)}</span>
                </div>
                <div class="item-carrito-footer">
                    <div class="control-stepper-mini">
                        <button type="button" class="btn-step-mini" onclick="window.posAjustarCantidad(${item.id}, -1)">-</button>
                        <span class="cant-val">${item.cantidad}</span>
                        <button type="button" class="btn-step-mini" onclick="window.posAjustarCantidad(${item.id}, 1)">+</button>
                    </div>
                    <span class="item-subtotal">$${(item.precio * item.cantidad).toFixed(2)}</span>
                </div>
            </div>
        `).join('');

        if (btnCobrar) btnCobrar.disabled = false;
    }

    const { subtotal, iva, total } = calcularTotales();
    if (getElem('txtSubtotal')) getElem('txtSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    if (getElem('txtIva')) getElem('txtIva').textContent = `$${iva.toFixed(2)}`;
    if (getElem('txtTotal')) getElem('txtTotal').textContent = `$${total.toFixed(2)}`;
}

function calcularTotales() {
    const totalBruto = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const subtotal = totalBruto / (1 + IVA_TASA);
    const iva = totalBruto - subtotal;
    return { subtotal, iva, total: totalBruto };
}

function abrirModalPago() {
    if (carrito.length === 0) return;
    const { total } = calcularTotales();
    if (getElem('totalAPagarModal')) {
        getElem('totalAPagarModal').textContent = `$${total.toFixed(2)}`;
    }
    getElem('modalPago')?.classList.remove('oculto');
}

function cerrarModalPago() {
    getElem('modalPago')?.classList.add('oculto');
}

function procesarPago(metodo) {
    cerrarModalPago();
    mostrarExito(`¡Venta realizada exitosamente con ${metodo.toUpperCase()}! 💰`);
    carrito = [];
    actualizarTicketUI();
    cargarProductosInventario(); // Recarga stock actualizado
}