import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/marcas';

export async function obtenerMarcasAPI() {
    const res = await fetchConAuth(ENDPOINT);
    return res.exito ? (res.datos || []) : (Array.isArray(res) ? res : []);
}