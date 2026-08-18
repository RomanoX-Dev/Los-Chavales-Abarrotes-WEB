const HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://lcaw-server.onrender.com/api';

const BASE_URL = `${HOST}/productos`;

async function procesarRespuesta(respuesta) {
    try {
        return await respuesta.json();
    } catch {
        return { mensaje: 'Error en el servidor o respuesta no válida.' };
    }
}

export async function obtenerProductos() {
    try {
        const respuesta = await fetch(BASE_URL);
        if (!respuesta.ok) throw new Error('Error al cargar productos');
        return await respuesta.json();
    } catch (error) {
        console.error('Error en obtenerProductos:', error);
        return []; 
    }
}

export async function crearProducto(datos) {
    try {
        const respuesta = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await procesarRespuesta(respuesta);
        return { 
            exito: respuesta.ok, 
            mensaje: data.mensaje || (respuesta.ok ? 'Producto creado correctamente.' : 'Error al crear producto.') 
        };
    } catch (error) {
        console.error('Error en crearProducto:', error);
        return { exito: false, mensaje: 'Error de conexión con el servidor.' };
    }
}

export async function actualizarProducto(id, datos) {
    try {
        const respuesta = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(datos)
        });
        const data = await procesarRespuesta(respuesta);
        return { 
            exito: respuesta.ok, 
            mensaje: data.mensaje || (respuesta.ok ? 'Producto actualizado correctamente.' : 'Error al actualizar producto.') 
        };
    } catch (error) {
        console.error('Error en actualizarProducto:', error);
        return { exito: false, mensaje: 'Error de conexión con el servidor.' };
    }
}

export async function borrarProducto(id) {
    try {
        const respuesta = await fetch(`${BASE_URL}/${id}/baja`, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await procesarRespuesta(respuesta);
        return { 
            exito: respuesta.ok, 
            mensaje: data.mensaje || (respuesta.ok ? 'Producto dado de baja exitosamente.' : 'No se pudo dar de baja el producto.') 
        };
    } catch (error) {
        console.error('Error en borrarProducto:', error);
        return { exito: false, mensaje: 'Error de conexión con el servidor.' };
    }
}

export async function eliminarProductoDefinitivoAPI(id) {
    try {
        const respuesta = await fetch(`${BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await procesarRespuesta(respuesta);
        return { 
            exito: respuesta.ok, 
            mensaje: data.mensaje || (respuesta.ok ? 'Producto eliminado definitivamente.' : 'Error al eliminar.') 
        };
    } catch (error) {
        console.error('Error en eliminarProductoDefinitivoAPI:', error);
        return { exito: false, mensaje: 'Error de conexión con el servidor.' };
    }
}