import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarError, mostrarExito } from '../utils/alertas.js';
import { guardarSesion } from '../utils/helpers.js';
import { esUsuarioValido, esPasswordValida } from '../utils/validaciones.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');
    const inputUsuario = document.getElementById('usuario');
    const formularioLogin = document.getElementById('formularioLogin');

    if (btnVerPassword && inputPassword) {
        btnVerPassword.addEventListener('click', () => {
            const esPassword = inputPassword.type === 'password';
            inputPassword.type = esPassword ? 'text' : 'password';
            btnVerPassword.textContent = esPassword ? '🙈' : '👁️';
        });
    }

    if (formularioLogin) {
        formularioLogin.addEventListener('submit', async (evento) => {
            evento.preventDefault();

            const nombreUsuario = inputUsuario.value.trim();
            const contrasena = inputPassword.value;

            const checkUsuario = esUsuarioValido(nombreUsuario);
            if (!checkUsuario.valido) return mostrarError(checkUsuario.mensaje);

            const checkPassword = esPasswordValida(contrasena);
            if (!checkPassword.valido) return mostrarError(checkPassword.mensaje);

            // fetchConAuth dentro de usuariosAPI.login activa el cargador automáticamente
            const respuestaApi = await usuariosAPI.login(nombreUsuario, contrasena);

            if (respuestaApi.exito) {
                guardarSesion(respuestaApi.token, respuestaApi.usuario);
                mostrarExito(respuestaApi.mensaje || "¡Bienvenido!");

                setTimeout(() => {
                    window.location.href = './menu.html';
                }, 1000);
            } else {
                mostrarError(respuestaApi.mensaje || "Credenciales inválidas.");
            }
        });
    }
});