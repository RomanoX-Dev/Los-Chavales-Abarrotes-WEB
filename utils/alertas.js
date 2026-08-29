let timerAlerta = null;

const asegurarComponenteAlerta = async () => {
    if (document.getElementById('alertaCustom')) return;

    try {
        const respuesta = await fetch('/LCAWFrontend/cards/Tarjetaeliminacion.html');
        
        if (!respuesta.ok) throw new Error('No se pudo cargar el componente de alerta');
        
        const html = await respuesta.text();
        document.body.insertAdjacentHTML('beforeend', html);
    } catch (error) {
        console.error('Error al cargar la tarjeta de alerta:', error);
    }
};

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
    if (acciones) acciones.classList.add('oculto');
    if (backdrop) backdrop.classList.remove('activo');
    contenedor.className = '';

    let duracion = 5000;

    if (tipo === 'exito') {
        contenedor.classList.add('alerta-exito');
        spanMensaje.textContent = `✅ ${mensaje}`;
        duracion = 5000;
    } else if (tipo === 'advertencia') {
        contenedor.classList.add('alerta-advertencia');
        spanMensaje.textContent = `⚠️ ${mensaje}`;
        duracion = 6000;
    } else if (tipo === 'error') {
        contenedor.classList.add('alerta-error');
        spanMensaje.textContent = `❌ ${mensaje}`;
        duracion = 7000;
    }

    contenedor.classList.add('alerta-visible');

    timerAlerta = setTimeout(() => {
        contenedor.classList.remove('alerta-visible');
        contenedor.classList.add('alerta-oculta');
    }, duracion);
};

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
        contenedor.className = '';

        // Estilos para modal destructivo centrado con overlay
        contenedor.classList.add('alerta-peligro-critico', 'alerta-confirmacion');
        spanMensaje.textContent = `🚨 ${mensaje}`;
        
        if (acciones) acciones.classList.remove('oculto');
        if (backdrop) backdrop.classList.add('activo');
        contenedor.classList.add('alerta-visible');

        const btnConfirmar = document.getElementById('btnAlertaConfirmar');
        const btnCancelar = document.getElementById('btnAlertaCancelar');

        const cerrarModal = (resultado) => {
            contenedor.classList.remove('alerta-visible');
            contenedor.classList.add('alerta-oculta');
            if (backdrop) backdrop.classList.remove('activo');

            setTimeout(() => {
                contenedor.classList.remove('alerta-confirmacion', 'alerta-peligro-critico');
                if (acciones) acciones.classList.add('oculto');
            }, 300);

            btnConfirmar?.removeEventListener('click', onConfirmar);
            btnCancelar?.removeEventListener('click', onCancelar);
            resolve(resultado);
        };

        const onConfirmar = () => cerrarModal(true);
        const onCancelar = () => cerrarModal(false);

        btnConfirmar?.addEventListener('click', onConfirmar);
        btnCancelar?.addEventListener('click', onCancelar);
    });
};

export const mostrarExito = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'exito');
export const mostrarError = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'error');
export const mostrarAdvertencia = (mensaje) => mostrarAlertaPersonalizada(mensaje, 'advertencia');