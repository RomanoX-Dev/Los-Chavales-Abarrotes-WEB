// Exponemos la función de navegación al objeto global para los onclick del HTML
window.navegarA = function(pagina) {
    window.location.href = pagina;
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener los datos almacenados en el Login
    const usuarioGuardado = localStorage.getItem('usuarioLCAW');
    const rolGuardado = localStorage.getItem('rolLCAW');

    // 2. Seguridad: Si no hay usuario guardado, redirigir al login
    if (!usuarioGuardado) {
        alert('Debes iniciar sesión primero.');
        window.location.href = 'login.html';
        return;
    }

    // Convertimos el JSON almacenado a un objeto JavaScript
    const usuario = JSON.parse(usuarioGuardado);

    // 3. Extraemos el nombre según la tabla de tu Base de Datos
    const primerNombre = usuario.nombre || usuario.Nombre || 'Usuario';
    const apellido = usuario.apPaterno ? ` ${usuario.apPaterno}` : '';
    const nombreCompleto = `${primerNombre}${apellido}`;

    // 4. Renderizar datos en la interfaz (Con protección contra null)
    const elNombre = document.getElementById('nombreUsuario');
    const elSaludo = document.getElementById('saludoUsuario');
    const elRol = document.getElementById('rolUsuario');

    if (elNombre) elNombre.textContent = `Hola, ${nombreCompleto}`;
    if (elSaludo) elSaludo.textContent = `¡Bienvenido de nuevo, ${nombreCompleto}! 👋`;
    if (elRol) elRol.textContent = rolGuardado || 'Empleado';

    // 5. Lógica de Cerrar Sesión
    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuarioLCAW');
            localStorage.removeItem('rolLCAW');
            window.location.href = 'login.html';
        });
    }
});