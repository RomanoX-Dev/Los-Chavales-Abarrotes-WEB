// Función principal que controla el DOM para mostrar la alerta
const mostrarAlertaPersonalizada = (mensaje, tipo) => {
    const contenedor = document.getElementById('alertaCustom');
    const spanMensaje = document.getElementById('alertaMensaje');

    // Si por alguna razón no encuentra el HTML (ej. en otra página que no lo tenga), usa el alert clásico como respaldo
    if (!contenedor || !spanMensaje) {
        alert(mensaje);
        return;
    }

    // 1. Limpiamos las clases que pudiera tener de una alerta anterior
    contenedor.classList.remove('alerta-error', 'alerta-exito', 'alerta-advertencia', 'alerta-oculta');

    // 2. Asignamos el icono y el color según el tipo de mensaje
    if (tipo === 'exito') {
        contenedor.classList.add('alerta-exito');
        spanMensaje.textContent = `✅ ${mensaje}`;
    } else if (tipo === 'error') {
        contenedor.classList.add('alerta-error');
        spanMensaje.textContent = `❌ ${mensaje}`;
    } else if (tipo === 'advertencia') {
        contenedor.classList.add('alerta-advertencia');
        spanMensaje.textContent = `⚠️ ${mensaje}`;
    }

    // 3. Hacemos visible la alerta (la animación de CSS hace el resto)
    contenedor.classList.add('alerta-visible');

    // 4. La ocultamos automáticamente después de 3.5 segundos
    setTimeout(() => {
        contenedor.classList.remove('alerta-visible');
        contenedor.classList.add('alerta-oculta');
    }, 3500);
};

export const mostrarExito = (mensaje) => {
    mostrarAlertaPersonalizada(mensaje, 'exito');
};

export const mostrarError = (mensaje) => {
    mostrarAlertaPersonalizada(mensaje, 'error');
};

export const mostrarAdvertencia = (mensaje) => {
    mostrarAlertaPersonalizada(mensaje, 'advertencia');
};