import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT_PRODUCTOS = '/api/productos';
const ENDPOINT_VENTAS = '/api/ventas';
const ENDPOINT_EMPLEADOS = '/api/empleados';

// fetchConAuth YA devuelve el JSON convertido y nunca lanza: si falla, trae { exito: false, mensaje }.
export async function obtenerProductosPOS() {
    const data = await fetchConAuth(`${ENDPOINT_PRODUCTOS}?soloActivos=true`);
    if (!data.exito) {
        console.error('Rechazo del servidor:', data.mensaje);
        return [];
    }
    return data.datos || [];
}

/**
 * @param {Object} venta
 * { idMetodoPago, descuentoPorcentaje, costoEnvio, urlComprobante, listaProductos: [{ idProducto, cantidad }] }
 * El servidor ignora cualquier precio o total que mandes: los calcula él.
 */
export async function registrarVentaDB(venta) {
    const data = await fetchConAuth(ENDPOINT_VENTAS, {
        method: 'POST',
        body: JSON.stringify(venta)
    });
    return {
        exito: Boolean(data.exito),
        mensaje: data.mensaje || 'Error al procesar la venta.',
        datos: data.datos // { idVenta, idCorte, subtotal, descuento, iva, costoEnvio, total }
    };
}

// filtros: { desde, hasta (ISO), idEmpleado (solo gerencia), limite }
export async function obtenerHistorialVentas(filtros = {}) {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([clave, valor]) => {
        if (valor !== undefined && valor !== null && valor !== '') params.set(clave, valor);
    });

    const data = await fetchConAuth(`${ENDPOINT_VENTAS}/historial?${params}`);
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos || [] };
}

// Devuelve { venta, detalles }
export async function obtenerVentaPorId(idVenta) {
    const data = await fetchConAuth(`${ENDPOINT_VENTAS}/${idVenta}`);
    return { exito: Boolean(data.exito), mensaje: data.mensaje, datos: data.datos };
}

// Para el selector de vendedor del historial (solo Administrador y Gerente)
export async function obtenerEmpleadosParaFiltro() {
    const data = await fetchConAuth(ENDPOINT_EMPLEADOS);
    if (!data.exito) return [];
    return (data.datos || []).filter(e => e && e.idEmpleado);
}