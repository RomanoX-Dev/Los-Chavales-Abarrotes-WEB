import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/metodos-pago';

// 1. Obtener todos los métodos de pago
export async function obtenerMetodosPago() {
    try {
        const data = await fetchConAuth(ENDPOINT);
        if (!data || !data.exito) throw new Error('Error al cargar los métodos de pago');
        return data.datos || []; 
    } catch (error) {
        console.error('Error obteniendo métodos de pago:', error);
        return [];
    }
}

// 2. Obtener un método de pago por ID
export async function obtenerMetodoPagoPorId(id) {
    try {
        const data = await fetchConAuth(`${ENDPOINT}/${id}`);
        if (!data || !data.exito) throw new Error(data.mensaje || 'Error al cargar el método de pago');
        return { exito: true, datos: data.datos };
    } catch (error) {
        console.error(`Error obteniendo el método de pago con ID ${id}:`, error);
        return { exito: false, mensaje: 'Error al conectar con el servidor.' };
    }
}

// 3. Crear un nuevo método de pago
export async function crearMetodoPago(datosMetodo) {
    try {
        const data = await fetchConAuth(ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(datosMetodo)
        });
        return { 
            exito: data.exito, 
            mensaje: data.mensaje || 'Método de pago procesado',
            datos: data.idMetodoPago 
        };
    } catch (error) {
        console.error('Error creando método de pago:', error);
        return { exito: false, mensaje: 'Error de conexión al crear el método de pago.' };
    }
}

// 4. Actualizar un método de pago existente
export async function actualizarMetodoPago(id, datosMetodo) {
    try {
        const data = await fetchConAuth(`${ENDPOINT}/${id}`, {
            method: 'PUT',
            body: JSON.stringify(datosMetodo)
        });
        return { 
            exito: data.exito, 
            mensaje: data.mensaje || 'Método de pago procesado' 
        };
    } catch (error) {
        console.error(`Error actualizando método de pago con ID ${id}:`, error);
        return { exito: false, mensaje: 'Error de conexión al actualizar.' };
    }
}

// 5. Eliminar un método de pago
export async function eliminarMetodoPago(id) {
    try {
        const data = await fetchConAuth(`${ENDPOINT}/${id}`, {
            method: 'DELETE'
        });
        return { 
            exito: data.exito, 
            mensaje: data.mensaje || 'Método de pago procesado' 
        };
    } catch (error) {
        console.error(`Error eliminando método de pago con ID ${id}:`, error);
        return { exito: false, mensaje: 'Error de conexión al eliminar.' };
    }
}