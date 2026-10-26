/* ==========================================================================
   CAJACOM.JS - APERTURA Y CIERRE DE CAJA (corte de caja del empleado)
   ========================================================================== */
import { obtenerCorteActivo, abrirCorte, cerrarCorte, obtenerDetalleCorte } from '../api/cortesCajaAPI.js';
import { mostrarConfirmacion, mostrarExito, mostrarError, mostrarAdvertencia } from '../utils/alertas.js';
import { validarMontoCaja } from '../validations/montosVLD.js';
import { formatearMoneda, formatearFechaHora, escaparHTML } from '../utils/helpers.js';

const get = (id) => document.getElementById(id);

const PANELES = { abrir: 'formAbrirCaja', cerrar: 'formCerrarCaja', resultado: 'panelResultadoCorte' };
const TITULOS = { abrir: 'Abrir caja 🔓', cerrar: 'Cerrar caja 🔒', resultado: 'Corte realizado ✅' };

function mostrarPanel(nombre) {
    Object.values(PANELES).forEach(id => get(id)?.classList.add('oculto'));
    get(PANELES[nombre])?.classList.remove('oculto');
    get('tituloCaja').textContent = TITULOS[nombre];
    get('modalCaja')?.classList.remove('oculto');
}

const cerrarModalCaja = () => get('modalCaja')?.classList.add('oculto');

/** Carga la tarjeta del modal dentro de <div id="contenedorCaja"> */
export async function inicializarCaja() {
    const contenedor = get('contenedorCaja');
    if (!contenedor || get('modalCaja')) return;

    try {
        const respuesta = await fetch('../cards/Tarjetacaja.html');
        if (!respuesta.ok) throw new Error(`Status: ${respuesta.status}`);
        contenedor.innerHTML = await respuesta.text();
    } catch (error) {
        console.error('Error al cargar la tarjeta de caja:', error);
    }
}

/**
 * Garantiza que el empleado tenga caja abierta. Si no, pide el fondo inicial.
 * @returns {Promise<{corte: Object|null, motivo: 'abierta'|'cancelada'|'error'}>}
 */
export async function asegurarCajaAbierta() {
    const respuesta = await obtenerCorteActivo();
    if (!respuesta.exito) {
        mostrarError(respuesta.mensaje || 'No se pudo verificar el estado de la caja.');
        return { corte: null, motivo: 'error' };
    }
    if (respuesta.datos) return { corte: respuesta.datos, motivo: 'abierta' };

    if (!get('modalCaja')) {
        mostrarError('No se pudo cargar la ventana de caja.');
        return { corte: null, motivo: 'error' };
    }

    const corte = await pedirApertura();
    return corte ? { corte, motivo: 'abierta' } : { corte: null, motivo: 'cancelada' };
}

function pedirApertura() {
    return new Promise((resolve) => {
        const form = get('formAbrirCaja');
        const input = get('inputFondoInicial');
        input.value = '';
        mostrarPanel('abrir');
        input.focus();

        // onsubmit/onclick (no addEventListener) evita acumular escuchas si se reabre
        form.onsubmit = async (e) => {
            e.preventDefault();

            const validacion = validarMontoCaja(input.value, 'El fondo inicial');
            if (!validacion.valido) return mostrarAdvertencia(validacion.mensaje);

            const respuesta = await abrirCorte(validacion.valor);
            if (!respuesta.exito) return mostrarError(respuesta.mensaje || 'No se pudo abrir la caja.');

            cerrarModalCaja();
            mostrarExito('Caja abierta. ¡Buenas ventas!');
            resolve(respuesta.datos || (await obtenerCorteActivo()).datos);
        };

        get('btnCancelarApertura').onclick = () => {
            cerrarModalCaja();
            resolve(null);
        };
    });
}

/**
 * Muestra el cierre de caja del corte indicado.
 * @returns {Promise<boolean>} true si la caja quedó cerrada
 */
export async function iniciarCierreCaja(corte) {
    const detalle = await obtenerDetalleCorte(corte.idCorte);
    if (!detalle.exito) {
        mostrarError(detalle.mensaje || 'No se pudo cargar el resumen de la caja.');
        return false;
    }
    if (!get('modalCaja')) {
        mostrarError('No se pudo cargar la ventana de caja.');
        return false;
    }

    renderizarResumenCorte(corte, detalle.datos.resumen || []);

    const form = get('formCerrarCaja');
    const inputMonto = get('inputMontoReal');
    const inputObs = get('inputObservaciones');
    const btnEnviar = get('btnEnviarCierre');
    inputMonto.value = '';
    inputObs.value = '';
    mostrarPanel('cerrar');
    inputMonto.focus();

    return new Promise((resolve) => {
        form.onsubmit = async (e) => {
            e.preventDefault();

            const validacion = validarMontoCaja(inputMonto.value, 'El efectivo contado');
            if (!validacion.valido) return mostrarAdvertencia(validacion.mensaje);

            const confirmado = await mostrarConfirmacion(
                `¿Cerrar la caja con ${formatearMoneda(validacion.valor)} contados? Esta acción no se puede deshacer.`,
                { textoAceptar: 'Sí, cerrar caja', textoCancelar: 'Revisar' }
            );
            if (!confirmado) return;

            btnEnviar.disabled = true;
            const respuesta = await cerrarCorte(validacion.valor, inputObs.value.trim());
            btnEnviar.disabled = false;

            if (!respuesta.exito) return mostrarError(respuesta.mensaje || 'No se pudo cerrar la caja.');

            renderizarResultado(respuesta.datos);
            mostrarPanel('resultado');
            get('btnResultadoListo').onclick = () => {
                cerrarModalCaja();
                resolve(true);
            };
        };

        get('btnCancelarCierre').onclick = () => {
            cerrarModalCaja();
            resolve(false);
        };
    });
}

function renderizarResumenCorte(corte, resumen) {
    const filas = resumen.length
        ? resumen.map(r => `
            <tr>
                <td>${escaparHTML(r.nombreMetodoPago)}</td>
                <td class="num">${Number(r.numVentas)}</td>
                <td class="num">${formatearMoneda(r.totalVentas)}</td>
            </tr>`).join('')
        : '<tr><td colspan="3">Sin ventas en este turno.</td></tr>';

    const totalVendido = resumen.reduce((acc, r) => acc + Number(r.totalVentas), 0);

    get('resumenCorte').innerHTML = `
        <p class="caja-dato"><span>Apertura</span><strong>${formatearFechaHora(corte.fechaApertura)}</strong></p>
        <p class="caja-dato"><span>Fondo inicial</span><strong>${formatearMoneda(corte.fondoInicial)}</strong></p>
        <table class="caja-tabla">
            <thead><tr><th>Método</th><th>Ventas</th><th>Total</th></tr></thead>
            <tbody>${filas}</tbody>
            <tfoot><tr><td>Total vendido</td><td></td><td class="num">${formatearMoneda(totalVendido)}</td></tr></tfoot>
        </table>`;
}

function renderizarResultado(corte) {
    const diferencia = Number(corte.diferencia);
    const clase = diferencia === 0 ? 'ok' : (diferencia > 0 ? 'sobrante' : 'faltante');
    const texto = diferencia === 0 ? 'Caja cuadrada' : (diferencia > 0 ? 'Sobrante' : 'Faltante');

    get('resultadoCorte').innerHTML = `
        <p class="caja-dato"><span>Efectivo esperado</span><strong>${formatearMoneda(corte.montoCalculado)}</strong></p>
        <p class="caja-dato"><span>Efectivo contado</span><strong>${formatearMoneda(corte.montoReal)}</strong></p>
        <p class="caja-dato caja-diferencia ${clase}">
            <span>${texto}</span><strong>${formatearMoneda(Math.abs(diferencia))}</strong>
        </p>
        <p class="caja-dato"><span>Cierre</span><strong>${formatearFechaHora(corte.fechaCierre)}</strong></p>`;
}