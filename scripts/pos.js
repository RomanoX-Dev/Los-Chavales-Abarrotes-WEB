import { obtenerProductosPOS, registrarVentaDB } from '../api/posAPI.js';
import { mostrarAlerta } from '../utils/alertas.js'; 

let productosGlobales = []; 
let carrito = []; 

document.addEventListener('DOMContentLoaded', () => {
    cargarCatalogo();

    // Eventos de la vista
    document.getElementById('buscadorPos').addEventListener('input', (e) => filtrarProductos(e.target.value.toLowerCase()));
    document.getElementById('btnVaciarCarrito').addEventListener('click', vaciarCarrito);

    // Abrir/Cerrar Modal de Pago
    document.getElementById('btnCobrar').addEventListener('click', () => {
        if (carrito.length === 0) return mostrarAlerta('El ticket está vacío. 🛒');
        document.getElementById('totalAPagarModal').textContent = document.getElementById('txtTotal').textContent;
        document.getElementById('modalPago').classList.remove('oculto');
    });

    document.getElementById('btnCerrarModalPago').addEventListener('click', () => {
        document.getElementById('modalPago').classList.add('oculto');
    });

    // Eventos para elegir método de pago (Efectivo o Tarjeta)
    document.querySelectorAll('.btn-pago').forEach(btn => {
        btn.addEventListener('click', (e) => procesarCobroFinal(parseInt(e.target.dataset.metodo)));
    });
});

// ==========================================
// CATALOGO Y RENDERIZADO
// ==========================================
async function cargarCatalogo() {
    productosGlobales = await obtenerProductosPOS();
    renderizarProductos(productosGlobales);
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById('contenedorProductosPos');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<h3 style="color: white; text-align: center; width: 100%;">No hay productos disponibles.</h3>';
        return;
    }

    lista.forEach(prod => {
        if (prod.Estatus === 'Inactivo' || parseFloat(prod.Stock) <= 0) return;

        const div = document.createElement('div');
        div.className = 'card-producto';
        div.addEventListener('click', () => agregarAlCarrito(prod));

        div.innerHTML = `
            <h4>${prod.Nombre}</h4>
            <div class="card-precio">$${parseFloat(prod.Precio).toFixed(2)}</div>
            <div class="card-stock">📦 Disp: ${prod.Stock}</div>
        `;
        contenedor.appendChild(div);
    });
}

function filtrarProductos(texto) {
    const filtrados = productosGlobales.filter(p => 
        p.Nombre.toLowerCase().includes(texto) || 
        (p.CodigoBarras && p.CodigoBarras.toLowerCase().includes(texto))
    );
    renderizarProductos(filtrados);
}

// ==========================================
// CARRITO DE COMPRAS
// ==========================================
function agregarAlCarrito(producto) {
    const existe = carrito.find(p => p.IdProducto === producto.IdProducto);

    if (existe) {
        if (existe.Cantidad < producto.Stock) {
            existe.Cantidad++;
        } else {
            mostrarAlerta('Stock máximo alcanzado 🛑');
        }
    } else {
        carrito.push({
            IdProducto: producto.IdProducto,
            Nombre: producto.Nombre,
            Precio: parseFloat(producto.Precio),
            Stock: producto.Stock,
            Cantidad: 1
        });
    }
    renderizarCarrito();
}

function renderizarCarrito() {
    const lista = document.getElementById('listaCarrito');
    lista.innerHTML = '';

    if (carrito.length === 0) {
        lista.innerHTML = '<div class="mensaje-vacio">El carrito está vacío.</div>';
        actualizarTotales();
        return;
    }

    carrito.forEach(item => {
        const subtotal = item.Precio * item.Cantidad;
        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <div class="item-info">
                <strong>${item.Nombre}</strong>
                <span class="item-precio">$${item.Precio.toFixed(2)}</span>
            </div>
            <div class="item-controles">
                <div class="control-cantidad">
                    <button class="btn-cant btn-restar" data-id="${item.IdProducto}">-</button>
                    <span>${item.Cantidad}</span>
                    <button class="btn-cant btn-sumar" data-id="${item.IdProducto}">+</button>
                </div>
                <span class="item-subtotal">$${subtotal.toFixed(2)}</span>
                <button class="btn-cant btn-eliminar" style="color: #ff6b6b;" data-id="${item.IdProducto}">✖</button>
            </div>
        `;
        lista.appendChild(div);
    });

    // listeners dinámicos
    document.querySelectorAll('.btn-restar').forEach(b => b.addEventListener('click', (e) => cambiarCantidad(parseInt(e.target.dataset.id), -1)));
    document.querySelectorAll('.btn-sumar').forEach(b => b.addEventListener('click', (e) => cambiarCantidad(parseInt(e.target.dataset.id), 1)));
    document.querySelectorAll('.btn-eliminar').forEach(b => b.addEventListener('click', (e) => eliminarItem(parseInt(e.target.dataset.id))));

    actualizarTotales();
}

function cambiarCantidad(id, cambio) {
    const item = carrito.find(p => p.IdProducto === id);
    if (!item) return;

    const nuevaCant = item.Cantidad + cambio;
    if (nuevaCant <= 0) return eliminarItem(id);
    if (nuevaCant > item.Stock) return mostrarAlerta('Stock máximo alcanzado 🛑');

    item.Cantidad = nuevaCant;
    renderizarCarrito();
}

function eliminarItem(id) {
    carrito = carrito.filter(p => p.IdProducto !== id);
    renderizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length > 0 && confirm('¿Vaciar el ticket?')) {
        carrito = [];
        renderizarCarrito();
    }
}

function actualizarTotales() {
    let total = carrito.reduce((acc, item) => acc + (item.Precio * item.Cantidad), 0);
    const subtotal = total / 1.16;
    const iva = total - subtotal;

    document.getElementById('txtSubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('txtIva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('txtTotal').textContent = `$${total.toFixed(2)}`;
}

// ==========================================
// ENVÍO DE LA VENTA AL BACKEND
// ==========================================
async function procesarCobroFinal(idMetodoPago) {
    const empleadoSesion = JSON.parse(localStorage.getItem('usuarioLCAW'));
    
    // PAYLOAD LIMPIO: La BD calcula precios e IVA
    const datosVenta = {
        idEmpleado: empleadoSesion ? empleadoSesion.idEmpleado : 1,
        idMetodoPago: idMetodoPago,
        carrito: carrito.map(item => ({
            idProducto: item.IdProducto,
            cantidad: item.Cantidad
        }))
    };

    document.getElementById('modalPago').classList.add('oculto');

    const respuesta = await registrarVentaDB(datosVenta);

    if (respuesta.exito) {
        mostrarAlerta('¡Venta realizada con éxito! 🚀');
        carrito = [];
        renderizarCarrito();
        cargarCatalogo(); // Refresca el stock disponible
    } else {
        mostrarAlerta(`Error: ${respuesta.mensaje}`);
    }
}