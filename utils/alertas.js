/* ==========================================================================
   ALERTAS.JS - GESTIÓN EFICIENTE DE NOTIFICACIONES Y MODALES
   ========================================================================== */

let timerAlerta = null;
const promesasCarga = new Map();

/**
 * Carga de forma asíncrona y única cualquier componente HTML evitando condiciones de carrera
 */
const asegurarComponente = (idElemento, ruta) => {
    // Si el elemento ya existe en el DOM, no hace nada
    if (document.getElementById(idElemento)) return Promise.resolve();

    // Si no existe una petición en curso para este ID, se inicia una nueva
    if (!promesasCarga.has(idElemento)) {
        const promesa = fetch(ruta)
            .then((respuesta) => {
                if (!respuesta.ok) throw new Error(`Status: ${respuesta.status}`);
                return respuesta.text();
            })
            .then((html) => {
                document.body.insertAdjacentHTML('beforeend', html);
            })
            .catch((error) => {
                promesasCarga.delete(idElemento); // Permite reintentar si falló la red
                console.error(`Error al cargar el componente (${ruta}):`, error);
            });

        promesasCarga.set(idElemento, promesa);
    }

    return promesasCarga.get(idElemento);
};

// Definición de recursos por tarjeta
const asegurarTarjetaEliminacion = () => 
    asegurarComponente('alertaCustom', '../cards/Tarjetaeliminacion.html');

const asegurarTarjetaConfirmacion = () => 
    asegurarComponente('alertaConfirmacion', '../cards/Tarjetaconfimacion.html');

/**
 * Muestra notificaciones estilo Toast
 */
const mostrarAlertaPersonalizada = async (mensaje, tipo) => {
    await asegurarTarjetaEliminacion();
    
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
    await asegurarTarjetaConfirmacion();

    return new Promise((resolve) => {
        // Busca primero en el ID específico de la tarjeta de confirmación
        const contenedor = document.getElementById('alertaConfirmacion') || document.getElementById('alertaCustom');
        const spanMensaje = document.getElementById('alertaConfirmacionMensaje') || document.getElementById('alertaMensaje');
        const acciones = document.getElementById('alertaConfirmacionAcciones') || document.getElementById('alertaAcciones');
        const backdrop = document.getElementById('alertaConfirmacionBackdrop') || document.getElementById('alertaBackdrop');

        if (!contenedor || !spanMensaje) {
            resolve(confirm(mensaje));
            return;
        }

        clearTimeout(timerAlerta);

        // Clases base para modal centrado
        contenedor.className = 'alerta-card alerta-confirmacion';
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