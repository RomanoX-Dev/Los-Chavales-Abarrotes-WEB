// Ruta: utils/helpers.js

export const IMGBB_API_KEY = 'c42145a4b70213cc343bc5bf54e8035c';
export const IMAGEN_DEFAULT = '../assets/Prodefault.png';

export function resolverUrlImagen(imagenBD) {
    if (!imagenBD || typeof imagenBD !== 'string') return IMAGEN_DEFAULT;

    const imgLimpia = imagenBD.trim();
    if (imgLimpia === '' || imgLimpia === 'null' || imgLimpia === 'undefined' || imgLimpia.includes('Prodefault')) {
        return IMAGEN_DEFAULT;
    }

    if (imgLimpia.startsWith('http://') || imgLimpia.startsWith('https://') || imgLimpia.startsWith('data:image/')) {
        return imgLimpia;
    }

    const rutaConSlash = imgLimpia.startsWith('/') ? imgLimpia : `/${imgLimpia}`;
    return `https://lcaw-server.onrender.com${rutaConSlash}`;
}