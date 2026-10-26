/* ==========================================================================
   METODOSPAGOCOM.JS - LOGICA DEL COMPONENTE VISUAL PARA LOS MÉTODOS DE PAGO
   ========================================================================== */

export function renderizarMetodosPagoPOS(metodos, contenedor, onSeleccionar) {
    if (!contenedor) return;
    contenedor.innerHTML = '';

    const activos = (metodos || []).filter(m => m && m.estatusActivo);
    if (activos.length === 0) {
        contenedor.innerHTML = '<p class="alerta">No hay métodos de pago configurados.</p>';
        return;
    }

    activos.forEach(metodo => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-metodo-pago';
        boton.dataset.id = metodo.idMetodoPago;

        const icono = document.createElement('span');
        icono.className = 'metodo-icon';
        icono.textContent = metodo.esEfectivo ? '💵' : '💳';

        const nombre = document.createElement('span');
        nombre.className = 'metodo-nombre';
        nombre.textContent = metodo.metodo;

        boton.append(icono, nombre);

        if (metodo.requiereComprobante) {
            const badge = document.createElement('span');
            badge.className = 'badge-comprobante';
            badge.title = 'Pedirá una foto del comprobante';
            badge.textContent = '🧾 Requiere comprobante';
            boton.append(badge);
        }

        boton.addEventListener('click', () => onSeleccionar(metodo));
        contenedor.appendChild(boton);
    });
}