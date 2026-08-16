// 1. Agregamos el nuevo import de nuestra API
import { iniciarSesion } from '../api/authAPI.js';
import { mostrarAlerta } from '../utils/alertas.js';
import { esUsuarioValido, esPasswordValida } from '../utils/validaciones.js';

document.addEventListener('DOMContentLoaded', () => {

    const btnVerPassword = document.getElementById('btnVerPassword');
    const inputPassword = document.getElementById('password');

    btnVerPassword.addEventListener('click', () => {
        if (inputPassword.type === 'password') {
            inputPassword.type = 'text';
            btnVerPassword.textContent = '🙈';
        } else {
            inputPassword.type = 'password';
            btnVerPassword.textContent = '👁️';
        }
    });

    const formularioLogin = document.getElementById('formularioLogin');

    formularioLogin.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const usuarioInput = document.getElementById('usuario').value.trim();
        const passwordValor = inputPassword.value;

        // Validaciones locales
        const checkUsuario = esUsuarioValido(usuarioInput);
        if (!checkUsuario.valido) return mostrarAlerta(checkUsuario.mensaje);

        const checkPassword = esPasswordValida(passwordValor);
        if (!checkPassword.valido) return mostrarAlerta(checkPassword.mensaje);

        // ==========================================
        // NUEVA LLAMADA A LA API (¡Súper limpio!)
        // ==========================================
        const respuestaApi = await iniciarSesion(usuarioInput, passwordValor);

        if (respuestaApi.exito) {
            // Todo salió bien, guardamos datos y entramos
            localStorage.setItem('usuarioLCAW', JSON.stringify(respuestaApi.datos.usuario));
            localStorage.setItem('rolLCAW', respuestaApi.datos.rol);

            document.getElementById('contenedorFormulario').classList.add('oculto');
            document.getElementById('pantallaCarga').classList.remove('oculto');

            setTimeout(() => {
                window.location.href = './menu.html'; 
            }, 2000);
        } else {
            // Hubo un error (contraseña incorrecta, servidor caído, etc.)
            mostrarAlerta(respuestaApi.datos.mensaje);
        }
    });
});