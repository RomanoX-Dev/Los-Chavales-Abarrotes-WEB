import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarExito, mostrarError } from '../utils/alertas.js';
import { guardarSesion, cerrarSesion } from '../utils/helpers.js';

export const usuariosCOM = {
    
    procesarLogin: async (nombreUsuario, contrasena) => {
        // Tu controlador espera "nombreUsuario" y "contrasena"
        const resultado = await usuariosAPI.login(nombreUsuario, contrasena);

        if (resultado.exito) {
            // Guardamos el token y los datos devueltos por el backend
            guardarSesion(resultado.token, resultado.usuario);
            mostrarExito(resultado.mensaje);
            // Redirigir al panel principal
            window.location.href = '../pages/menu.html'; 
        } else {
            mostrarError(resultado.mensaje);
        }
    },

    procesarLogout: async () => {
        await usuariosAPI.logout();
        cerrarSesion();
    },

    cargarListaUsuarios: async () => {
        const resultado = await usuariosAPI.obtenerTodos();
        if (resultado.exito) {
            return resultado.datos;
        } else {
            mostrarError(resultado.mensaje);
            return [];
        }
    }
};