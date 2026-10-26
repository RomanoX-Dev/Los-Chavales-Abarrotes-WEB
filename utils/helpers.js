/* ==========================================================================
   HELPERS.JS - UTILIDADES COMPARTIDAS (SESIÓN, API, FORMATOS)
   ========================================================================== */
import { mostrarCargador, ocultarCargador } from './cargador.js';

export const API_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'http://localhost:3000'
    : 'https://lcaw-server.onrender.com';

// ⚠️ ACTUALIZAR LA CLAVE DE IMAGEBB.
export const IMGBB_API_KEY = 'c42145a4b70213cc343bc5bf54e8035c';
export const IMAGEN_DEFAULT = '../assets/Prodefault.png';

// Si tu pantalla de login real es otra (por ejemplo ./login.html), cámbiala solo aquí.
export const PAGINA_LOGIN = '../index.html';

/* ---------------------------- IMÁGENES ---------------------------- */
export function resolverUrlImagen(imagenBD) {
    if (!imagenBD || typeof imagenBD !== 'string') return IMAGEN_DEFAULT;

    const imgLimpia = imagenBD.trim();
    if (!imgLimpia || imgLimpia === 'null' || imgLimpia === 'undefined' || imgLimpia.includes('Prodefault')) {
        return IMAGEN_DEFAULT;
    }

    if (/^(https?:\/\/|data:image\/)/i.test(imgLimpia)) {
        return imgLimpia;
    }

    const rutaConSlash = imgLimpia.startsWith('/') ? imgLimpia : `/${imgLimpia}`;
    return `${API_URL}${rutaConSlash}`;
}

/* ----------------------------- SESIÓN ----------------------------- */
export const guardarSesion = (token, usuario) => {
    localStorage.setItem('tokenLCAW', token);
    localStorage.setItem('usuarioLCAW', JSON.stringify(usuario));

    const rol = usuario?.nombreRol || usuario?.rol;
    if (rol) {
        localStorage.setItem('rolLCAW', rol);
    }
};

export const obtenerToken = () => localStorage.getItem('tokenLCAW');

export const obtenerUsuario = () => {
    try {
        return JSON.parse(localStorage.getItem('usuarioLCAW'));
    } catch {
        return null;
    }
};

export const obtenerRol = () => localStorage.getItem('rolLCAW') || obtenerUsuario()?.nombreRol || null;

export const tieneRol = (...roles) => roles.includes(obtenerRol());

export const cerrarSesion = () => {
    localStorage.removeItem('tokenLCAW');
    localStorage.removeItem('usuarioLCAW');
    localStorage.removeItem('rolLCAW');
    window.location.href = PAGINA_LOGIN;
};

// Úsalo al inicio de cada página protegida. Devuelve false si redirigió.
export const requerirSesion = () => {
    if (obtenerToken()) return true;
    window.location.replace(PAGINA_LOGIN);
    return false;
};

// Solo comodidad de interfaz: el backend siempre valida el rol por su cuenta.
export const requerirRol = (...roles) => {
    if (tieneRol(...roles)) return true;
    window.location.replace('./menu.html');
    return false;
};

/* ------------------------------- API ------------------------------- */
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

    try {
        const respuesta = await fetch(`${API_URL}${endpoint}`, { ...opciones, headers });

        // Token vencido, sesión cerrada o cuenta desactivada
        if (respuesta.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/logout')) {
            cerrarSesion();
            return { exito: false, mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' };
        }

        return await respuesta.json();
    } catch (error) {
        console.error('Error en fetchConAuth:', error);
        return { exito: false, mensaje: 'Error de conexión con el servidor. Intenta más tarde.' };
    } finally {
        ocultarCargador();
    }
};

/* ------------------------------ FORMATOS ------------------------------ */
const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// MySQL manda los DECIMAL como texto ('20.99'); aquí se convierten solos.
export const formatearMoneda = (n) => formatoMoneda.format(Number(n) || 0);

export const formatearFechaHora = (iso) => {
    if (!iso) return '—';
    const fecha = new Date(iso);
    return Number.isNaN(fecha.getTime())
        ? '—'
        : fecha.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
};

// 'YYYY-MM-DD' del día de hoy en TU zona horaria
export const hoyLocalStr = () => {
    const d = new Date();
    const dos = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
};

// Límites del día local, en ISO (el servidor trabaja en UTC)
export const inicioDelDiaISO = (fechaStr) => new Date(`${fechaStr}T00:00:00`).toISOString();
export const finDelDiaISO = (fechaStr) => new Date(`${fechaStr}T23:59:59.999`).toISOString();

// Escapa texto antes de meterlo en innerHTML (nombres de producto, observaciones, etc.)
export function escaparHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/* --------------------------- COMPROBANTES --------------------------- */
// Sube una imagen a ImgBB y devuelve su URL pública.
export async function subirComprobante(archivo) {
    const formData = new FormData();
    formData.append('image', archivo);

    try {
        const respuesta = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });
        const datos = await respuesta.json();
        if (!datos.success) {
            return { exito: false, mensaje: datos.error?.message || 'No se pudo subir la imagen.' };
        }
        return { exito: true, url: datos.data.url };
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        return { exito: false, mensaje: 'Error de conexión al subir el comprobante.' };
    }
}