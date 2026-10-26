/* ==========================================================================
   CARGADOR.JS - OVERLAY DE CARGA
   ========================================================================== */
   
if (!document.getElementById('css-cargador')) {
    const link = document.createElement('link');
    link.id = 'css-cargador';
    link.rel = 'stylesheet';
    link.href = new URL('../styles/cargador.css', import.meta.url).href;
    document.head.appendChild(link);
}

let temporizadorCargador = null;
let peticionesActivas = 0;

function obtenerOverlay(texto) {
    let loader = document.getElementById('global-loader');

    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'global-loader';
        loader.className = 'loader-overlay';

        const contenido = document.createElement('div');
        contenido.className = 'loader-contenido';

        const spinner = document.createElement('div');
        spinner.className = 'spinner';

        const parrafo = document.createElement('p');
        parrafo.id = 'loader-texto';

        contenido.append(spinner, parrafo);
        loader.appendChild(contenido);
        document.body.appendChild(loader);
    }

    loader.querySelector('#loader-texto').textContent = texto;
    return loader;
}

export const mostrarCargador = (texto = 'Cargando...', retardoMs = 300) => {
    peticionesActivas++;

    // Si ya hay un overlay visible o un temporizador pendiente, no se reinicia
    const loader = document.getElementById('global-loader');
    const visible = loader && !loader.classList.contains('oculto');
    if (visible || temporizadorCargador) return;

    temporizadorCargador = setTimeout(() => {
        temporizadorCargador = null;
        obtenerOverlay(texto).classList.remove('oculto');
    }, retardoMs);
};

export const ocultarCargador = () => {
    peticionesActivas = Math.max(0, peticionesActivas - 1);
    if (peticionesActivas > 0) return; // todavía hay peticiones en curso

    reiniciarCargador();
};

// Apaga todo sin importar el contador (lo usa pageshow)
export function reiniciarCargador() {
    peticionesActivas = 0;

    if (temporizadorCargador) {
        clearTimeout(temporizadorCargador);
        temporizadorCargador = null;
    }

    const loader = document.getElementById('global-loader');
    if (loader) loader.classList.add('oculto');
}

export function inicializarEventosNavegacion() {
    // Al salir o recargar la página: respuesta inmediata
    window.addEventListener('beforeunload', () => {
        mostrarCargador('Cargando...', 0);
    });

    // Si el navegador restaura la página desde caché (botón Atrás), limpia el overlay
    window.addEventListener('pageshow', (e) => {
        if (e.persisted) reiniciarCargador();
    });
}

inicializarEventosNavegacion();