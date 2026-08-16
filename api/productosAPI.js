const BASE_URL = 'https://lcaw-server.onrender.com/api/productos';

// 1. Obtener todos los productos
export async function obtenerProductos() {
    try {
        const respuesta = await fetch(BASE_URL);
        if (!respuesta.ok) throw new Error('Error al cargar la tabla');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        return []; // Retorna un arreglo vacío si falla
    }
}

// 2. Guardar un producto nuevo (POST)
export async function crearProducto(datos) {
    try {
        const respuesta = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        return { exito: respuesta.ok, mensaje: data.mensaje || 'Producto creado' };
    } catch (error) {
        return { exito: false, mensaje: 'Error de conexión al servidor' };
    }
}

// 3. Actualizar un producto (PUT)
export async function actualizarProducto(id, datos) {
    try {
        const respuesta = await fetch(`${BASE_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        return { exito: respuesta.ok, mensaje: data.mensaje || 'Producto actualizado' };
    } catch (error) {
        return { exito: false, mensaje: 'Error de conexión al servidor' };
    }
}

// 4. Dar de baja un producto (PUT)
export async function borrarProducto(id) {
    try {
        const respuesta = await fetch(`${BASE_URL}/${id}/baja`, { method: 'PUT' });
        return { exito: respuesta.ok };
    } catch (error) {
        return { exito: false };
    }
}