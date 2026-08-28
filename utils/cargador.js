
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