import { mostrarCargador, ocultarCargador } from './cargador.js';

//'http://localhost:3000'
export const API_URL = 'https://lcaw-server.onrender.com';
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
    return `${API_URL}${rutaConSlash}`;
}

export const guardarSesion = (token, usuario) => {
    localStorage.setItem('tokenLCAW', token);
    localStorage.setItem('usuarioLCAW', JSON.stringify(usuario));
    
    if (usuario.nombreRol || usuario.rol) {
        localStorage.setItem('rolLCAW', usuario.nombreRol || usuario.rol);
    }
};

export const obtenerToken = () => {
    return localStorage.getItem('tokenLCAW');
};

export const cerrarSesion = () => {
    localStorage.removeItem('tokenLCAW');
    localStorage.removeItem('usuarioLCAW');
    localStorage.removeItem('rolLCAW');
    window.location.href = '../index.html'; 
};

// Peticiones al servidor con JWT y cargador global automático
export const fetchConAuth = async (endpoint, opciones = {}) => {
    mostrarCargador();

    const token = obtenerToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...opciones.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...opciones,
        headers
    };

    try {
        const respuesta = await fetch(`${API_URL}${endpoint}`, config);
        return await respuesta.json();
    } catch (error) {
        console.error("Error en fetchConAuth:", error);
        return { exito: false, mensaje: "Error de conexión con el servidor. Intenta más tarde." };
    } finally {
        ocultarCargador();
    }
};