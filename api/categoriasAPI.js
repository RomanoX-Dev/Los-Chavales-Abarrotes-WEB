import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/categorias';

export async function obtenerCategoriasAPI() {
    const res = await fetchConAuth(ENDPOINT);
    // Extrae el arreglo si viene dentro de "datos", o lo devuelve directo si ya es un arreglo
    return res.exito ? (res.datos || []) : (Array.isArray(res) ? res : []);
}