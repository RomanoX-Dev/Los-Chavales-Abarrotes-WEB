/* ==========================================================================
   MENU.JS - LAYOUT MADRE, COMPONENTES REUTILIZABLES Y PERFIL DE USUARIO
   ========================================================================== */

import { requerirSesion, obtenerUsuario, obtenerRol, cerrarSesion } from '../utils/helpers.js';
import { cargarCatalogoInventario, actualizarBadgeSidebar } from '../components/menuCOM.js';
import { cargarKPIsOperativos } from '../components/kpisCOM.js';
import { usuariosAPI } from '../api/usuariosAPI.js';
import { mostrarConfirmacion, mostrarAdvertencia } from '../utils/alertas.js';
import { ciclarTema, nombreTema } from '../utils/tema.js';
import { mostrarCargador } from '../utils/cargador.js';

// Si no hay sesión, redirige al login. Todas las páginas cargan este archivo.
const sesionValida = requerirSesion();

// Qué roles ven cada opción. Solo afecta la interfaz: el backend valida los permisos de verdad.
// Ajusta esta lista a lo que permiten tus rutas (proveedores y empleados son supuestos).
// Los href van en minúsculas: el archivo debe llamarse igual (GitHub Pages distingue mayúsculas).
const MENU = [
    { href: 'menu.html',        icono: '🏠',    texto: 'Inicio',          roles: null },
    { href: 'pos.html',         icono: '💻',    texto: 'Punto de Venta',  roles: ['Administrador', 'Gerente', 'Vendedor'] },
    { href: 'inventario.html',  icono: '📦',    texto: 'Inventario',      roles: ['Administrador', 'Gerente', 'Almacenista'], badge: true },
    { href: 'proveedores.html', icono: '👨‍🔧', texto: 'Proveedores',     roles: ['Administrador', 'Gerente', 'Almacenista'] },
    { href: 'clientes.html',    icono: '👥',    texto: 'Empleados',       roles: ['Administrador', 'Gerente'] },
    { href: 'historial.html',   icono: '📊',    texto: 'Historial',       roles: ['Administrador', 'Gerente', 'Vendedor'] },
    { href: 'usuarios.html',    icono: '⚙️',    texto: 'Usuarios',        roles: ['Administrador'] }
];

/**
 * Web Component para la Barra Lateral (Sidebar)
 */
class AppSidebar extends HTMLElement {
    connectedCallback() {
        const rutaActual = (window.location.pathname.split('/').pop() || 'menu.html').toLowerCase();
        const rol = obtenerRol();

        const enlaces = MENU
            .filter(item => !item.roles || item.roles.includes(rol))
            .map(item => `
                <a href="${item.href}" class="menu-btn ${rutaActual === item.href ? 'active' : ''}">
                    <span>${item.icono} ${item.texto}</span>
                    ${item.badge ? '<span id="badgeStockBajo" class="badge-alerta">0</span>' : ''}
                </a>`)
            .join('');

        this.innerHTML = `
            <aside class="sidebar glass-panel">
                <div class="logo">
                    <h2>🛒 LCAW</h2>
                    <span>Los Chavales Abarrotes</span>
                </div>

                <nav class="sidebar-menu">${enlaces}</nav>

                <div class="sidebar-footer">
                    <button id="btnTema" class="btn-pos-rapido"" type="button">🎨 Tema: ${nombreTema()}</button>
                    <button id="btnCerrarSesion" class="btn-logout" type="button">🚪 Cerrar Sesión</button>
                </div>
            </aside>
        `;

        if (sesionValida) actualizarBadgeSidebar();
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
                            <span id="avatarPlaceholder" class="avatar-placeholder">👤</span>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }
}

if (!customElements.get('app-sidebar')) customElements.define('app-sidebar', AppSidebar);
if (!customElements.get('app-header')) customElements.define('app-header', AppHeader);

/**
 * Carga la información del usuario en sesión en la topbar.
 * El login guarda: { idUsuario, nombreUsuario, nombreEmpleado, nombreRol, permisosWeb }
 */
export function cargarPerfilUsuario() {
    const usuario = obtenerUsuario();
    if (!usuario) return;

    const elemSaludo = document.getElementById('saludoUsuario');
    const elemNombre = document.getElementById('nombreUsuario');
    const elemNick = document.getElementById('nomUsuario');
    const elemRol = document.getElementById('rolUsuario');

    const primerNombre = (usuario.nombreEmpleado || '').split(' ')[0] || 'Usuario';

    const hora = new Date().getHours();
    let saludo = '¡Buenas noches!';
    if (hora >= 6 && hora < 12) saludo = '¡Buenos días!';
    else if (hora >= 12 && hora < 19) saludo = '¡Buenas tardes!';

    const textoActual = elemSaludo ? elemSaludo.textContent.trim() : '';
    if (elemSaludo && ['', 'Cargando sesión...', 'Cargando bienvenida...'].includes(textoActual)) {
        elemSaludo.textContent = `${saludo} ${primerNombre}`;
    }

    if (elemNombre) elemNombre.textContent = usuario.nombreEmpleado || 'Usuario activo';
    if (elemNick) elemNick.textContent = usuario.nombreUsuario ? `@${usuario.nombreUsuario}` : '@usuario';
    if (elemRol) elemRol.textContent = usuario.nombreRol || '';
}

document.addEventListener('DOMContentLoaded', () => {
    if (!sesionValida) return;

    cargarPerfilUsuario();

    if (document.getElementById('contenedorCatalogo')) {
        cargarCatalogoInventario();
    }
    if (document.getElementById('kpiVentas')) {
        cargarKPIsOperativos();
    }

    // Delegación global para el cierre de sesión
    document.addEventListener('click', async (e) => {
        const btnLogout = e.target.closest('#btnCerrarSesion');
        if (!btnLogout) return;

        e.preventDefault();

        const confirmado = await mostrarConfirmacion('¿Estás seguro de que deseas cerrar sesión en el sistema?', {
            textoAceptar: 'Cerrar sesión'
        });

        if (!confirmado) {
            mostrarAdvertencia('Cierre de sesión cancelado.');
            return;
        }

        mostrarCargador('Cerrando sesión de forma segura...', 0);
        await usuariosAPI.logout(); // invalida la sesión en el servidor (si falla, igual se cierra aquí)
        cerrarSesion();
    });
    
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btnTema');
      if (!btn) return;
      btn.textContent = `🎨 Tema: ${nombreTema(ciclarTema())}`;
    });
});