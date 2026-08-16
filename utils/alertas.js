// La palabra "export" hace que esta función pueda ser llamada desde otros archivos
export function mostrarAlerta(mensaje) {
    const alerta = document.getElementById('alertaCustom');
    const alertaMensaje = document.getElementById('alertaMensaje');
    
    // Si no existe el contenedor de la alerta en el HTML, detenemos la función para evitar errores
    if (!alerta || !alertaMensaje) return; 

    alertaMensaje.textContent = mensaje;
    alerta.classList.remove('alerta-oculta');
    alerta.classList.add('alerta-visible');

    setTimeout(() => {
        alerta.classList.remove('alerta-visible');
        alerta.classList.add('alerta-oculta');
    }, 3500);
}