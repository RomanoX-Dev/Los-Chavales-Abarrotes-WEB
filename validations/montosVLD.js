/* ==========================================================================
   MONTOSVLD.JS - VALIDACIÓN DE MONTOS CAPTURADOS (CAJA, DESCUENTO, ENVÍO)
   Todas devuelven { valido, valor, mensaje }.
   ========================================================================== */

const vacio = (v) => v === '' || v === null || v === undefined;
const redondear = (n) => Math.round(n * 100) / 100;

export function validarMontoCaja(valor, etiqueta = 'El monto') {
    if (vacio(valor)) return { valido: false, mensaje: `${etiqueta} es obligatorio.` };

    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
        return { valido: false, mensaje: `${etiqueta} debe ser un número mayor o igual a 0.` };
    }
    if (n > 1000000) return { valido: false, mensaje: `${etiqueta} es demasiado grande.` };

    return { valido: true, valor: redondear(n) };
}

// Vacío = sin descuento
export function validarDescuento(valor, max) {
    if (vacio(valor)) return { valido: true, valor: 0 };

    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
        return { valido: false, mensaje: 'El descuento debe ser un número mayor o igual a 0.' };
    }
    if (n > max) {
        return { valido: false, mensaje: `Tu rol permite un descuento máximo de ${max}%.` };
    }
    return { valido: true, valor: n };
}

// Vacío = sin envío
export function validarEnvio(valor, max) {
    if (vacio(valor)) return { valido: true, valor: 0 };

    const n = Number(valor);
    if (!Number.isFinite(n) || n < 0) {
        return { valido: false, mensaje: 'El envío debe ser un número mayor o igual a 0.' };
    }
    if (n > max) {
        return { valido: false, mensaje: `El envío no puede pasar de $${max}.` };
    }
    return { valido: true, valor: redondear(n) };
}