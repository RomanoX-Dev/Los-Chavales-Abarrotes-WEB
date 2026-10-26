/* ==========================================================================
   HISTORIALCOM.JS - TABLAS Y DETALLES DEL HISTORIAL (ventas y cortes de caja)
   Todas las funciones devuelven HTML como texto; el contenido dinámico va escapado.
   ========================================================================== */
import { escaparHTML as esc, formatearMoneda as dinero, formatearFechaHora } from '../utils/helpers.js';

const nombreCompleto = (nombre, apellido) => `${nombre || ''} ${apellido || ''}`.trim() || '—';
const claseEstatus = (estatus) => String(estatus || '').toLowerCase().replace(/[^a-z]/g, '') || 'otro';

/* ------------------------------- VENTAS ------------------------------- */
export function renderizarResumenVentas(ventas) {
    const completadas = ventas.filter(v => v.estatus === 'Completada');
    const total = completadas.reduce((acc, v) => acc + Number(v.total), 0);
    const n = completadas.length;
    return `<strong>${n}</strong> venta${n === 1 ? '' : 's'} completada${n === 1 ? '' : 's'} · Total vendido: <strong>${dinero(total)}</strong>`;
}

export function renderizarFilasVentas(ventas) {
    if (!ventas.length) {
        return '<tr><td colspan="8" class="vacio">No hay ventas en este rango de fechas.</td></tr>';
    }
    return ventas.map(v => `
        <tr>
            <td>#${Number(v.idVenta)}</td>
            <td>${formatearFechaHora(v.fechaVenta)}</td>
            <td>${esc(nombreCompleto(v.nombreEmpleado, v.apellidoPaterno))}</td>
            <td>${esc(v.nombreMetodoPago)}</td>
            <td class="num">${dinero(v.total)}</td>
            <td><span class="estatus estatus-${claseEstatus(v.estatus)}">${esc(v.estatus)}</span></td>
            <td>${v.idCorte ? `#${Number(v.idCorte)}` : '—'}</td>
            <td><button type="button" class="btn-ver" data-ver-venta="${Number(v.idVenta)}">Ver</button></td>
        </tr>`).join('');
}

export function renderizarDetalleVenta({ venta, detalles }) {
    const filas = detalles.map(d => `
        <tr>
            <td>${esc(d.nombreProducto)}</td>
            <td class="num">${Number(d.cantidad)} ${esc(d.abreviatura || '')}</td>
            <td class="num">${dinero(d.precioVenta)}</td>
            <td class="num">${dinero(d.subtotal)}</td>
        </tr>`).join('');

    return `
        <p class="caja-dato"><span>Fecha</span><strong>${formatearFechaHora(venta.fechaVenta)}</strong></p>
        <p class="caja-dato"><span>Vendedor</span><strong>${esc(nombreCompleto(venta.nombreEmpleado, venta.apellidoPaterno))}</strong></p>
        <p class="caja-dato"><span>Método de pago</span><strong>${esc(venta.nombreMetodoPago)}</strong></p>
        <p class="caja-dato"><span>Corte de caja</span><strong>${venta.idCorte ? `#${Number(venta.idCorte)}` : '—'}</strong></p>
        ${venta.urlComprobante ? `<p class="caja-dato"><span>Comprobante</span><a href="${esc(venta.urlComprobante)}" target="_blank" rel="noopener noreferrer">Ver imagen</a></p>` : ''}

        <table class="caja-tabla">
            <thead><tr><th>Producto</th><th class="num">Cant.</th><th class="num">Precio</th><th class="num">Importe</th></tr></thead>
            <tbody>${filas}</tbody>
        </table>
        <p class="nota-iva">Los precios de los productos incluyen IVA.</p>

        <div class="caja-resumen">
            <p class="caja-dato"><span>Subtotal (sin IVA)</span><strong>${dinero(venta.subtotal)}</strong></p>
            <p class="caja-dato"><span>Descuento</span><strong>-${dinero(venta.descuento)}</strong></p>
            <p class="caja-dato"><span>IVA incluido</span><strong>${dinero(venta.iva)}</strong></p>
            <p class="caja-dato"><span>Envío</span><strong>${dinero(venta.costoEnvio)}</strong></p>
            <p class="caja-dato caja-total"><span>TOTAL</span><strong>${dinero(venta.total)}</strong></p>
        </div>`;
}

/* ------------------------------- CORTES ------------------------------- */
function celdaDiferencia(corte) {
    if (!corte.fechaCierre) return '<span class="dif-abierto">En curso</span>';
    const dif = Number(corte.diferencia);
    const clase = dif === 0 ? 'ok' : (dif > 0 ? 'sobrante' : 'faltante');
    const signo = dif > 0 ? '+' : (dif < 0 ? '-' : '');
    return `<span class="dif-${clase}">${signo}${dinero(Math.abs(dif))}</span>`;
}

export function renderizarFilasCortes(cortes) {
    if (!cortes.length) {
        return '<tr><td colspan="9" class="vacio">No hay cortes de caja registrados.</td></tr>';
    }
    return cortes.map(c => {
        const cerrado = Boolean(c.fechaCierre);
        return `
        <tr>
            <td>#${Number(c.idCorte)}</td>
            <td>${esc(nombreCompleto(c.nombre, c.apellidoPaterno))}</td>
            <td>${formatearFechaHora(c.fechaApertura)}</td>
            <td>${cerrado ? formatearFechaHora(c.fechaCierre) : '—'}</td>
            <td class="num">${dinero(c.fondoInicial)}</td>
            <td class="num">${cerrado ? dinero(c.montoCalculado) : '—'}</td>
            <td class="num">${cerrado ? dinero(c.montoReal) : '—'}</td>
            <td class="num">${celdaDiferencia(c)}</td>
            <td><button type="button" class="btn-ver" data-ver-corte="${Number(c.idCorte)}">Ver</button></td>
        </tr>`;
    }).join('');
}

export function renderizarDetalleCorte({ corte, resumen, ventas }) {
    const filasResumen = resumen.length
        ? resumen.map(r => `
            <tr>
                <td>${esc(r.nombreMetodoPago)}</td>
                <td class="num">${Number(r.numVentas)}</td>
                <td class="num">${dinero(r.totalVentas)}</td>
            </tr>`).join('')
        : '<tr><td colspan="3" class="vacio">Sin ventas en este corte.</td></tr>';

    const filasVentas = ventas.length
        ? ventas.map(v => `
            <tr>
                <td>#${Number(v.idVenta)}</td>
                <td>${formatearFechaHora(v.fechaVenta)}</td>
                <td>${esc(v.nombreMetodoPago)}</td>
                <td class="num">${dinero(v.total)}</td>
                <td>${esc(v.estatus)}</td>
            </tr>`).join('')
        : '<tr><td colspan="5" class="vacio">Sin ventas.</td></tr>';

    const cerrado = Boolean(corte.fechaCierre);

    return `
        <p class="caja-dato"><span>Empleado</span><strong>${esc(nombreCompleto(corte.nombre, corte.apellidoPaterno))}</strong></p>
        <p class="caja-dato"><span>Apertura</span><strong>${formatearFechaHora(corte.fechaApertura)}</strong></p>
        <p class="caja-dato"><span>Cierre</span><strong>${cerrado ? formatearFechaHora(corte.fechaCierre) : 'En curso'}</strong></p>
        <p class="caja-dato"><span>Fondo inicial</span><strong>${dinero(corte.fondoInicial)}</strong></p>
        ${cerrado ? `
            <p class="caja-dato"><span>Efectivo esperado</span><strong>${dinero(corte.montoCalculado)}</strong></p>
            <p class="caja-dato"><span>Efectivo contado</span><strong>${dinero(corte.montoReal)}</strong></p>
            <p class="caja-dato"><span>Diferencia</span><strong>${celdaDiferencia(corte)}</strong></p>` : ''}
        ${corte.observaciones ? `<p class="caja-dato"><span>Observaciones</span><strong>${esc(corte.observaciones)}</strong></p>` : ''}

        <h4 class="subtitulo-detalle">Totales por método de pago</h4>
        <table class="caja-tabla">
            <thead><tr><th>Método</th><th class="num">Ventas</th><th class="num">Total</th></tr></thead>
            <tbody>${filasResumen}</tbody>
        </table>

        <h4 class="subtitulo-detalle">Ventas del corte</h4>
        <div class="tabla-scroll">
            <table class="caja-tabla">
                <thead><tr><th>Venta</th><th>Fecha</th><th>Método</th><th class="num">Total</th><th>Estado</th></tr></thead>
                <tbody>${filasVentas}</tbody>
            </table>
        </div>`;
}