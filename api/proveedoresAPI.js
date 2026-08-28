import { fetchConAuth } from '../utils/helpers.js';

const ENDPOINT = '/api/proveedores';

export async function obtenerProveedoresAPI() {
    const res = await fetchConAuth(ENDPOINT);
    return res.exito ? (res.datos || []) : (Array.isArray(res) ? res : []);
}