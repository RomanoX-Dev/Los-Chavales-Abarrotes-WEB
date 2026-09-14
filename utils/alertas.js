/* ==========================================================================
   ALERTAS.JS - GESTIÓN EFICIENTE DE NOTIFICACIONES Y MODALES
   ========================================================================== */

let timerAlerta = null;
let promesaCarga = null;

/**
 * Carga asíncrona única del HTML de alertas previniendo condiciones de carrera
 */
const asegurarComponenteAlerta = () => {
    if (document.getElementById('alertaCustom')) return Promise.resolve();

    if (!promesaCarga) {
        promesaCarga = fetch('../cards/Tarjetaeliminacion.html')
            .then((respuesta) => {
                if (!respuesta.ok) throw new Error(`Status: ${respuesta.status}`);
                return respuesta.text();
            })
            .then((html) => {
                document.body.insertAdjacentHTML('beforeend', html);
            })
            .catch((error) => {
                promesaCarga = null; // Permite reintentar si falló la red
                console.error('Error al cargar la tarjeta de alerta:', error);
            });
    }
    return promesaCarga;
};

/**
 * Muestra notificaciones estilo Toast
 */
const mostrarAlertaPersonalizada = async (mensaje, tipo) => {
    await asegurarComponenteAlerta();

    const contenedor = document.getElementById('alertaCustom');
    const spanMensaje = document.getElementById('alertaMensaje');
    const acciones = document.getElementById('alertaAcciones');
    const backdrop = document.getElementById('alertaBackdrop');

    if (!contenedor || !spanMensaje) {
        alert(mensaje);
        return;
    }

    clearTimeout(timerAlerta);

    // Ocultar modal/backdrop previa
    if (acciones) acciones.classList.add('oculto');
    if (backdrop) backdrop.classList.remove('activo');

    // Reinicio de clase base manteniendo la estructura
    contenedor.className = 'alerta-card';

    const configuraciones = {
        exito: { clase: 'alerta-exito', icono: '✅', duracion: 4500 },
        advertencia: { clase: 'alerta-advertencia', icono: '⚠️', duracion: 5500 },
        error: { clase: 'alerta-error', icono: '❌', duracion: 6500 }
    };

    const config = configuraciones[tipo] || configuraciones.exito;

    contenedor.classList.add(config.clase);
    spanMensaje.textContent = `${config.icono} ${mensaje}`;

    // Forzar reflow para reiniciar la animación CSS limpiamente
    void contenedor.offsetWidth;
    contenedor.classList.remove('alerta-oculta');
    contenedor.classList.add('alerta-visible');

    timerAlerta = setTimeout(() => {
        contenedor.classList.remove('alerta-visible');
        contenedor.classList.add('alerta-oculta');
    }, config.duracion);
};

/**
 * Muestra un modal de confirmación asíncrono basado en Promesas
 */
export const mostrarConfirmacion = async (mensaje) => {
    await asegurarComponenteAlerta();

    return new Promise((resolve) => {
        const contenedor = document.getElementById('alertaCustom');
        const spanMensaje = document.getElementById('alertaMensaje');
        const acciones = document.getElementById('alertaAcciones');
        const backdrop = document.getElementById('alertaBackdrop');

        if (!contenedor || !spanMensaje) {
            resolve(confirm(mensaje));
            return;
        }

        clearTimeout(timerAlerta);

        // Clases base para modal centrado
        contenedor.className = 'alerta-card alerta-confirmacion alerta-peligro-critico';
        spanMensaje.textContent = `🚨 ${mensaje}`;

        if (acciones) acciones.classList.remove('oculto');
        if (backdrop) backdrop.classList.add('activo');

        void contenedor.offsetWidth;
        contenedor.classList.remove('alerta-oculta');
        contenedor.classList.add('alerta-visible');

        const btnConfirmar = document.getElementById('btnAlertaConfirmar');
        const btnCancelar = document.getElementById('btnAlertaCancelar');

        const cerrarModal = (resultado) => {
            contenedor.classList.remove('alerta-visible');
            contenedor.classList.add('alerta-oculta');
            if (backdrop) backdrop.classList.remove('activo');

            setTimeout(() => {
                contenedor.className = 'alerta-card alerta-oculta';
                if (acciones) acciones.classList.add('oculto');
            }, 300);

            // Limpieza estricta de eventos
            btnConfirmar?.removeEventListener('click', onConfirmar);
            btnCancelar?.removeEventListener('click', onCancelar);
            backdrop?.removeEventListener('click', onCancelar);
            resolve(resultado);
        };

        const onConfirmar = () => cerrarModal(true);
        const onCancelar = () => cerrarModal(false);

        btnConfirmar?.addEventListener('click', onConfirmar);
        btnCancelar?.addEventListener('click', onCancelar);
        backdrop?.addEventListener('click', onCancelar);
    });
};

export const mostrarExito = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'exito');
export const mostrarError = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'error');
export const mostrarAdvertencia = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'advertencia');