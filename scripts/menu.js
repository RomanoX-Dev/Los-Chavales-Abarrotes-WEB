/* ==========================================================================
   MENU.JS - LAYOUT MADRE, COMPONENTES REUTILIZABLES Y PERFIL DE USUARIO
   ========================================================================== */

import { resolverUrlImagen } from '../utils/helpers.js';
import { cargarCatalogoInventario, actualizarBadgeSidebar } from '../components/menuCOM.js';

/**
 * Web Component para la Barra Lateral (Sidebar)
 */
class AppSidebar extends HTMLElement {
    connectedCallback() {
        const rutaActual = window.location.pathname.split('/').pop() || 'menu.html';

        this.innerHTML = `
            <aside class="sidebar glass-panel">
                <div class="logo">
                    <h2>🛒 LCAW</h2>
                    <span>Los Chavales Abarrotes</span>
                </div>

                <nav class="sidebar-menu">
                    <a href="menu.html" class="menu-btn ${rutaActual === 'menu.html' ? 'active' : ''}">
                        <span>🏠 Inicio</span>
                    </a>
                    <a href="pos.html" class="menu-btn ${rutaActual === 'pos.html' ? 'active' : ''}">
                        <span>💻 Punto de Venta</span>
                    </a>
                    <a href="inventario.html" class="menu-btn ${rutaActual === 'inventario.html' ? 'active' : ''}">
                        <span>📦 Inventario</span>
                        <span id="badgeStockBajo" class="badge-alerta">0</span>
                    </a>
                    <a href="clientes.html" class="menu-btn ${rutaActual === 'clientes.html' ? 'active' : ''}">
                        <span>👥 Clientes</span>
                    </a>
                    <a href="ventas.html" class="menu-btn ${rutaActual === 'ventas.html' ? 'active' : ''}">
                        <span>📊 Historial</span>
                    </a>
                    <a href="usuarios.html" class="menu-btn ${rutaActual === 'usuarios.html' ? 'active' : ''}">
                        <span>⚙️ Usuarios</span>
                    </a>
                </nav>

                <div class="sidebar-footer">
                    <button id="btnCerrarSesion" class="btn-logout" type="button">🚪 Cerrar Sesión</button>
                </div>
            </aside>
        `;

        // Ejecuta la consulta de stock bajo en cuanto se monta la barra lateral en la página
        actualizarBadgeSidebar();
    }
}

/**
 * Web Component para la Barra Superior (Topbar)
 */
class AppHeader extends HTMLElement {
    connectedCallback() {
        const titulo = this.getAttribute('titulo') || 'Bienvenido';
        const subtitulo = this.getAttribute('subtitulo') || '';
        const mostrarPos = this.hasAttribute('mostrar-pos');

        this.innerHTML = `
            <header class="topbar glass-panel">
                <div class="bienvenida">
                    <h1>${titulo}</h1>
                    <p id="saludoUsuario" class="subtitulo-header">${subtitulo}</p>
                </div>
                
                <div class="topbar-derecha">
                    ${mostrarPos ? `
                        <a href="pos.html" class="btn-pos-rapido">
                            ⚡ Nueva Venta
                        </a>
                    ` : ''}

                    <div class="usuario-info">
                        <div class="detalles-texto">
                            <span id="nombreUsuario" class="perfil-nombre">Cargando...</span>
                            <span id="nomUsuario" class="perfil-nick">@usuario</span>
                        </div>
                        <span id="rolUsuario" class="badge-rol">Rol</span>

                        <div class="avatar-container">
                            <img id="imgPerfilUsuario" src="../assets/Prodefault.png" alt="Foto de perfil" class="avatar-img oculto">
                            <span id="avatarPlaceholder" class="avatar-placeholder">👤</span>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
}

customElements.define('app-sidebar', AppSidebar);
customElements.define('app-header', AppHeader);

/**
 * Carga la información del usuario en sesión en la topbar.
 */
export function cargarPerfilUsuario() {
    try {
        const sesionRaw = localStorage.getItem('usuarioSesion') || sessionStorage.getItem('usuarioSesion');
        if (!sesionRaw) return;

        const usuario = JSON.parse(sesionRaw);

        const elemSaludo = document.getElementById('saludoUsuario');
        const elemNombre = document.getElementById('nombreUsuario');
        const elemNick = document.getElementById('nomUsuario');
        const elemRol = document.getElementById('rolUsuario');
        const imgPerfil = document.getElementById('imgPerfilUsuario');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');

        const hora = new Date().getHours();
        let saludo = '¡Buenas noches!';
        if (hora >= 6 && hora < 12) saludo = '¡Buenos días!';
        else if (hora >= 12 && hora < 19) saludo = '¡Buenas tardes!';

        if (elemSaludo && (!elemSaludo.textContent.trim() || elemSaludo.textContent === 'Cargando bienvenida...')) {
            elemSaludo.textContent = `${saludo}, ${usuario.nombre || 'Usuario'}`;
        }

        if (elemNombre) elemNombre.textContent = usuario.nombre || 'Usuario Activo';
        if (elemNick) elemNick.textContent = usuario.username ? `@${usuario.username}` : '@usuario';
        if (elemRol) elemRol.textContent = usuario.rol || 'Vendedor';

        if (usuario.fotoUrl && imgPerfil && avatarPlaceholder) {
            imgPerfil.src = resolverUrlImagen(usuario.fotoUrl);
            imgPerfil.classList.remove('oculto');
            avatarPlaceholder.classList.add('oculto');
        }
    } catch (err) {
        console.warn('No se pudo cargar la información de la sesión:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    cargarPerfilUsuario();

    if (document.getElementById('contenedorCatalogo')) {
        cargarCatalogoInventario();
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '../index.html';
        });
    }
});