import { fetchConAuth } from '../utils/helpers.js';

const BASE_URL = '/api/usuarios';

export const usuariosAPI = {
    // POST: /api/usuarios/login
    login: async (nombreUsuario, contrasena) => {
        return await fetchConAuth(`${BASE_URL}/login`, {
            method: 'POST',
            body: JSON.stringify({ nombreUsuario, contrasena })
        });
    },

    logout: async () => await fetchConAuth(`${BASE_URL}/logout`, { method: 'POST' }),

    obtenerTodos: async () => await fetchConAuth(BASE_URL),

    crear: async (datosUsuario) => {
        return await fetchConAuth(BASE_URL, {
            method: 'POST',
            body: JSON.stringify(datosUsuario)
        });
    },

    cambiarEstatus: async (id, estatusActivo) => {
        return await fetchConAuth(`${BASE_URL}/${id}/estatus`, {
            method: 'PATCH',
            body: JSON.stringify({ estatusActivo })
        });
    }
};