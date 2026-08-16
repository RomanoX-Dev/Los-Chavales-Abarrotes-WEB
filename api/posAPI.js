const BASE_URL = 'https://lcaw-server.onrender.com/api';

// 1. Obtener productos para el POS
export async function obtenerProductosPOS() {
    try {
        const respuesta = await fetch(`${BASE_URL}/productos`);
        if (!respuesta.ok) throw new Error('Error al cargar productos');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        return [];
    }
}

// 2. Registrar la Venta en la Base de Datos
export async function registrarVentaDB(datosVenta) {
    try {
        // Esta ruta (POST /ventas) la tendrás que crear en tu backend en el futuro
        const respuesta = await fetch(`${BASE_URL}/ventas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosVenta)
        });
        
        const data = await respuesta.json();
        return { exito: respuesta.ok, mensaje: data.mensaje || 'Venta registrada' };
    } catch (error) {
        return { exito: false, mensaje: 'Error de conexión al procesar el cobro.' };
    }
}