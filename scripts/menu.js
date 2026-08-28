// Exponemos la función de navegación al objeto global
window.navegarA = function(pagina) {
    window.location.href = pagina;
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtención de datos del LocalStorage
    const usuarioGuardado = localStorage.getItem('usuarioLCAW');
    const rolGuardado = localStorage.getItem('rolLCAW');

    // 2. Control de acceso
    if (!usuarioGuardado) {
        window.location.href = 'login.html';
        return;
    }

    const usuario = JSON.parse(usuarioGuardado);

    // 3. Extracción de variables (Nombre, Apellido y Nombre de Usuario)
    const primerNombre = usuario.nombre || usuario.Nombre || 'Usuario';
    const apellido = usuario.apPaterno ? ` ${usuario.apPaterno}` : '';
    const nombreCompleto = `${primerNombre}${apellido}`;
    const nickUsuario = usuario.nombreUsuario || usuario.usuario || 'usuario';

    // 4. Inyección de datos en la interfaz
    const elNombre = document.getElementById('nombreUsuario');
    const elNick = document.getElementById('nomUsuario');
    const elSaludo = document.getElementById('saludoUsuario');
    const elRol = document.getElementById('rolUsuario');

    if (elNombre) elNombre.textContent = nombreCompleto;
    if (elNick) elNick.textContent = `@${nickUsuario}`;
    if (elSaludo) elSaludo.textContent = `¡Hola de nuevo, ${primerNombre}! 👋`;
    if (elRol) elRol.textContent = rolGuardado || 'Empleado';

    // =========================================================================
    // 5. PREPARATIVO FUTURO: CARGAR FOTO DE PERFIL DESDE LA BD
    // =========================================================================
    cargarFotoPerfil(usuario);

    // =========================================================================
    // 6. PREPARATIVO FUTURO: CONECTAR CATÁLOGO E INVENTARIO
    // =========================================================================
    cargarCatalogoInventario();

    // 7. Evento de Cierre de Sesión
    const btnLogout = document.getElementById('btnCerrarSesion');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('usuarioLCAW');
            localStorage.removeItem('rolLCAW');
            window.location.href = 'login.html';
        });
    }
});

/**
 * Función reservada para renderizar la foto del usuario cuando se reciba de la BD.
 */
function cargarFotoPerfil(usuario) {
    const imgElement = document.getElementById('imgPerfilUsuario');
    const placeholderElement = document.getElementById('avatarPlaceholder');

    // TODO BD: Cuando agregues la columna 'fotoUrl' o 'avatar' en la BD:
    // if (usuario.fotoUrl) {
    //     imgElement.src = usuario.fotoUrl;
    //     imgElement.classList.remove('oculto');
    //     placeholderElement.classList.add('oculto');
    // }
}

/**
 * Función reservada para conectar los anuncios y tarjetas con tu Endpoint de Inventario.
 */
async function cargarCatalogoInventario() {
    // TODO BACKEND: Descomentar al tener listo el endpoint del inventario
    /*
    try {
        const respuesta = await fetch('/api/productos/destacados');
        const productos = await respuesta.json();
        const contenedor = document.getElementById('contenedorCatalogo');
        
        contenedor.innerHTML = productos.map(prod => `
            <article class="tarjeta-producto glass-panel">
                <div class="badge-promocion">${prod.destacado ? 'Destacado' : 'Disponible'}</div>
                <img src="${prod.imagenUrl || '../assets/default-product.png'}" alt="${prod.nombre}" class="img-producto">
                <div class="info-producto">
                    <h3>${prod.nombre}</h3>
                    <p class="descripcion-corta">${prod.descripcion || 'Sin descripción'}</p>
                    <div class="meta-producto">
                        <span class="precio">$${prod.precio.toFixed(2)}</span>
                        <span class="stock-tag">Stock: ${prod.stock}</span>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
    */
}