import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarError, mostrarExito } from '../utils/alertas.js';
import { guardarSesion } from '../utils/helpers.js';
import { esUsuarioValido, esPasswordValida } from '../utils/validaciones.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');
    const inputUsuario = document.getElementById('usuario');
    const formularioLogin = document.getElementById('formularioLogin');

    // Alternar visibilidad de la contraseña
    if (btnVerPassword && inputPassword) {
        btnVerPassword.addEventListener('click', () => {
            const esPassword = inputPassword.type === 'password';
            inputPassword.type = esPassword ? 'text' : 'password';
            btnVerPassword.textContent = esPassword ? '🙈' : '👁️';
        });
    }

    // Manejo del formulario de inicio de sesión
    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nombreUsuario = inputUsuario.value.trim();
            const contrasena = inputPassword.value;

            // Validaciones locales de formato
            const checkUsuario = esUsuarioValido(nombreUsuario);
            if (!checkUsuario.valido) return mostrarError(checkUsuario.mensaje);

            const checkPassword = esPasswordValida(contrasena);
            if (!checkPassword.valido) return mostrarError(checkPassword.mensaje);

            // Envío de credenciales a la API
            const respuestaApi = await usuariosAPI.login(nombreUsuario, contrasena);

            console.log('Respuesta recibida del backend:', respuestaApi);

            if (respuestaApi.exito) {
                guardarSesion(respuestaApi.token, respuestaApi.usuario);

                const contenedorFormulario = document.getElementById('contenedorFormulario');
                const pantallaCarga = document.getElementById('pantallaCarga');

                if (contenedorFormulario) contenedorFormulario.classList.add('oculto');
                if (pantallaCarga) pantallaCarga.classList.remove('oculto');

                mostrarExito(respuestaApi.mensaje || "¡Bienvenido!");

                setTimeout(() => {
                    window.location.href = './menu.html';
                }, 1500);
            } else {
                console.error('Error en autenticación:', respuestaApi.mensaje);
                mostrarError(respuestaApi.mensaje || "Credenciales inválidas.");
            }
        });
    }
});