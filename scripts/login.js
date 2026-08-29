import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarError, mostrarExito, mostrarAdvertencia } from '../utils/alertas.js';
import { guardarSesion } from '../utils/helpers.js';
import { esUsuarioValido, esPasswordValida } from '../utils/validaciones.js';

document.addEventListener('DOMContentLoaded', () => {
    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');
    const inputUsuario = document.getElementById('usuario');
    const formularioLogin = document.getElementById('formularioLogin');
    const btnSubmit = formularioLogin ? formularioLogin.querySelector('button[type="submit"]') : null;

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

            if (!nombreUsuario || !contrasena) {
                return mostrarAdvertencia("Por favor, ingresa tu usuario y contraseña.");
            }

            const checkUsuario = esUsuarioValido(nombreUsuario);
            if (!checkUsuario.valido) return mostrarError(checkUsuario.mensaje);

            const checkPassword = esPasswordValida(contrasena);
            if (!checkPassword.valido) return mostrarError(checkPassword.mensaje);

            // Bloquear el botón temporalmente
            const textoOriginalBtn = btnSubmit.innerHTML;
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.style.cursor = 'not-allowed';
                btnSubmit.innerHTML = 'Ingresando...';
            }

            // Aquí se llama a la API. Tu fetchConAuth mostrará el spinner solo!
            const respuestaApi = await usuariosAPI.login(nombreUsuario, contrasena);

            // Restaurar el botón al terminar la petición
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.style.cursor = 'pointer';
                btnSubmit.innerHTML = textoOriginalBtn;
            }

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