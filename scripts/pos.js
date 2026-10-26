/* ==========================================================================
   POS.JS - MOTOR PRINCIPAL DEL PUNTO DE VENTA
   El servidor calcula precios, descuento, IVA y total. Aquí solo se muestra una
   vista previa con la misma fórmula (utils/calculoVentas.js).
   ========================================================================== */
import { obtenerProductosPOS, registrarVentaDB } from '../api/posAPI.js';
import { renderizarGridProductosPOS, renderizarEstadoCargaPOS, renderizarEstadoVacioPOS } from '../components/posCOM.js';
import { inicializarCaja, asegurarCajaAbierta, iniciarCierreCaja } from '../components/cajaCOM.js';
import { validarStockDisponible, validarVentaPermitida } from '../validations/posVLD.js';
import { validarDescuento, validarEnvio } from '../validations/montosVLD.js';
import { inicializarMetodosPago, abrirModalPago } from '../scripts/metodosPago.js';
import { calcularMontos, DESCUENTO_MAX_POR_ROL, ENVIO_MAX, IVA_TASA } from '../utils/calculoVentas.js';
import { mostrarExito, mostrarError, mostrarConfirmacion, mostrarAdvertencia } from '../utils/alertas.js';
import { mostrarCargador, ocultarCargador } from '../utils/cargador.js';
import { requerirRol, obtenerRol, formatearMoneda, formatearFechaHora, escaparHTML } from '../utils/helpers.js';

let productosGlobales = [];
let carrito = [];
let corteActual = null;
let timerBusqueda = null;
let procesandoVenta = false;

const descuentoMax = DESCUENTO_MAX_POR_ROL[obtenerRol()] ?? 0;
const getElem = (id) => document.getElementById(id);

/* ----------------------------- INICIO ----------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
    if (!requerirRol('Administrador', 'Gerente', 'Vendedor')) return;

    enlazarEventosUI();
    configurarCamposAjuste();
    actualizarTicketUI();

    try {
        await inicializarMetodosPago();
        await inicializarCaja();

        const { corte, motivo } = await asegurarCajaAbierta();
        if (motivo === 'cancelada') {
            window.location.href = 'menu.html';
            return;
        }
        if (!corte) {
            renderizarEstadoVacioPOS(getElem('contenedorProductosPos'), 'No se pudo verificar la caja. Recarga la página.');
            return;
        }

        corteActual = corte;
        pintarEstadoCaja();
        await cargarProductosInventario();
        getElem('buscadorPos')?.focus();
    } catch (error) {
        console.error('Error al inicializar el POS:', error);
        mostrarError('Ocurrió un error al iniciar el punto de venta.');
    }
});

function pintarEstadoCaja() {
    const chip = getElem('chipCaja');
    if (!chip) return;
    chip.textContent = corteActual
        ? `🔓 Caja #${corteActual.idCorte} · desde ${formatearFechaHora(corteActual.fechaApertura)}`
        : '🔒 Caja cerrada';
}

/* --------------------------- PRODUCTOS --------------------------- */
async function cargarProductosInventario() {
    const contenedorGrid = getElem('contenedorProductosPos');
    renderizarEstadoCargaPOS(contenedorGrid);

    try {
        const lista = await obtenerProductosPOS();

        productosGlobales = lista
            .filter(p => p && typeof p === 'object')
            .map(p => ({
                ...p,
                nombreProducto: p.nombreProducto || p.nombre || 'Producto sin nombre',
                precio: parseFloat(p.precio || 0),
                stock: parseFloat(p.stock || 0),
                stockMinimo: parseFloat(p.stockMinimo || 0)
            }));

        actualizarGridPOS(productosGlobales);
    } catch (error) {
        renderizarEstadoVacioPOS(contenedorGrid, 'Error al conectar con el servidor.');
        mostrarError('Error crítico al cargar el inventario de productos.');
    }
}

function actualizarGridPOS(lista) {
    renderizarGridProductosPOS(lista, getElem('contenedorProductosPos'), agregarAlCarrito);
}

/* ------------------------------ EVENTOS ------------------------------ */
function enlazarEventosUI() {
    const buscador = getElem('buscadorPos');

    // Enter: pistolas de código de barras
    buscador?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const texto = buscador.value.trim().toLowerCase();
        const producto = productosGlobales.find(p => (p.codigoBarras || '').trim().toLowerCase() === texto);
        if (producto) {
            agregarAlCarrito(producto);
            buscador.value = '';
            actualizarGridPOS(productosGlobales);
        }
    });

    buscador?.addEventListener('input', (e) => {
        const texto = e.target.value.trim().toLowerCase();

        // Coincidencia inmediata de escáner por código de barras
        const productoScanner = productosGlobales.find(p => (p.codigoBarras || '').trim().toLowerCase() === texto);
        if (texto && productoScanner) {
            agregarAlCarrito(productoScanner);
            buscador.value = '';
            actualizarGridPOS(productosGlobales);
            return;
        }

        // Debounce para no renderizar en cada tecla
        clearTimeout(timerBusqueda);
        timerBusqueda = setTimeout(() => {
            const filtrados = productosGlobales.filter(p => {
                const nom = (p.nombreProducto || '').toLowerCase();
                const cod = (p.codigoBarras || '').toLowerCase();
                return nom.includes(texto) || cod.includes(texto);
            });
            actualizarGridPOS(filtrados);
        }, 200);
    });

    // Botones + / - del ticket (delegación, sin funciones globales)
    getElem('listaCarrito')?.addEventListener('click', (e) => {
        const boton = e.target.closest('[data-accion]');
        if (!boton) return;
        ajustarCantidad(Number(boton.dataset.id), boton.dataset.accion === 'mas' ? 1 : -1);
    });

    getElem('btnVaciarCarrito')?.addEventListener('click', (e) => {
        e.preventDefault();
        solicitarVaciarCarrito();
    });

    getElem('btnCobrar')?.addEventListener('click', (e) => {
        e.preventDefault();
        iniciarCobro();
    });

    getElem('btnCerrarCaja')?.addEventListener('click', (e) => {
        e.preventDefault();
        cerrarCaja();
    });
}

function configurarCamposAjuste() {
    const inputDescuento = getElem('inputDescuento');
    const inputEnvio = getElem('inputEnvio');

    if (inputDescuento) {
        inputDescuento.max = descuentoMax;
        inputDescuento.disabled = descuentoMax === 0;
    }
    if (inputEnvio) inputEnvio.max = ENVIO_MAX;

    inputDescuento?.addEventListener('input', actualizarTicketUI);
    inputEnvio?.addEventListener('input', actualizarTicketUI);
}

/* ------------------------------ CARRITO ------------------------------ */
function agregarAlCarrito(producto) {
    if (!producto || !producto.idProducto) {
        mostrarAdvertencia('El producto seleccionado no es válido.');
        return;
    }

    const id = producto.idProducto;
    const stockDisponible = parseFloat(producto.stock || 0);

    if (stockDisponible <= 0) {
        mostrarAdvertencia(`El producto "${producto.nombreProducto}" está agotado.`);
        return;
    }

    const itemEnCarrito = carrito.find(item => item.idProducto === id);
    const cantidadNueva = itemEnCarrito ? itemEnCarrito.cantidad + 1 : 1;

    if (!validarStockDisponible(cantidadNueva, stockDisponible)) {
        mostrarAdvertencia(`Stock insuficiente para ${producto.nombreProducto}. Máximo disponible: ${stockDisponible}.`);
        return;
    }

    if (itemEnCarrito) {
        itemEnCarrito.cantidad = cantidadNueva;
        itemEnCarrito.subtotal = Number((itemEnCarrito.cantidad * itemEnCarrito.precio).toFixed(2));
    } else {
        const precioUnitario = parseFloat(producto.precio || 0);
        carrito.push({
            idProducto: id,
            nombreProducto: producto.nombreProducto,
            precio: precioUnitario,
            cantidad: 1,
            subtotal: precioUnitario
        });
    }
    actualizarTicketUI();
}

function ajustarCantidad(id, cambio) {
    const item = carrito.find(i => i.idProducto === id);
    if (!item) return;

    const productoOriginal = productosGlobales.find(p => p.idProducto === id);
    const stockDisponible = parseFloat(productoOriginal?.stock || 0);
    const cantidadNueva = item.cantidad + cambio;

    if (cantidadNueva <= 0) {
        carrito = carrito.filter(i => i.idProducto !== id);
    } else if (validarStockDisponible(cantidadNueva, stockDisponible)) {
        item.cantidad = cantidadNueva;
        item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
    } else {
        mostrarAdvertencia(`No hay más stock disponible en inventario (${stockDisponible} máx).`);
    }
    actualizarTicketUI();
}

async function solicitarVaciarCarrito() {
    if (carrito.length === 0) {
        mostrarAdvertencia('El carrito ya está vacío.');
        return;
    }

    const confirmado = await mostrarConfirmacion(
        '¿Estás seguro de vaciar el ticket de venta? Se eliminarán todos los artículos.',
        { textoAceptar: 'Sí, vaciar' }
    );
    if (confirmado) {
        limpiarVenta();
        mostrarAdvertencia('El carrito ha sido vaciado.');
    }
}

function limpiarVenta() {
    carrito = [];
    const inputDescuento = getElem('inputDescuento');
    const inputEnvio = getElem('inputEnvio');
    if (inputDescuento) inputDescuento.value = '';
    if (inputEnvio) inputEnvio.value = '';
    actualizarTicketUI();
}

/* ------------------------------ TOTALES ------------------------------ */
function leerAjustes() {
    return {
        descuento: validarDescuento(getElem('inputDescuento')?.value, descuentoMax),
        envio: validarEnvio(getElem('inputEnvio')?.value, ENVIO_MAX)
    };
}

function calcularTotalesUI() {
    const { descuento, envio } = leerAjustes();
    return calcularMontos({
        lineas: carrito.map(i => ({ precio: i.precio, cantidad: i.cantidad })),
        descuentoPorcentaje: descuento.valido ? descuento.valor : 0,
        costoEnvio: envio.valido ? envio.valor : 0
    });
}

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
    } else {
        listaCarritoDOM.innerHTML = carrito.map(item => `
            <div class="item-carrito">
                <div class="item-carrito-header">
                    <span class="item-nombre">${escaparHTML(item.nombreProducto)}</span>
                    <span class="item-precio-unitario">${formatearMoneda(item.precio)}</span>
                </div>
                <div class="item-carrito-footer">
                    <div class="control-stepper-mini">
                        <button type="button" class="btn-step-mini" data-accion="menos" data-id="${item.idProducto}">-</button>
                        <span class="cant-val">${item.cantidad}</span>
                        <button type="button" class="btn-step-mini" data-accion="mas" data-id="${item.idProducto}">+</button>
                    </div>
                    <span class="item-subtotal">${formatearMoneda(item.subtotal)}</span>
                </div>
            </div>
        `).join('');
    }

    // Mensajes de ayuda de descuento y envío
    const { descuento, envio } = leerAjustes();
    pintarAyuda('ayudaDescuento', descuento.valido
        ? (descuentoMax > 0 ? `Máximo ${descuentoMax}% para tu rol` : 'Tu rol no puede aplicar descuentos')
        : descuento.mensaje, !descuento.valido);
    pintarAyuda('ayudaEnvio', envio.valido ? '' : envio.mensaje, !envio.valido);

    const montos = calcularTotalesUI();
    setTexto('txtSubtotal', formatearMoneda(montos.subtotal));
    setTexto('txtDescuento', `-${formatearMoneda(montos.descuento)}`);
    setTexto('txtIva', formatearMoneda(montos.iva));
    setTexto('txtEnvio', formatearMoneda(montos.costoEnvio));
    setTexto('txtTotal', formatearMoneda(montos.total));

    if (btnCobrar) btnCobrar.disabled = carrito.length === 0 || !descuento.valido || !envio.valido;
}

function setTexto(id, texto) {
    const el = getElem(id);
    if (el) el.textContent = texto;
}

function pintarAyuda(id, texto, esError) {
    const el = getElem(id);
    if (!el) return;
    el.textContent = texto;
    el.classList.toggle('error', Boolean(esError));
}

/* ------------------------------- COBRO ------------------------------- */
function iniciarCobro() {
    if (!corteActual) {
        mostrarAdvertencia('Abre tu caja para poder vender.');
        return;
    }
    if (!validarVentaPermitida(carrito)) {
        mostrarAdvertencia('Agrega productos al carrito para proceder a cobrar.');
        return;
    }

    for (const item of carrito) {
        const prod = productosGlobales.find(p => p.idProducto === item.idProducto);
        const stockActual = prod ? parseFloat(prod.stock || 0) : 0;
        if (!validarStockDisponible(item.cantidad, stockActual)) {
            mostrarError(`El stock de "${item.nombreProducto}" cambió. Disponible actual: ${stockActual}.`);
            actualizarTicketUI();
            return;
        }
    }

    const { descuento, envio } = leerAjustes();
    if (!descuento.valido) return mostrarAdvertencia(descuento.mensaje);
    if (!envio.valido) return mostrarAdvertencia(envio.mensaje);

    const montos = calcularTotalesUI();
    abrirModalPago(montos.total, (pago) => procesarVentaServidor(pago, descuento.valor, envio.valor, montos));
}

async function procesarVentaServidor({ metodo, urlComprobante, montoRecibido }, pctDescuento, envio, montosPrevios) {
    if (!metodo || !metodo.idMetodoPago) {
        mostrarError('Debes seleccionar un método de pago válido.');
        return;
    }
    if (procesandoVenta) return;
    procesandoVenta = true;

    // El servidor ignora precios y totales: solo necesita QUÉ se vende, CUÁNTO y CÓMO se paga
    const payload = {
        idMetodoPago: metodo.idMetodoPago,
        descuentoPorcentaje: pctDescuento,
        costoEnvio: envio,
        urlComprobante: urlComprobante || null,
        listaProductos: carrito.map(i => ({ idProducto: i.idProducto, cantidad: i.cantidad }))
    };

    mostrarCargador('Procesando pago en el servidor...', 0);

    try {
        const respuesta = await registrarVentaDB(payload);

        if (respuesta.exito) {
            const venta = respuesta.datos;
            if (Math.abs(Number(venta.total) - montosPrevios.total) > 0.009) {
                console.warn('El total del servidor difiere de la vista previa:', venta.total, montosPrevios.total);
            }

            let mensaje = `Venta #${venta.idVenta} cobrada: ${formatearMoneda(venta.total)}.`;
            if (montoRecibido) {
                const cambio = Math.max(0, Math.round((montoRecibido - Number(venta.total)) * 100) / 100);
                mensaje += ` Cambio: ${formatearMoneda(cambio)}.`;
            }
            mostrarExito(mensaje);

            limpiarVenta();
            await cargarProductosInventario();
        } else if (/abrir caja/i.test(respuesta.mensaje)) {
            corteActual = null;
            mostrarError('Tu caja ya no está abierta. Recargando...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            mostrarError(respuesta.mensaje);
        }
    } catch (error) {
        mostrarError('Error de red crítico. Verifica tu conexión e intenta cobrar de nuevo.');
        console.error('Error al procesar venta:', error);
    } finally {
        ocultarCargador();
        procesandoVenta = false;
    }
}

/* ------------------------------- CAJA ------------------------------- */
async function cerrarCaja() {
    if (!corteActual) {
        mostrarAdvertencia('No hay una caja abierta.');
        return;
    }

    if (carrito.length > 0) {
        const seguir = await mostrarConfirmacion(
            'Tienes productos en el ticket sin cobrar. Si cierras la caja se perderán. ¿Continuar?',
            { textoAceptar: 'Continuar' }
        );
        if (!seguir) return;
    }

    const cerrada = await iniciarCierreCaja(corteActual);
    if (cerrada) window.location.href = 'menu.html';
}