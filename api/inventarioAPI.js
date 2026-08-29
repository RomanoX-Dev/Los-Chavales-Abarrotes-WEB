import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/productos';

export async function obtenerProductos() {
    const res = await fetchConAuth(ENDPOINT);
    return res.exito ? (res.datos || []) : [];
}

export async function crearProducto(datos) {
    const res = await fetchConAuth(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(datos)
    });
    return {
        exito: res.exito,
        mensaje: res.mensaje || (res.exito ? 'Producto creado correctamente.' : 'Error al crear producto.')
    };
}

export async function actualizarProducto(id, datos) {
    const res = await fetchConAuth(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datos)
    });
    return {
        exito: res.exito,
        mensaje: res.mensaje || (res.exito ? 'Producto actualizado correctamente.' : 'Error al actualizar producto.')
    };
}

export async function eliminarProductoDefinitivoAPI(id) {
    const res = await fetchConAuth(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
    return {
        exito: res.exito,
        mensaje: res.mensaje || (res.exito ? 'Producto eliminado definitivamente.' : 'Error al eliminar.')
    };
}