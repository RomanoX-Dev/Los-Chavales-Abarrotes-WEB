import { API_URL, fetchConAuth } from '../utils/helpers.js';

export const usuariosAPI = {
    // POST: /api/usuarios/login
    login: async (nombreUsuario, contrasena) => {
        try {
            const respuesta = await fetch(`${API_URL}/api/usuarios/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    usuario: nombreUsuario, 
                    password: contrasena
                })
            });
            return await respuesta.json();
        } catch (error) {
            return { exito: false, mensaje: "Error de conexión con el servidor." };
        }
    },

    // POST: /api/usuarios/logout
    logout: async () => await fetchConAuth('/api/usuarios/logout', { method: 'POST' }),

    // GET: /api/usuarios
    obtenerTodos: async () => await fetchConAuth('/api/usuarios'),

    // POST: /api/usuarios (Requiere idEmpleado, idRol, nombreUsuario, contrasena)
    crear: async (datosUsuario) => {
        return await fetchConAuth('/api/usuarios', {
            method: 'POST',
            body: JSON.stringify(datosUsuario)
        });
    },

    // PATCH: /api/usuarios/:id/estatus
    cambiarEstatus: async (id, estatusActivo) => {
        return await fetchConAuth(`/api/usuarios/${id}/estatus`, {
            method: 'PATCH',
            body: JSON.stringify({ estatusActivo })
        });
    }
};