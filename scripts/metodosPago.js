/* ==========================================================================
   METODOSPAGO.JS - MODAL DE COBRO (MÉTODO, EFECTIVO Y COMPROBANTE)
   abrirModalPago(total, callback) -> callback({ metodo, urlComprobante?, montoRecibido? })
   ========================================================================== */
import { obtenerMetodosPago } from '../api/metodosPagoAPI.js';
import { renderizarMetodosPagoPOS } from '../components/metodosPagoCOM.js';
import { mostrarConfirmacion, mostrarAdvertencia, mostrarError } from '../utils/alertas.js';
import { mostrarCargador, ocultarCargador } from '../utils/cargador.js';
import { subirComprobante, formatearMoneda } from '../utils/helpers.js';
import { validarMontoPago } from '../validations/posVLD.js';

const get = (id) => document.getElementById(id);
const redondear = (n) => Math.round(Number(n) * 100) / 100;

let callbackPagoGlobal = null;
let totalActual = 0;
let metodoElegido = null;
let archivoComprobante = null;

function mostrarPaso(paso) {
    get('contenedorMetodosPago')?.classList.toggle('oculto', paso !== 'metodos');
    get('pasoEfectivo')?.classList.toggle('oculto', paso !== 'efectivo');
    get('pasoComprobante')?.classList.toggle('oculto', paso !== 'comprobante');
}

function reiniciarPasos() {
    const inputMonto = get('inputMontoRecibido');
    const inputArchivo = get('inputComprobante');
    if (inputMonto) inputMonto.value = '';
    if (inputArchivo) inputArchivo.value = '';
    get('previewComprobante')?.classList.add('oculto');
    const txtCambio = get('txtCambio');
    if (txtCambio) txtCambio.textContent = formatearMoneda(0);
    const btnEfectivo = get('btnConfirmarEfectivo');
    const btnComprobante = get('btnConfirmarComprobante');
    if (btnEfectivo) btnEfectivo.disabled = true;
    if (btnComprobante) btnComprobante.disabled = true;
}

async function cancelarCobro() {
    const confirmado = await mostrarConfirmacion('¿Deseas cancelar el proceso de cobro actual?', {
        textoAceptar: 'Sí, cancelar cobro',
        textoCancelar: 'Seguir cobrando'
    });
    if (confirmado) {
        cerrarModalPago();
        mostrarAdvertencia('Venta o cobro cancelado por el usuario.');
    }
}

export async function inicializarMetodosPago() {
    const contenedor = get('contenedorModalPago');
    if (!contenedor) return;

    try {
        const respuesta = await fetch('../cards/Tarjetametodopago.html');
        if (!respuesta.ok) throw new Error(`Status: ${respuesta.status}`);
        contenedor.innerHTML = await respuesta.text();
    } catch (error) {
        console.error('Error al cargar la tarjeta del modal de pago:', error);
        return;
    }

    const modalPago = get('modalPago');

    get('btnCerrarModalPago')?.addEventListener('click', cancelarCobro);
    modalPago?.addEventListener('click', (e) => {
        if (e.target === modalPago) cancelarCobro();
    });

    get('btnVolverEfectivo')?.addEventListener('click', () => mostrarPaso('metodos'));
    get('btnVolverComprobante')?.addEventListener('click', () => mostrarPaso('metodos'));

    get('inputMontoRecibido')?.addEventListener('input', actualizarCambio);
    get('btnConfirmarEfectivo')?.addEventListener('click', confirmarEfectivo);

    get('inputComprobante')?.addEventListener('change', alElegirArchivo);
    get('btnConfirmarComprobante')?.addEventListener('click', confirmarComprobante);
}

export async function abrirModalPago(total, callback) {
    const modal = get('modalPago');
    const contenedorOpciones = get('contenedorMetodosPago');
    if (!modal || !contenedorOpciones) return;

    callbackPagoGlobal = callback;
    totalActual = redondear(total);
    metodoElegido = null;
    archivoComprobante = null;

    get('totalAPagarModal').textContent = formatearMoneda(totalActual);
    reiniciarPasos();
    mostrarPaso('metodos');
    modal.classList.remove('oculto');
    contenedorOpciones.innerHTML = '<div class="spinner"></div>';

    const metodos = await obtenerMetodosPago();
    renderizarMetodosPagoPOS(metodos, contenedorOpciones, alElegirMetodo);
}

export function cerrarModalPago() {
    get('modalPago')?.classList.add('oculto');
    callbackPagoGlobal = null;
    metodoElegido = null;
    archivoComprobante = null;
}

function finalizar(resultado) {
    const callback = callbackPagoGlobal;
    cerrarModalPago();
    if (callback) callback(resultado);
}

function alElegirMetodo(metodo) {
    metodoElegido = metodo;

    if (metodo.esEfectivo) {
        mostrarPaso('efectivo');
        get('inputMontoRecibido')?.focus();
    } else if (metodo.requiereComprobante) {
        mostrarPaso('comprobante');
    } else {
        finalizar({ metodo });
    }
}

/* ------------------------------ EFECTIVO ------------------------------ */
function actualizarCambio() {
    const recibido = redondear(get('inputMontoRecibido').value || 0);
    const cambio = redondear(recibido - totalActual);

    get('txtCambio').textContent = formatearMoneda(cambio > 0 ? cambio : 0);
    get('btnConfirmarEfectivo').disabled = !validarMontoPago(recibido, totalActual);
}

function confirmarEfectivo() {
    const recibido = redondear(get('inputMontoRecibido').value || 0);
    if (!validarMontoPago(recibido, totalActual)) {
        mostrarAdvertencia('El monto recibido no cubre el total de la venta.');
        return;
    }
    finalizar({ metodo: metodoElegido, montoRecibido: recibido });
}

/* ---------------------------- COMPROBANTE ---------------------------- */
function alElegirArchivo(e) {
    const archivo = e.target.files?.[0];
    const preview = get('previewComprobante');
    const btnConfirmar = get('btnConfirmarComprobante');

    archivoComprobante = null;
    btnConfirmar.disabled = true;
    preview?.classList.add('oculto');

    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
        mostrarAdvertencia('El comprobante debe ser una imagen.');
        e.target.value = '';
        return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
        mostrarAdvertencia('La imagen no puede pesar más de 5 MB.');
        e.target.value = '';
        return;
    }

    archivoComprobante = archivo;
    if (preview) {
        preview.src = URL.createObjectURL(archivo);
        preview.classList.remove('oculto');
    }
    btnConfirmar.disabled = false;
}

async function confirmarComprobante() {
    if (!archivoComprobante) return;

    mostrarCargador('Subiendo comprobante...', 0);
    const resultado = await subirComprobante(archivoComprobante);
    ocultarCargador();

    if (!resultado.exito) {
        mostrarError(resultado.mensaje);
        return;
    }
    finalizar({ metodo: metodoElegido, urlComprobante: resultado.url });
}