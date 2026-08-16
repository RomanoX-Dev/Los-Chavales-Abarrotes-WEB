// Guardamos la URL base en una variable. 
// ¡Si algún día cambias de Render a otra plataforma, solo modificas esta línea!
const BASE_URL = 'https://lcaw-server.onrender.com/api';

export async function iniciarSesion(usuario, password) {
    try {
        const respuesta = await fetch(`${BASE_URL}/usuarios/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const datos = await respuesta.json();
        
        // Retornamos un objeto limpio con lo que necesita saber el Frontend
        return { 
            exito: respuesta.ok, 
            datos: datos 
        };

    } catch (error) {
        console.error('Error en la API (Login):', error);
        // Si se cae el internet o el servidor, devolvemos un error controlado
        return { 
            exito: false, 
            datos: { mensaje: "No se pudo conectar con el servidor. Revisa tu conexión." } 
        };
    }
}