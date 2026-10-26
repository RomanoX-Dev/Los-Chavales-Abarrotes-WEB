/* ==========================================================================
   HISTORIAL.JS - HISTORIAL DE VENTAS Y CORTES DE CAJA
   Vendedor: solo ve lo suyo (el servidor lo garantiza). Administrador/Gerente: todo.
   ========================================================================== */
import { obtenerHistorialVentas, obtenerVentaPorId, obtenerEmpleadosParaFiltro } from '../api/posAPI.js';
import { obtenerHistorialCortes, obtenerDetalleCorte } from '../api/cortesCajaAPI.js';
import {
    renderizarResumenVentas, renderizarFilasVentas, renderizarDetalleVenta,
    renderizarFilasCortes, renderizarDetalleCorte
} from '../components/historialCOM.js';
import { requerirRol, tieneRol, hoyLocalStr, inicioDelDiaISO, finDelDiaISO, escaparHTML } from '../utils/helpers.js';
import { mostrarError, mostrarAdvertencia } from '../utils/alertas.js';

const get = (id) => document.getElementById(id);
let cortesCargados = false;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requerirRol('Administrador', 'Gerente', 'Vendedor')) return;

    const esGerencia = tieneRol('Administrador', 'Gerente');

    // Rango por defecto: hoy
    const hoy = hoyLocalStr();
    get('filtroDesde').value = hoy;
    get('filtroHasta').value = hoy;

    if (esGerencia) {
        get('grupoEmpleado').classList.remove('oculto');
        cargarSelectorEmpleados();
    }

    enlazarEventos(esGerencia);
    await cargarVentas(esGerencia);
});

async function cargarSelectorEmpleados() {
    const select = get('filtroEmpleado');
    const empleados = await obtenerEmpleadosParaFiltro();

    empleados.forEach(e => {
        const nombre = `${e.nombre || ''} ${e.apellidoPaterno || ''}`.trim() || `Empleado #${e.idEmpleado}`;
        select.insertAdjacentHTML('beforeend',
            `<option value="${Number(e.idEmpleado)}">${escaparHTML(nombre)}</option>`);
    });
}

function enlazarEventos(esGerencia) {
    get('formFiltrosVentas').addEventListener('submit', (e) => {
        e.preventDefault();
        cargarVentas(esGerencia);
    });

    // Pestañas
    document.querySelectorAll('.tab-btn').forEach(boton => {
        boton.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('activo', b === boton));
            const verVentas = boton.dataset.tab === 'ventas';
            get('tabVentas').classList.toggle('oculto', !verVentas);
            get('tabCortes').classList.toggle('oculto', verVentas);

            if (!verVentas && !cortesCargados) cargarCortes();
        });
    });

    // Botones "Ver" (delegación)
    get('tbodyVentas').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-ver-venta]');
        if (boton) abrirDetalleVenta(Number(boton.dataset.verVenta));
    });
    get('tbodyCortes').addEventListener('click', (e) => {
        const boton = e.target.closest('[data-ver-corte]');
        if (boton) abrirDetalleCorte(Number(boton.dataset.verCorte));
    });

    // Modal
    const modal = get('modalDetalle');
    get('btnCerrarDetalle').addEventListener('click', cerrarDetalle);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) cerrarDetalle();
    });
}

/* ------------------------------- VENTAS ------------------------------- */
async function cargarVentas(esGerencia) {
    const desde = get('filtroDesde').value;
    const hasta = get('filtroHasta').value;

    if (desde && hasta && desde > hasta) {
        mostrarAdvertencia('La fecha inicial no puede ser mayor que la final.');
        return;
    }

    const filtros = { limite: 200 };
    if (desde) filtros.desde = inicioDelDiaISO(desde);
    if (hasta) filtros.hasta = finDelDiaISO(hasta);
    if (esGerencia) filtros.idEmpleado = get('filtroEmpleado').value;

    const respuesta = await obtenerHistorialVentas(filtros);
    if (!respuesta.exito) {
        mostrarError(respuesta.mensaje || 'No se pudo cargar el historial de ventas.');
        return;
    }

    get('resumenVentas').innerHTML = renderizarResumenVentas(respuesta.datos);
    get('tbodyVentas').innerHTML = renderizarFilasVentas(respuesta.datos);
}

async function abrirDetalleVenta(idVenta) {
    const respuesta = await obtenerVentaPorId(idVenta);
    if (!respuesta.exito) {
        mostrarError(respuesta.mensaje || 'No se pudo cargar la venta.');
        return;
    }
    get('tituloDetalle').textContent = `Venta #${idVenta}`;
    get('detalleContenido').innerHTML = renderizarDetalleVenta(respuesta.datos);
    get('modalDetalle').classList.remove('oculto');
}

/* ------------------------------- CORTES ------------------------------- */
async function cargarCortes() {
    const respuesta = await obtenerHistorialCortes({ limite: 50 });
    if (!respuesta.exito) {
        mostrarError(respuesta.mensaje || 'No se pudo cargar el historial de cortes.');
        return;
    }
    cortesCargados = true;
    get('tbodyCortes').innerHTML = renderizarFilasCortes(respuesta.datos);
}

async function abrirDetalleCorte(idCorte) {
    const respuesta = await obtenerDetalleCorte(idCorte);
    if (!respuesta.exito) {
        mostrarError(respuesta.mensaje || 'No se pudo cargar el corte.');
        return;
    }
    get('tituloDetalle').textContent = `Corte de caja #${idCorte}`;
    get('detalleContenido').innerHTML = renderizarDetalleCorte(respuesta.datos);
    get('modalDetalle').classList.remove('oculto');
}

function cerrarDetalle() {
    get('modalDetalle').classList.add('oculto');
}