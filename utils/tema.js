/* ==========================================================================
   TEMA.JS - CAMBIO DE TEMA (lcaw | oscuro | claro)
   Guarda la elección en localStorage y la aplica en <html data-theme="...">.
   ========================================================================== */

export const TEMAS = ['lcaw', 'oscuro', 'claro'];
const CLAVE = 'temaLCAW';
const NOMBRES = { lcaw: 'LCAW', oscuro: 'Oscuro', claro: 'Claro' };

export const obtenerTema = () => {
    const guardado = localStorage.getItem(CLAVE);
    return TEMAS.includes(guardado) ? guardado : 'lcaw';
};

export const aplicarTema = (tema) => {
    const valido = TEMAS.includes(tema) ? tema : 'lcaw';
    document.documentElement.dataset.theme = valido;
    localStorage.setItem(CLAVE, valido);
    return valido;
};

// Pasa al siguiente tema de la lista y devuelve el nuevo
export const ciclarTema = () => {
    const actual = obtenerTema();
    const siguiente = TEMAS[(TEMAS.indexOf(actual) + 1) % TEMAS.length];
    return aplicarTema(siguiente);
};

export const nombreTema = (tema = obtenerTema()) => NOMBRES[tema] || NOMBRES.lcaw;