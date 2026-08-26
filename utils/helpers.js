// Centralizamos tu URL de Render para usarla en toda la app
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
    
    // Usamos la constante del servidor de Render
    return `${API_URL}${rutaConSlash}`;
}

export const guardarSesion = (token, usuario) => {
    localStorage.setItem('tokenLCAW', token);
    localStorage.setItem('usuarioLCAW', JSON.stringify(usuario));
    
    // Si tu backend devuelve el rol directo en el usuario, lo guardamos
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
    // Redirigir al login
    window.location.href = '../index.html'; 
};

// ==========================================
// PETICIONES AL SERVIDOR CON TOKEN
// ==========================================

export const fetchConAuth = async (endpoint, opciones = {}) => {
    const token = obtenerToken();
    
    // Configuramos los headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...opciones.headers // Mantiene headers extra si los pasas
    };

    // Si hay un token guardado, lo adjuntamos para que el backend nos dé permiso
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
    }
};