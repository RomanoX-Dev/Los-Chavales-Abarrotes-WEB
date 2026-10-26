import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/cortes-caja';

// Mi caja abierta. Si no hay, { exito: true, datos: null } (no es un error).
export async function obtenerCorteActivo() {
    const data = await fetchConAuth(`${ENDPOINT}/activo`);
    if (!data.exito) return { exito: false, mensaje: data.mensaje, datos: null };
    return { exito: true, datos: data.datos ?? null };
}

export async function abrirCorte(fondoInicial) {
    const data = await fetchConAuth(`${ENDPOINT}/abrir`, {
        method: 'POST',
        body: JSON.stringify({ fondoInicial })
    });
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos };
}

// Cierra la caja abierta del propio empleado. Devuelve el corte con montoCalculado y diferencia.
export async function cerrarCorte(montoReal, observaciones = '') {
    const data = await fetchConAuth(`${ENDPOINT}/cerrar`, {
        method: 'POST',
        body: JSON.stringify({ montoReal, observaciones })
    });
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos };
}

export async function obtenerHistorialCortes({ idEmpleado, limite = 50 } = {}) {
    const params = new URLSearchParams();
    if (idEmpleado) params.set('idEmpleado', idEmpleado);
    params.set('limite', limite);

    const data = await fetchConAuth(`${ENDPOINT}/historial?${params}`);
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos || [] };
}

// Devuelve { corte, resumen, ventas }
export async function obtenerDetalleCorte(idCorte) {
    const data = await fetchConAuth(`${ENDPOINT}/${idCorte}`);
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos };
}