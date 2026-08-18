const HOST = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://lcaw-server.onrender.com/api';

export async function obtenerMarcasAPI() {
    try {
        const res = await fetch(`${HOST}/marcas`);
        if (!res.ok) throw new Error('Error en la respuesta del servidor');
        return await res.json();
    } catch (error) {
        console.error('Error al obtener marcas:', error);
        return [];
    }
}