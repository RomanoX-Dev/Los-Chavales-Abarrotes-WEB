let productosGlobales = [];
let modoEdicion = false; // Bandera para saber si guardamos o actualizamos

document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    // 1. Buscador
    document.getElementById('buscadorProductos').addEventListener('input', (e) => {
        filtrarProductos(e.target.value.toLowerCase());
    });

    // 2. Controladores del Modal
    const modal = document.getElementById('modalProducto');
    const form = document.getElementById('formularioProducto');

    // Botón Agregar (Abre Modal Vacío)
    document.getElementById('btnAgregarProducto').addEventListener('click', () => {
        modoEdicion = false;
        document.getElementById('tituloModal').textContent = 'Nuevo Producto 📦';
        form.reset(); // Limpia el formulario
        document.getElementById('productoId').value = '';
        modal.classList.remove('oculto');
    });

    // Botones Cancelar/Cerrar (Ocultan Modal)
    document.getElementById('btnCerrarModal').addEventListener('click', () => modal.classList.add('oculto'));
    document.getElementById('btnCancelarModal').addEventListener('click', () => modal.classList.add('oculto'));

    // 3. ENVIAR FORMULARIO (Guardar / Actualizar)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Armamos el objeto con exactamente los nombres de tu Base de Datos
        const datosProducto = {
            CodigoBarras: document.getElementById('codigoBarras').value || null,
            ProductoN: document.getElementById('nombreProducto').value,
            Precio: parseFloat(document.getElementById('precio').value),
            Stock: parseInt(document.getElementById('stock').value),
            idCategoria: parseInt(document.getElementById('idCategoria').value),
            idMarca: parseInt(document.getElementById('idMarca').value),
            idUnidad: 1, // Por defecto Pieza
            StockMinimo: 5,
            PrecioProveedor: 0,
            idProveedor: 1
        };

        try {
            const url = modoEdicion 
                ? `http://localhost:3000/api/productos/${document.getElementById('productoId').value}` 
                : 'http://localhost:3000/api/productos';
            
            const metodo = modoEdicion ? 'PUT' : 'POST';

            const respuesta = await fetch(url, {
                method: metodo,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datosProducto)
            });

            if (respuesta.ok) {
                modal.classList.add('oculto');
                cargarProductos(); // Recargamos la tabla
                alert(modoEdicion ? 'Producto actualizado!' : 'Producto guardado!');
            } else {
                const errorData = await respuesta.json();
                alert('Error: ' + errorData.mensaje);
            }
        } catch (error) {
            console.error('Error al guardar:', error);
        }
    });
});

// ================= FUNCIONES DE TABLA =================

async function cargarProductos() {
    const tbody = document.getElementById('cuerpoTablaProductos');
    try {
        const respuesta = await fetch('http://localhost:3000/api/productos');
        productosGlobales = await respuesta.json();
        renderizarTabla(productosGlobales);
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7">Error al cargar.</td></tr>`;
    }
}

function renderizarTabla(lista) {
    const tbody = document.getElementById('cuerpoTablaProductos');
    tbody.innerHTML = '';
    
    lista.forEach(prod => {
        // Ignoramos los dados de baja en la tabla normal
        if (prod.Estatus === 'Inactivo') return; 

        let claseStock = parseFloat(prod.Stock) <= 5 ? 'badge-stock bajo' : 'badge-stock';
        
        tbody.innerHTML += `
            <tr>
                <td>${prod.CodigoBarras || 'N/A'}</td>
                <td><strong>${prod.Nombre}</strong></td>
                <td>${prod.NombreCategoria || 'Sin categoría'}</td>
                <td style="color: #4facfe;">$${parseFloat(prod.Precio).toFixed(2)}</td>
                <td><span class="${claseStock}">${prod.Stock}</span></td>
                <td>${prod.Estatus}</td>
                <td>
                    <button class="btn-icon" onclick="editarProducto(${prod.IdProducto})">✏️</button>
                    <button class="btn-icon" onclick="eliminarProducto(${prod.IdProducto})">🗑️</button>
                </td>
            </tr>
        `;
    });
}

function filtrarProductos(texto) {
    const filtrados = productosGlobales.filter(p => 
        p.Nombre.toLowerCase().includes(texto) || 
        (p.CodigoBarras && p.CodigoBarras.toLowerCase().includes(texto))
    );
    renderizarTabla(filtrados);
}

// ================= ACCIONES (EDITAR / BORRAR) =================

function editarProducto(id) {
    // Buscamos el producto en nuestro arreglo global
    const prod = productosGlobales.find(p => p.IdProducto === id);
    if (!prod) return;

    modoEdicion = true;
    document.getElementById('tituloModal').textContent = 'Editar Producto ✏️';
    
    // Llenamos el formulario
    document.getElementById('productoId').value = prod.IdProducto;
    document.getElementById('codigoBarras').value = prod.CodigoBarras || '';
    document.getElementById('nombreProducto').value = prod.Nombre;
    document.getElementById('precio').value = prod.Precio;
    document.getElementById('stock').value = prod.Stock;
    
    document.getElementById('modalProducto').classList.remove('oculto');
}

async function eliminarProducto(id) {
    if (confirm('¿Dar de baja este producto? (Ya no aparecerá en ventas)')) {
        try {
            const respuesta = await fetch(`http://localhost:3000/api/productos/${id}/baja`, { method: 'PUT' });
            if (respuesta.ok) {
                cargarProductos(); // Refresca la tabla
            } else {
                alert('No se pudo borrar el producto.');
            }
        } catch (error) {
            console.error(error);
        }
    }
}