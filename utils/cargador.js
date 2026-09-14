/* ==========================================================================
   CARGADOR.JS - OVERLAY DE CARGA Y EVENTOS DE VENTANA
   ========================================================================== */

if (!document.getElementById('css-cargador')) {
    const link = document.createElement('link');
    link.id = 'css-cargador';
    link.rel = 'stylesheet';
    link.href = '../styles/cargador.css'; 
    document.head.appendChild(link);
}

let temporizadorCargador = null;

export const mostrarCargador = (texto = 'Cargando...', retardoMs = 300) => {
    if (temporizadorCargador) clearTimeout(temporizadorCargador);

    temporizadorCargador = setTimeout(() => {
        let loader = document.getElementById('global-loader');

        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="loader-contenido">
                    <div class="spinner"></div>
                    <p id="loader-texto">${texto}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            const textoElem = document.getElementById('loader-texto');
            if (textoElem) textoElem.textContent = texto;
            loader.classList.remove('oculto');
        }
    }, retardoMs);
};

export const ocultarCargador = () => {
    if (temporizadorCargador) {
        clearTimeout(temporizadorCargador);
        temporizadorCargador = null;
    }

    const loader = document.getElementById('global-loader');
    if (loader) {
        loader.classList.add('oculto');
    }
};

/**
 * Escuchadores globales para recarga, cambio de pestaña y pérdida de foco.
 */
export function inicializarEventosNavegacion() {
    // 1. Recargar o navegar a otra página (Retardo en 0 para respuesta inmediata)
    window.addEventListener('beforeunload', () => {
        mostrarCargador('Cargando...', 0);
    });

    // 2. Cambiar de pestaña en el navegador
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            mostrarCargador('En pausa...', 0);
        } else {
            ocultarCargador();
        }
    });

    // 3. Perder o recuperar el foco de la ventana (ej. cambiar a otra app)
    window.addEventListener('blur', () => {
        mostrarCargador('En pausa...', 0);
    });

    window.addEventListener('focus', () => {
        ocultarCargador();
    });
}

// Auto-ejecución automática al cargar el módulo
inicializarEventosNavegacion();