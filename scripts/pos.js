// ==========================================
// VARIABLES GLOBALES
// ==========================================
let productosGlobales = []; // Aquí guardaremos el catálogo del backend
let carrito = []; // Aquí guardaremos los productos que se van a cobrar

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    // Evento para el buscador
    document.getElementById('buscadorPos').addEventListener('input', (e) => {
        filtrarProductos(e.target.value.toLowerCase());
    });

    // Eventos de los botones principales del carrito
    document.getElementById('btnVaciarCarrito').addEventListener('click', vaciarCarrito);
    document.getElementById('btnCobrar').addEventListener('click', cobrar);
});

// ==========================================
// 1. CARGAR Y MOSTRAR PRODUCTOS (DERECHA)
// ==========================================
async function cargarProductos() {
    const contenedor = document.getElementById('contenedorProductosPos');
    try {
        const respuesta = await fetch('https://lcaw-server.onrender.com/api/productos');
        productosGlobales = await respuesta.json();
        renderizarProductos(productosGlobales);
    } catch (error) {
        contenedor.innerHTML = '<h3 style="color: #ff6b6b; text-align: center; width: 100%;">Error al conectar con el servidor.</h3>';
    }
}

function renderizarProductos(lista) {
    const contenedor = document.getElementById('contenedorProductosPos');
    contenedor.innerHTML = '';

    if (lista.length === 0) {
        contenedor.innerHTML = '<h3 style="color: white; text-align: center; width: 100%;">No hay productos disponibles.</h3>';
        return;
    }

    lista.forEach(prod => {
        // No mostramos productos inactivos o sin stock
        if (prod.Estatus === 'Inactivo' || prod.Stock <= 0) return;

        const div = document.createElement('div');
        div.className = 'card-producto';
        // Al hacer clic en la tarjeta, lo agregamos al carrito
        div.onclick = () => agregarAlCarrito(prod);

        div.innerHTML = `
            <h4>${prod.Nombre}</h4>
            <div class="card-precio">${formatearMoneda(prod.Precio)}</div>
            <div class="card-stock">📦 Disponibles: ${prod.Stock}</div>
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
// 2. LÓGICA DEL CARRITO (IZQUIERDA)
// ==========================================
function agregarAlCarrito(productoBase) {
    // Revisamos si el producto ya está en el ticket
    const itemExistente = carrito.find(item => item.IdProducto === productoBase.IdProducto);

    if (itemExistente) {
        // Si ya existe, verificamos que haya stock suficiente para aumentarle 1
        if (itemExistente.cantidad < productoBase.Stock) {
            itemExistente.cantidad++;
        } else {
            alert('¡No hay más stock disponible de este producto!');
        }
    } else {
        // Si no existe, lo agregamos al arreglo del carrito
        carrito.push({
            IdProducto: productoBase.IdProducto,
            Nombre: productoBase.Nombre,
            Precio: parseFloat(productoBase.Precio),
            Stock: productoBase.Stock,
            cantidad: 1
        });
    }
    
    renderizarCarrito();
}

function renderizarCarrito() {
    const listaCarrito = document.getElementById('listaCarrito');
    listaCarrito.innerHTML = '';

    if (carrito.length === 0) {
        listaCarrito.innerHTML = '<div class="mensaje-vacio">El carrito está vacío. Agrega productos para comenzar.</div>';
        actualizarTotales();
        return;
    }

    carrito.forEach(item => {
        const subtotalItem = item.Precio * item.cantidad;

        const div = document.createElement('div');
        div.className = 'item-carrito';
        div.innerHTML = `
            <div class="item-info">
                <strong>${item.Nombre}</strong>
                <span class="item-precio">${formatearMoneda(item.Precio)}</span>
            </div>
            <div class="item-controles">
                <div class="control-cantidad">
                    <button class="btn-cant" onclick="cambiarCantidad(${item.IdProducto}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-cant" onclick="cambiarCantidad(${item.IdProducto}, 1)">+</button>
                </div>
                <span class="item-subtotal">${formatearMoneda(subtotalItem)}</span>
                <button class="btn-cant" style="color: #ff6b6b;" onclick="eliminarDelCarrito(${item.IdProducto})">✖</button>
            </div>
        `;
        listaCarrito.appendChild(div);
    });

    actualizarTotales();
}

// ==========================================
// 3. CONTROLES Y TOTALES
// ==========================================
function cambiarCantidad(id, cambio) {
    const item = carrito.find(p => p.IdProducto === id);
    if (!item) return;

    const nuevaCantidad = item.cantidad + cambio;

    // Validaciones
    if (nuevaCantidad <= 0) {
        eliminarDelCarrito(id);
        return;
    }
    if (nuevaCantidad > item.Stock) {
        alert('¡Stock máximo alcanzado!');
        return;
    }

    item.cantidad = nuevaCantidad;
    renderizarCarrito();
}

function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.IdProducto !== id);
    renderizarCarrito();
}

function vaciarCarrito() {
    if (carrito.length > 0 && confirm('¿Estás seguro de vaciar el ticket?')) {
        carrito = [];
        renderizarCarrito();
    }
}

function actualizarTotales() {
    // Sumamos el total de (precio * cantidad) de todos los items
    let total = 0;
    carrito.forEach(item => {
        total += item.Precio * item.cantidad;
    });

    // En México, normalmente los precios de abarrotes ya incluyen IVA o son tasa 0%.
    // Desglosaremos el IVA asumiendo que el precio final lo incluye (Total / 1.16).
    const subtotal = total / 1.16;
    const iva = total - subtotal;

    document.getElementById('txtSubtotal').textContent = formatearMoneda(subtotal);
    document.getElementById('txtIva').textContent = formatearMoneda(iva);
    document.getElementById('txtTotal').textContent = formatearMoneda(total);
}

function cobrar() {
    if (carrito.length === 0) {
        alert('No hay productos en el ticket para cobrar.');
        return;
    }
    
    // Por ahora solo mostraremos un mensaje. Luego lo conectaremos a tu tabla 'ventas' en la BD
    alert(`¡Venta realizada con éxito!\nTotal cobrado: ${document.getElementById('txtTotal').textContent}`);
    carrito = [];
    renderizarCarrito();
}

// ==========================================
// UTILERÍAS
// ==========================================
function formatearMoneda(cantidad) {
    return cantidad.toLocaleString('es-MX', {
        style: 'currency',
        currency: 'MXN'
    });
}