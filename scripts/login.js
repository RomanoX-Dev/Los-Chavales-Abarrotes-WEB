// 1. Agregamos los imports actualizados de nuestra API y helpers
import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarError, mostrarExito } from '../utils/alertas.js';
import { guardarSesion } from '../utils/helpers.js';
import { esUsuarioValido, esPasswordValida } from '../utils/validaciones.js';

document.addEventListener('DOMContentLoaded', () => {

    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');
    const inputUsuario = document.getElementById('usuario');
    const formularioLogin = document.getElementById('formularioLogin');

    btnVerPassword.addEventListener('click', () => {
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnVerPassword.textContent = '🙈';
        } else {
            inputPassword.type = 'password';
            btnVerPassword.textContent = '👁️';
        }
    });

    formularioLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        // Alineamos las variables a nombreUsuario y contrasena como en la BD
        const nombreUsuario = inputUsuario.value.trim();
        const contrasena = inputPassword.value;

        // Validaciones locales
        const checkUsuario = esUsuarioValido(nombreUsuario);
        if (!checkUsuario.valido) return mostrarError(checkUsuario.mensaje);

        const checkPassword = esPasswordValida(contrasena);
        if (!checkPassword.valido) return mostrarError(checkPassword.mensaje);

        // ==========================================
        // LLAMADA A LA API (Con los nombres exactos)
        // ==========================================
        const respuestaApi = await usuariosAPI.login(nombreUsuario, contrasena);

        if (respuestaApi.exito) {
            // Guardamos el token y los datos usando nuestra función centralizada
            guardarSesion(respuestaApi.token, respuestaApi.usuario);

            // Transición visual
            document.getElementById('contenedorFormulario').classList.add('oculto');
            document.getElementById('pantallaCarga').classList.remove('oculto');
            
            // (Opcional) Podemos mostrar un mensaje de éxito rápido
            mostrarExito(respuestaApi.mensaje || "¡Bienvenido!");

            setTimeout(() => {
                window.location.href = './menu.html'; 
            }, 2000);
        } else {
            // Hubo un error devuelto por el backend
            mostrarError(respuestaApi.mensaje);
        }
    });
});