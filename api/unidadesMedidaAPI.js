import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/unidades-medida'; 

export async function obtenerUnidadesAPI() {
    const data = await fetchConAuth(ENDPOINT);
    
    // Si fetchConAuth captura un error de red, devuelve un objeto con exito: false
    if (data && data.exito === false) {
        console.error('Error en obtenerUnidadesAPI:', data.mensaje);
        return [];
    }
    
    // Retorna el arreglo directamente o dentro de 'datos', según tu backend
    return Array.isArray(data) ? data : (data.datos || []);
}

export async function obtenerUnidadPorIdAPI(id) {
    const data = await fetchConAuth(`${ENDPOINT}/${id}`);
    if (data && data.exito === false) return null;
    return data;
}

export async function crearUnidadAPI(datosUnidad) {
   
    return await fetchConAuth(ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(datosUnidad)
    });
}

export async function actualizarUnidadAPI(id, datosUnidad) {
    return await fetchConAuth(`${ENDPOINT}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(datosUnidad)
    });
}

export async function eliminarUnidadDefinitivaAPI(id) {
    return await fetchConAuth(`${ENDPOINT}/${id}`, {
        method: 'DELETE'
    });
}