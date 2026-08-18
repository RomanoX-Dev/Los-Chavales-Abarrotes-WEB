// utils/alertas.js
let temporizadorAlerta = null;

export function mostrarAlerta(mensaje) {
    const alerta = document.getElementById('alertaCustom');
    const alertaMensaje = document.getElementById('alertaMensaje');
    
    if (!alerta || !alertaMensaje) return; 

    alertaMensaje.textContent = mensaje;
    alerta.classList.remove('alerta-oculta');
    alerta.classList.add('alerta-visible');

    if (temporizadorAlerta) {
        clearTimeout(temporizadorAlerta);
    }

    temporizadorAlerta = setTimeout(() => {
        alerta.classList.remove('alerta-visible');
        alerta.classList.add('alerta-oculta');
    }, 3500);
}